import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import CitySelector from '../components/part3/controls/CitySelector.jsx'
import LocationSearch from '../components/part3/controls/LocationSearch.jsx'
import PreferenceFilters from '../components/part3/controls/PreferenceFilters.jsx'
import RapidToggle from '../components/part3/controls/RapidToggle.jsx'
import SpeedSelector from '../components/part3/controls/SpeedSelector.jsx'
import TravelSpeedSelector from '../components/part3/controls/TravelSpeedSelector.jsx'
import NeighbourhoodMap from '../components/part3/map/NeighbourhoodMap.jsx'
import ServiceAreaLegend from '../components/part3/map/ServiceAreaLegend.jsx'
import ResultPanel from '../components/part3/panels/ResultPanel.jsx'
import Part3Notes from '../components/part3/sections/Part3Notes.jsx'
import ToolIntro from '../components/part3/sections/ToolIntro.jsx'
import { TIME_BAND_OPTIONS, getSpeedOption, getTravelBandRadiusKm, getTravelSpeedOption } from '../components/part3/shared/part3Shared.js'
import { PART3_CITY_CONFIGS as CITY_CONFIGS, usePart3Dataset } from '../hooks/usePart3Dataset'
import { haversineDistanceKm, getFeatureCenter } from '../utils/geoUtils'

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function toPercentLabel(part, total) {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function formatDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) return 'No match'
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1)} km`
}

function formatRadiusLabel(radiusKm) {
  if (!Number.isFinite(radiusKm)) return '0 km'
  return `${radiusKm.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} km`
}

function hasTwentyFourSevenText(...values) {
  return values.some((value) => /24\s*\/\s*7|24\s*hours?|24hrs/i.test(String(value || '')))
}

function isFreeToUse(usageCost) {
  return /free|no charge|£?\s*0(?:\.0+)?(?:\b|\/)/i.test(String(usageCost || ''))
}

function getConnectionSummary(connections = []) {
  const labels = []
  const quantities = new Map()

  connections.forEach((connection) => {
    const label = getConnectionTypeLabel(connection.ConnectionTypeID)
    if (!label) return

    const quantity = Number(connection.Quantity || 1) || 1
    quantities.set(label, (quantities.get(label) || 0) + quantity)
  })

  quantities.forEach((quantity, label) => {
    labels.push(quantity > 1 ? `${label} x${quantity}` : label)
  })

  return labels.length ? labels.join(', ') : 'Connector type not stated'
}

function getPointCapacity(row) {
  const directPoints = parseInteger(row.NumberOfPoints)
  if (directPoints) return directPoints

  const totalQuantity = (row.Connections || []).reduce((sum, connection) => {
    const quantity = parseInteger(connection.Quantity)
    return sum + (quantity || 1)
  }, 0)

  return totalQuantity || null
}

function getMaxPower(row) {
  const values = (row.Connections || [])
    .map((connection) => parseMaxKw(connection.PowerKW))
    .filter((value) => value != null)

  return values.length ? Math.max(...values) : null
}

function matchesSpeedFilter(feature, speedFilter) {
  if (speedFilter === 'all') return true
  return feature.properties?.speedBand === speedFilter
}

function applyPreferenceFilters(features, preferences) {
  return features.filter((feature) => {
    const props = feature.properties || {}

    if (preferences.publicOnly && !props.publicAccess) return false
    if (preferences.alwaysOpenOnly && !props.alwaysOpen) return false
    if (preferences.knownCapacityOnly && !props.capacity) return false
    if (preferences.freeOnly && !props.feeFree) return false

    return true
  })
}

function matchesCurrentFilters(feature, speedFilter, preferences) {
  return matchesSpeedFilter(feature, speedFilter) && applyPreferenceFilters([feature], preferences).length > 0
}

function buildOcmDataset(city, payloads) {
  const features = []
  const seenIds = new Set()

  payloads.flat().forEach((row, index) => {
    const info = row.AddressInfo || {}
    const lat = Number(info.Latitude)
    const lng = Number(info.Longitude)
    const sourceId = row.ID || row.UUID || `${city.id}-${index}`

    if (!isValidUkCoordinate(lng, lat) || seenIds.has(sourceId)) return
    seenIds.add(sourceId)

    const stationName = info.Title || 'Unnamed charging station'
    const town = normaliseTown(info.Town)
    const postcode = normalisePostcode(info.Postcode)
    const maxKw = getMaxPower(row)
    const speedBand = inferSpeedBand(maxKw)
    const usageTypeId = row.UsageTypeID != null ? Number(row.UsageTypeID) : null
    const statusId =
      row.StatusTypeID != null
        ? Number(row.StatusTypeID)
        : row.Connections?.find((connection) => connection.StatusTypeID != null)?.StatusTypeID ?? 0
    const operatorLabel = inferOperatorLabel(row, stationName)
    const providerKey = String(row.OperatorID ?? row.OperatorsReference ?? operatorLabel)
    const capacity = getPointCapacity(row)
    const usageCost = row.UsageCost || null
    const accessComments = info.AccessComments || null
    const generalComments = row.GeneralComments || null
    const connectorSummary = getConnectionSummary(row.Connections || [])
    const alwaysOpen = hasTwentyFourSevenText(generalComments, accessComments)

    features.push({
      type: 'Feature',
      id: `ocm-${city.id}-${sourceId}`,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        cityId: city.id,
        cityLabel: city.label,
        stationName,
        operatorKey: providerKey,
        operatorLabel,
        town,
        postcode,
        addressLine1: info.AddressLine1 || null,
        addressLine2: info.AddressLine2 || null,
        accessComments,
        relatedUrl: info.RelatedURL || null,
        maxKw,
        speedBand,
        speedLabel: getSpeedLabel(speedBand, maxKw),
        rapidLikely: speedBand === 'rapid' || speedBand === 'ultra',
        capacity,
        charge: usageCost,
        usageCost,
        publicAccess: isPublicAccess(usageTypeId),
        accessLabel: getUsageTypeLabel(usageTypeId),
        openingHours: alwaysOpen ? '24/7 (from comments)' : null,
        alwaysOpen,
        feeLabel: usageCost ? usageCost : 'Cost not stated',
        feeFree: isFreeToUse(usageCost),
        connectorSummary,
        dataSource: 'OCM',
        statusId,
        statusLabel: getStatusLabel(statusId),
        usageTypeId,
        usageTypeLabel: getUsageTypeLabel(usageTypeId),
        generalComments,
        lastStatusDate: row.DateLastStatusUpdate || row.DateLastVerified || row.DateCreated || null,
        qualityLabel:
          row.DataQualityLevel != null ? `Quality level ${row.DataQualityLevel}` : 'Quality not stated',
        searchText: [
          stationName,
          operatorLabel,
          town,
          postcode,
          info.AddressLine1,
          info.AddressLine2,
          connectorSummary,
          usageCost,
          generalComments,
          accessComments,
          getStatusLabel(statusId),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      },
    })
  })

  return { type: 'FeatureCollection', features }
}

function buildStationProfile(feature, anchorCoordinates) {
  if (!feature) return null

  const props = feature.properties || {}
  const distanceKm = anchorCoordinates ? haversineDistanceKm(anchorCoordinates, feature.geometry.coordinates) : null
  const tags = [
    props.speedLabel,
    props.statusLabel,
    props.publicAccess ? 'Publicly usable' : null,
    props.alwaysOpen ? '24/7' : null,
    props.dataSource ? `${props.dataSource} source` : null,
  ].filter(Boolean)

  const noteParts = [props.generalComments, props.accessComments].filter(Boolean)

  return {
    title: 'Detailed station snapshot',
    distanceLabel: distanceKm == null ? 'Reference point' : formatDistanceLabel(distanceKm),
    name: props.stationName,
    subtitle: [props.operatorLabel, props.postcode, props.town].filter(Boolean).join(' · '),
    tags,
    stats: [
      { label: 'Power', value: props.speedLabel || 'Not stated' },
      { label: 'Bay count', value: props.capacity ? `${props.capacity}` : 'Unknown' },
      { label: 'Status', value: props.statusLabel || 'Not stated' },
      { label: 'Access', value: props.accessLabel || 'Not stated' },
      { label: 'Price', value: props.feeLabel || 'Not stated' },
      { label: 'Connectors', value: props.connectorSummary || 'Unknown' },
    ],
    note:
      noteParts.length > 0
        ? noteParts.join(' ')
        : 'This profile is derived from Open Charge Map metadata, so missing values indicate data coverage limits rather than confirmed absence.',
  }
}

function buildTravelBandSummary({ anchor, visibleStations, travelSpeedId }) {
  const anchorCoordinates = anchor?.coordinates
  const travelSpeed = getTravelSpeedOption(travelSpeedId)

  if (!anchorCoordinates) {
    return TIME_BAND_OPTIONS.map((band) => ({
      ...band,
      count: 0,
      countLabel: '0',
      radiusKm: getTravelBandRadiusKm(band.minutes, travelSpeed.kmPerHour),
      radiusLabel: '0 km',
      note: 'Select a point to estimate travel-time reach.',
    }))
  }

  const rankedVisible = visibleStations
    .map((feature) => ({
      feature,
      distanceKm: haversineDistanceKm(anchorCoordinates, feature.geometry.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return TIME_BAND_OPTIONS.map((band) => {
    const radiusKm = getTravelBandRadiusKm(band.minutes, travelSpeed.kmPerHour)
    const reachableCount = rankedVisible.filter((item) => item.distanceKm <= radiusKm).length

    return {
      ...band,
      count: reachableCount,
      countLabel: `${reachableCount.toLocaleString()}`,
      radiusKm,
      radiusLabel: formatRadiusLabel(radiusKm),
      note: `${formatRadiusLabel(radiusKm)} radius @ ${travelSpeed.kmPerHour} km/h`,
    }
  })
}

function buildScoreSummary({
  city,
  anchor,
  visibleStations,
  allStations,
  speedFilter,
  rapidPriority,
}) {
  const speedOption = getSpeedOption(speedFilter)
  const anchorCoordinates = anchor?.coordinates

  const rankedVisible = visibleStations
    .map((feature) => ({
      feature,
      distanceKm: haversineDistanceKm(anchorCoordinates, feature.geometry.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  const rankedAll = allStations
    .map((feature) => ({
      feature,
      distanceKm: haversineDistanceKm(anchorCoordinates, feature.geometry.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  const visibleWithinCatchment = rankedVisible.filter((item) => item.distanceKm <= speedOption.radiusKm)
  const rapidFallback = rankedAll.filter(
    (item) => item.distanceKm <= 5 && item.feature.properties?.rapidLikely,
  )
  const providerCount = new Set(
    rankedAll
      .filter((item) => item.distanceKm <= Math.max(3, speedOption.radiusKm))
      .map((item) => item.feature.properties?.operatorKey)
      .filter(Boolean),
  ).size
  const knownStatusCount = visibleWithinCatchment.filter((item) => item.feature.properties?.statusId === 50).length

  const nearestVisible = rankedVisible[0] || null
  const targetCount =
    speedFilter === 'ultra' ? 2 : speedFilter === 'rapid' ? 3 : speedFilter === 'local' ? 4 : 6
  const countScore = clamp((visibleWithinCatchment.length / targetCount) * 100)
  const distancePenalty =
    speedFilter === 'ultra' ? 9 : speedFilter === 'rapid' ? 14 : speedFilter === 'local' ? 28 : 22
  const distanceScore = clamp(100 - (nearestVisible?.distanceKm ?? 10) * distancePenalty)
  const rapidScore = clamp((rapidFallback.length / 3) * 100)
  const providerScore = clamp((providerCount / 4) * 100)

  const score = Math.round(
    rapidPriority
      ? countScore * 0.24 + distanceScore * 0.2 + rapidScore * 0.4 + providerScore * 0.16
      : countScore * 0.4 + distanceScore * 0.24 + rapidScore * 0.14 + providerScore * 0.22,
  )

  const scoreBand = score >= 74 ? 'strong' : score >= 49 ? 'moderate' : 'limited'
  const scoreBandLabel =
    scoreBand === 'strong' ? 'Strong access' : scoreBand === 'moderate' ? 'Mixed access' : 'Limited access'

  const headlineByBand = {
    strong:
      'This looks like a comparatively well-served neighbourhood for the selected charging need, with multiple viable options in reach.',
    moderate:
      'Access is workable but uneven. The area has some usable options, though resilience may depend on a small number of sites.',
    limited:
      'This point reads as constrained for the selected need. Nearby availability is thin, and residents may depend on a longer trip.',
  }

  const interpretationByMode = rapidPriority
    ? 'Because rapid need is prioritised, the score gives extra weight to whether quick-turnaround charging is available within a wider urban trip.'
    : 'Because routine local charging is prioritised, the score gives extra weight to how many suitable chargers sit close to everyday residential movement.'

  return {
    score,
    scoreBand,
    scoreBandLabel,
    headline: headlineByBand[scoreBand],
    interpretation: `${interpretationByMode} In ${city.label}, the selected point currently has ${
      visibleWithinCatchment.length
    } matching charger${visibleWithinCatchment.length === 1 ? '' : 's'} inside the active ${
      speedOption.radiusKm
    } km catchment, with ${knownStatusCount} explicitly marked as operational in the source metadata.`,
    visibleCountLabel: `${visibleWithinCatchment.length}`,
    visibleCountNote: `${speedOption.label} chargers inside ${speedOption.radiusKm} km.`,
    nearestLabel: nearestVisible ? formatDistanceLabel(nearestVisible.distanceKm) : 'No match',
    nearestNote: nearestVisible
      ? `${nearestVisible.feature.properties.stationName} is the closest suitable charger.`
      : 'No charger in the current speed band was found nearby.',
    rapidFallbackLabel: `${rapidFallback.length}`,
    rapidFallbackNote: 'Rapid or ultra-rapid chargers within a 5 km fallback area.',
    operatorCountLabel: `${providerCount}`,
    operatorCountNote: 'Distinct provider references in the wider local context.',
    catchmentLabel: `${speedOption.label} within ${speedOption.radiusKm} km`,
    nearbyStations: visibleWithinCatchment.slice(0, 4).map(({ feature, distanceKm }) => ({
      id: feature.id,
      name: feature.properties.stationName,
      operator: feature.properties.operatorLabel,
      postcode: feature.properties.postcode,
      distanceLabel: formatDistanceLabel(distanceKm),
      speedLabel: feature.properties.speedLabel,
    })),
  }
}

export default function Part3() {
  const { datasetByCity, loading, error } = usePart3Dataset()
  const [activeCityId, setActiveCityId] = useState('london')
  const [speedFilter, setSpeedFilter] = useState('all')
  const [travelSpeedId, setTravelSpeedId] = useState('15')
  const [rapidPriority, setRapidPriority] = useState(true)
  const [preferences, setPreferences] = useState({
    publicOnly: false,
    alwaysOpenOnly: false,
    knownCapacityOnly: false,
    freeOnly: false,
  })
  const [mapPanelHeight, setMapPanelHeight] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedStationId, setSelectedStationId] = useState(null)
  const [customAnchor, setCustomAnchor] = useState(null)

  useEffect(() => {
    setSelectedStationId(null)
    setCustomAnchor(null)
    setSearchQuery('')
  }, [activeCityId])

  const citySummaries = useMemo(() => {
    return CITY_CONFIGS.map((city) => {
      const features = datasetByCity[city.id]?.features || []
      const rapidCount = features.filter((feature) => feature.properties?.rapidLikely).length
      const alwaysOpenCount = features.filter((feature) => feature.properties?.alwaysOpen).length
      const capacityKnownCount = features.filter((feature) => feature.properties?.capacity).length
      const pricingKnownCount = features.filter((feature) => feature.properties?.usageCost).length
      const statusKnownCount = features.filter((feature) => feature.properties?.statusId && feature.properties.statusId !== 0).length
      const center = getFeatureCenter(features, [-0.12, 51.5])

      return {
        ...city,
        center,
        stationCount: features.length,
        stationCountLabel: `${features.length.toLocaleString()} OCM sites`,
        rapidShareLabel: features.length ? `${((rapidCount / features.length) * 100).toFixed(1)}%` : '0%',
        rapidNote: rapidCount
          ? `${rapidCount.toLocaleString()} rapid or ultra-rapid entries appear in the current OCM extract.`
          : 'Rapid charging is limited in the currently loaded extract.',
        coverageStats: [
          { label: 'Pricing stated', value: toPercentLabel(pricingKnownCount, features.length) },
          { label: 'Status stated', value: toPercentLabel(statusKnownCount, features.length) },
          { label: 'Bay count known', value: toPercentLabel(capacityKnownCount, features.length) },
          { label: '24/7 tagged', value: toPercentLabel(alwaysOpenCount, features.length) },
        ],
      }
    })
  }, [datasetByCity])

  const activeCity = useMemo(
    () => citySummaries.find((city) => city.id === activeCityId) || citySummaries[0] || CITY_CONFIGS[0],
    [activeCityId, citySummaries],
  )

  const allStations = useMemo(() => datasetByCity[activeCityId]?.features || [], [activeCityId, datasetByCity])

  const visibleStations = useMemo(() => {
    const speedFiltered = allStations.filter((feature) => matchesSpeedFilter(feature, speedFilter))
    return applyPreferenceFilters(speedFiltered, preferences)
  }, [allStations, preferences, speedFilter])

  const selectedStation = useMemo(
    () => allStations.find((feature) => String(feature.id) === String(selectedStationId)) || null,
    [allStations, selectedStationId],
  )

  const anchor = useMemo(() => {
    if (selectedStation) {
      return {
        label: selectedStation.properties.stationName,
        coordinates: selectedStation.geometry.coordinates,
        source: 'station',
      }
    }

    if (customAnchor?.coordinates) return customAnchor

    return {
      label: `${activeCity?.label || 'City'} focus area`,
      coordinates: activeCity?.center || [-0.12, 51.5],
      source: 'city',
    }
  }, [activeCity, customAnchor, selectedStation])

  const searchResults = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    if (!query) return []

    return applyPreferenceFilters(
      allStations.filter((feature) => matchesSpeedFilter(feature, speedFilter)),
      preferences,
    )
      .filter((feature) => feature.properties?.searchText?.includes(query))
      .slice(0, 6)
  }, [allStations, deferredSearchQuery, preferences, speedFilter])

  useEffect(() => {
    if (!selectedStation) return
    if (matchesCurrentFilters(selectedStation, speedFilter, preferences)) return
    setSelectedStationId(null)
  }, [preferences, selectedStation, speedFilter])

  const resultSummary = useMemo(() => {
    if (!activeCity || !anchor?.coordinates) return null

    return buildScoreSummary({
      city: activeCity,
      anchor,
      visibleStations,
      allStations,
      speedFilter,
      rapidPriority,
    })
  }, [activeCity, allStations, anchor, rapidPriority, speedFilter, visibleStations])

  const referenceStation = useMemo(() => {
    if (selectedStation) return selectedStation
    if (!anchor?.coordinates || !visibleStations.length) return null

    return [...visibleStations]
      .map((feature) => ({
        feature,
        distanceKm: haversineDistanceKm(anchor.coordinates, feature.geometry.coordinates),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.feature || null
  }, [anchor, selectedStation, visibleStations])

  const stationProfile = useMemo(
    () => buildStationProfile(referenceStation, anchor?.coordinates),
    [anchor, referenceStation],
  )

  const travelBands = useMemo(
    () =>
      buildTravelBandSummary({
        anchor,
        visibleStations,
        travelSpeedId,
      }),
    [anchor, travelSpeedId, visibleStations],
  )

  const travelSpeed = useMemo(() => getTravelSpeedOption(travelSpeedId), [travelSpeedId])

  const cityContext = useMemo(() => activeCity?.coverageStats || [], [activeCity])

  const onSelectSearchResult = (feature) => {
    if (!matchesSpeedFilter(feature, speedFilter)) {
      setSpeedFilter('all')
    }
    setSelectedStationId(feature.id)
    setCustomAnchor(null)
  }

  if (loading) {
    return (
      <section className="part3-page">
        <div className="part3-wrap">
          <p className="part3-loading">Loading neighbourhood tool...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="part3-page">
        <div className="part3-wrap">
          <p className="part3-loading">Failed to load Part 3 data: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <div className="part3-page">
      <section className="part3-shell">
        <div className="part3-wrap">
          <ToolIntro activeCity={activeCity} citySummary={activeCity} />

          <div className="part3-control-grid">
            <CitySelector cities={citySummaries} activeCityId={activeCityId} onChange={setActiveCityId} />
            <SpeedSelector activeSpeed={speedFilter} onChange={setSpeedFilter} />
            <TravelSpeedSelector activeSpeed={travelSpeedId} onChange={setTravelSpeedId} />
            <RapidToggle rapidPriority={rapidPriority} onChange={setRapidPriority} />
            <PreferenceFilters
              preferences={preferences}
              onToggle={(key) =>
                setPreferences((current) => ({
                  ...current,
                  [key]: !current[key],
                }))
              }
            />
            <LocationSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onSelectResult={onSelectSearchResult}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="part3-main-grid">
            <NeighbourhoodMap
              city={activeCity}
              stations={visibleStations}
              selectedStation={selectedStation}
              anchor={anchor}
              speedFilter={speedFilter}
              travelSpeedId={travelSpeedId}
              onPanelResize={setMapPanelHeight}
              onSelectStation={(stationId) => {
                setSelectedStationId(stationId)
                setCustomAnchor(null)
              }}
              onSelectPoint={(point) => {
                setSelectedStationId(null)
                setCustomAnchor(point)
              }}
            />

            <ResultPanel
              city={activeCity}
              summary={resultSummary}
              anchor={anchor}
              travelBands={travelBands}
              travelSpeed={travelSpeed}
              stationProfile={stationProfile}
              cityContext={cityContext}
              panelHeight={mapPanelHeight}
            />
          </div>

          <ServiceAreaLegend speedFilter={speedFilter} rapidPriority={rapidPriority} />
          <Part3Notes />
        </div>
      </section>
    </div>
  )
}
