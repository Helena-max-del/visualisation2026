import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { loadJson } from '../../utils/loadData'

const FALLBACK_TOKEN =
  'pk.eyJ1Ijoic2hpcmxleTk1NSIsImEiOiJjbWdmOWZ2NXcwNHVjMmlzOTY2bnQxODB4In0.GhGDYYSRrDKQd9NNbvrFyw'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN

const cityConfigs = [
  {
    id: 'london',
    name: 'London',
    center: [-0.1276, 51.5072],
    dataPath: '/data/part1/london_charging_osm.geojson',
    summary:
      'London has the densest mapped charging network, with visible clusters around inner-city destinations, major roads, and borough town centres.',
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    center: [-2.9916, 53.4084],
    dataPath: '/data/part1/liverpool_charging_osm.geojson',
    summary:
      'Liverpool has a smaller mapped network, so the distribution is easier to read as a set of concentrated city-centre, waterfront, and strategic-road facilities.',
  },
  {
    id: 'leeds',
    name: 'Leeds',
    center: [-1.5491, 53.8008],
    dataPath: '/data/part1/leeds_charging_osm.geojson',
    summary:
      'Leeds sits between the two cases, with charging points spread across the centre, ring-road corridors, and retail or destination clusters.',
  },
]

function blankFeatureCollection() {
  return { type: 'FeatureCollection', features: [] }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char]
  })
}

function extractNumericKw(value) {
  if (!value) return null
  const matches = String(value).match(/(\d+(?:\.\d+)?)\s*kW/gi)
  if (!matches?.length) return null
  return Math.max(...matches.map((match) => Number(match.replace(/[^0-9.]/g, '')) || 0))
}

function normaliseStationData(collection, cityName) {
  const features = (collection?.features || [])
    .filter((feature) => feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates))
    .map((feature, index) => {
      const props = feature.properties || {}
      const maxKw = extractNumericKw(props.max_output)
      const rapidLikely = Boolean(maxKw >= 50 || props.socket_chademo || props.socket_ccs)

      return {
        ...feature,
        id: feature.id || `${cityName}-${index}`,
        properties: {
          ...props,
          city: cityName,
          maxKw: maxKw ?? null,
          rapidLikely,
          operatorLabel: props.operator || props.brand || 'Unknown',
        },
      }
    })

  return {
    type: 'FeatureCollection',
    features,
  }
}

function buildBounds(features) {
  if (!features.length) return null

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((feature) => {
    const [lng, lat] = feature.geometry.coordinates
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function getTopOperators(features) {
  const counts = new Map()

  features.forEach((feature) => {
    const key = feature.properties?.operatorLabel || 'Unknown'
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
}

function buildPopupHtml(feature) {
  const props = feature.properties || {}
  const name = escapeHtml(props.name || 'Charging station')
  const operator = escapeHtml(props.operatorLabel || 'Unknown operator')
  const lines = [
    `<p class="part1-city-popup__name">${name}</p>`,
    `<p class="part1-city-popup__meta">${operator}</p>`,
  ]

  if (props.maxKw) {
    lines.push(`<p class="part1-city-popup__meta">Max observed output: ${escapeHtml(props.maxKw)} kW</p>`)
  }

  if (props.addr_street || props.addr_postcode) {
    const address = [props.addr_street, props.addr_postcode].filter(Boolean).map(escapeHtml).join(', ')
    lines.push(`<p class="part1-city-popup__meta">${address}</p>`)
  }

  return `<div class="part1-city-popup">${lines.join('')}</div>`
}

export default function CityFacilitiesGlobe() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const markersRef = useRef([])
  const spinTimeoutRef = useRef(null)
  const userInteractingRef = useRef(false)
  const worldViewRef = useRef(true)
  const [datasetByCity, setDatasetByCity] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCityId, setActiveCityId] = useState('london')
  const [worldView, setWorldView] = useState(true)
  const [displayMode, setDisplayMode] = useState('points')
  const [rapidOnly, setRapidOnly] = useState(false)

  const activeCity = useMemo(
    () => cityConfigs.find((city) => city.id === activeCityId) || cityConfigs[0],
    [activeCityId],
  )

  useEffect(() => {
    worldViewRef.current = worldView
  }, [worldView])

  useEffect(() => {
    let alive = true

    Promise.all(cityConfigs.map((city) => loadJson(city.dataPath)))
      .then((payloads) => {
        if (!alive) return

        const nextState = {}
        cityConfigs.forEach((city, index) => {
          nextState[city.id] = normaliseStationData(payloads[index], city.name)
        })

        setDatasetByCity(nextState)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setDatasetByCity({})
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const filteredGeoJson = useMemo(() => {
    const raw = datasetByCity[activeCityId] || blankFeatureCollection()
    if (!rapidOnly) return raw

    return {
      ...raw,
      features: raw.features.filter((feature) => feature.properties?.rapidLikely),
    }
  }, [activeCityId, datasetByCity, rapidOnly])

  const cityStats = useMemo(() => {
    const features = filteredGeoJson.features || []
    const rapidCount = features.filter((feature) => feature.properties?.rapidLikely).length
    const uniqueOperators = new Set(
      features.map((feature) => feature.properties?.operatorLabel).filter(Boolean),
    ).size

    return {
      stationCount: features.length,
      rapidCount,
      rapidShare: features.length ? (rapidCount / features.length) * 100 : 0,
      operatorCount: uniqueOperators,
      topOperators: getTopOperators(features),
      sampleStations: features
        .filter((feature) => feature.properties?.name)
        .slice(0, 4)
        .map((feature) => feature.properties.name),
    }
  }, [filteredGeoJson])

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-1.8, 53.7],
      zoom: 2.4,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      antialias: true,
    })

    mapRef.current = map
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'part1-city-map-popup',
    })

    const spinGlobe = () => {
      const liveMap = mapRef.current
      if (!liveMap || userInteractingRef.current || !worldViewRef.current) return
      if (liveMap.getZoom() > 3.4) return

      const center = liveMap.getCenter()
      center.lng -= 10
      liveMap.easeTo({
        center,
        duration: 1200,
        easing: (value) => value,
      })
    }

    const queueSpin = () => {
      window.clearTimeout(spinTimeoutRef.current)
      spinTimeoutRef.current = window.setTimeout(spinGlobe, 1400)
    }

    map.on('style.load', () => {
      map.setProjection('globe')
      map.setFog({
        color: 'rgb(189, 210, 234)',
        'high-color': 'rgb(25, 48, 83)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(8, 10, 20)',
        'star-intensity': 0.6,
      })

      map.addSource('part1-city-stations', {
        type: 'geojson',
        data: blankFeatureCollection(),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 42,
      })

      map.addLayer({
        id: 'part1-city-stations-heat',
        type: 'heatmap',
        source: 'part1-city-stations',
        layout: { visibility: 'none' },
        maxzoom: 12,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'point_count'], 1],
            1,
            0.1,
            40,
            1,
          ],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1.2],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(236, 231, 220, 0)',
            0.25,
            '#f2d37f',
            0.5,
            '#df9f3a',
            0.75,
            '#c8742c',
            1,
            '#4f7af2',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 18, 10, 34],
          'heatmap-opacity': 0.86,
        },
      })

      map.addLayer({
        id: 'part1-city-stations-clusters',
        type: 'circle',
        source: 'part1-city-stations',
        filter: ['has', 'point_count'],
        layout: { visibility: 'visible' },
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#f2d37f', 20, '#df9f3a', 60, '#4f7af2'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 60, 30],
          'circle-stroke-color': 'rgba(255,255,255,0.88)',
          'circle-stroke-width': 1.5,
        },
      })

      map.addLayer({
        id: 'part1-city-stations-cluster-count',
        type: 'symbol',
        source: 'part1-city-stations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#23262d',
        },
      })

      map.addLayer({
        id: 'part1-city-stations-points',
        type: 'circle',
        source: 'part1-city-stations',
        filter: ['!', ['has', 'point_count']],
        layout: { visibility: 'visible' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4.5, 12, 7.5],
          'circle-color': ['case', ['==', ['get', 'rapidLikely'], true], '#4f7af2', '#f2d37f'],
          'circle-stroke-color': 'rgba(255,255,255,0.92)',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.92,
        },
      })

      map.on('mouseenter', 'part1-city-stations-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'part1-city-stations-points', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'part1-city-stations-clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'part1-city-stations-clusters', () => {
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'part1-city-stations-clusters', (event) => {
        const feature = event.features?.[0]
        if (!feature) return
        const source = map.getSource('part1-city-stations')
        const clusterId = feature.properties?.cluster_id
        if (!source || clusterId == null) return

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return
          map.easeTo({
            center: feature.geometry.coordinates,
            zoom,
            duration: 900,
          })
        })
      })

      map.on('click', 'part1-city-stations-points', (event) => {
        const feature = event.features?.[0]
        if (!feature) return

        popupRef.current
          ?.setLngLat(feature.geometry.coordinates)
          .setHTML(buildPopupHtml(feature))
          .addTo(map)
      })

      map.on('dragstart', () => {
        userInteractingRef.current = true
        window.clearTimeout(spinTimeoutRef.current)
      })
      map.on('rotatestart', () => {
        userInteractingRef.current = true
        window.clearTimeout(spinTimeoutRef.current)
      })
      map.on('pitchstart', () => {
        userInteractingRef.current = true
        window.clearTimeout(spinTimeoutRef.current)
      })
      map.on('moveend', () => {
        if (worldViewRef.current) {
          userInteractingRef.current = false
          queueSpin()
        }
      })

      cityConfigs.forEach((city) => {
        const markerButton = document.createElement('button')
        markerButton.className = 'part1-city-marker'
        markerButton.type = 'button'
        markerButton.innerHTML = `<span></span><strong>${city.name}</strong>`
        markerButton.setAttribute('aria-label', city.name)
        markerButton.addEventListener('click', () => {
          setActiveCityId(city.id)
          setWorldView(false)
        })

        const marker = new mapboxgl.Marker({
          element: markerButton,
          anchor: 'bottom',
        })
          .setLngLat(city.center)
          .addTo(map)

        markersRef.current.push({ cityId: city.id, marker, element: markerButton })
      })

      queueSpin()
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')

    return () => {
      window.clearTimeout(spinTimeoutRef.current)
      popupRef.current?.remove()
      popupRef.current = null
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [loading])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(({ cityId, element }) => {
      element.classList.toggle('is-active', cityId === activeCityId && !worldView)
    })
  }, [activeCityId, worldView])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('part1-city-stations')
    if (!source) return

    source.setData(worldView ? blankFeatureCollection() : filteredGeoJson)

    if (map.getLayer('part1-city-stations-heat')) {
      map.setLayoutProperty(
        'part1-city-stations-heat',
        'visibility',
        displayMode === 'heatmap' ? 'visible' : 'none',
      )
    }
    if (map.getLayer('part1-city-stations-clusters')) {
      map.setLayoutProperty(
        'part1-city-stations-clusters',
        'visibility',
        displayMode === 'points' ? 'visible' : 'none',
      )
    }
    if (map.getLayer('part1-city-stations-cluster-count')) {
      map.setLayoutProperty(
        'part1-city-stations-cluster-count',
        'visibility',
        displayMode === 'points' ? 'visible' : 'none',
      )
    }
    if (map.getLayer('part1-city-stations-points')) {
      map.setLayoutProperty(
        'part1-city-stations-points',
        'visibility',
        displayMode === 'points' ? 'visible' : 'none',
      )
    }
  }, [displayMode, filteredGeoJson, worldView])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    if (worldView) {
      popupRef.current?.remove()
      map.easeTo({
        center: [-1.8, 53.7],
        zoom: 2.4,
        pitch: 0,
        bearing: 0,
        duration: 1600,
        essential: true,
      })
      return
    }

    const bounds = buildBounds(filteredGeoJson.features)
    if (bounds) {
      map.fitBounds(bounds, {
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        duration: 1800,
        pitch: 42,
        bearing: activeCity.id === 'london' ? -12 : -20,
        essential: true,
      })
    } else {
      map.flyTo({
        center: activeCity.center,
        zoom: 9.5,
        pitch: 42,
        bearing: activeCity.id === 'london' ? -12 : -20,
        duration: 1600,
        essential: true,
      })
    }
  }, [activeCity, filteredGeoJson, worldView])

  if (loading) {
    return (
      <section className="glass-card part1-city-globe">
        <div className="part1-city-loading">Loading city charging map...</div>
      </section>
    )
  }

  return (
    <section className="glass-card part1-city-globe">
      <div className="part1-city-head">
        <div>
          <p className="eyebrow">City case studies</p>
          <h2 className="part1-city-title">Where are charging facilities concentrated in major cities?</h2>
          <p className="part1-city-intro">
            The regional trend is broad, so this map zooms into three urban examples. Start from the rotating globe,
            then compare London, Liverpool, and Leeds through clustered points or a heatmap.
          </p>
        </div>

        <div className="part1-city-control-row">
          <button
            type="button"
            className={displayMode === 'points' ? 'part1-city-pill is-active' : 'part1-city-pill'}
            onClick={() => setDisplayMode('points')}
          >
            Point clusters
          </button>
          <button
            type="button"
            className={displayMode === 'heatmap' ? 'part1-city-pill is-active' : 'part1-city-pill'}
            onClick={() => setDisplayMode('heatmap')}
          >
            Heatmap
          </button>
          <button
            type="button"
            className={rapidOnly ? 'part1-city-pill is-active' : 'part1-city-pill'}
            onClick={() => setRapidOnly((value) => !value)}
          >
            {rapidOnly ? 'Rapid-capable only' : 'All mapped stations'}
          </button>
          <button type="button" className="part1-city-pill" onClick={() => setWorldView(true)}>
            Reset globe
          </button>
        </div>
      </div>

      <div className="part1-city-layout">
        <div className="part1-city-map-shell">
          <div ref={mapContainerRef} className="part1-city-map-canvas" />
          <div className="part1-city-map-caption">
            <span><i className="part1-city-legend-dot is-rapid" /> Likely rapid-capable station</span>
            <span><i className="part1-city-legend-dot is-standard" /> Other mapped charging station</span>
            <span><i className="part1-city-legend-dot is-city" /> City marker</span>
          </div>
        </div>

        <aside className="part1-city-panel">
          <div className="part1-city-tabs">
            {cityConfigs.map((city) => (
              <button
                key={city.id}
                type="button"
                className={city.id === activeCityId ? 'part1-city-tab is-active' : 'part1-city-tab'}
                onClick={() => {
                  setActiveCityId(city.id)
                  setWorldView(false)
                }}
              >
                {city.name}
              </button>
            ))}
          </div>

          <div className="part1-city-summary">
            <p className="part1-city-kicker">Selected city</p>
            <h3>{activeCity.name}</h3>
            <p>{activeCity.summary}</p>
          </div>

          <div className="part1-city-stats">
            <article>
              <span>Mapped stations</span>
              <strong>{formatNumber(cityStats.stationCount)}</strong>
            </article>
            <article>
              <span>Rapid-capable share</span>
              <strong>{formatPercent(cityStats.rapidShare)}</strong>
            </article>
            <article>
              <span>Rapid-capable points</span>
              <strong>{formatNumber(cityStats.rapidCount)}</strong>
            </article>
            <article>
              <span>Named operators</span>
              <strong>{formatNumber(cityStats.operatorCount)}</strong>
            </article>
          </div>

          <div className="part1-city-list-block">
            <div className="part1-city-list-head">
              <p className="part1-city-kicker">Top operators</p>
              <span>{rapidOnly ? 'Rapid-capable filter' : 'All mapped stations'}</span>
            </div>
            <div className="part1-city-operator-list">
              {cityStats.topOperators.map(([name, count]) => (
                <div key={name} className="part1-city-operator-row">
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="part1-city-list-block">
            <p className="part1-city-kicker">Example mapped stations</p>
            <ul>
              {cityStats.sampleStations.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>

          <p className="part1-city-source">
            Point data: OpenStreetMap features tagged <code>amenity=charging_station</code>. Read this as an
            exploratory distribution layer rather than an official audited inventory.
          </p>
        </aside>
      </div>
    </section>
  )
}
