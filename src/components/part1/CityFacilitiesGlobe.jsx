import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { loadJson } from '../../utils/loadData'

const FALLBACK_TOKEN =
  'pk.eyJ1Ijoic2hpcmxleTk1NSIsImEiOiJjbWdmOWZ2NXcwNHVjMmlzOTY2bnQxODB4In0.GhGDYYSRrDKQd9NNbvrFyw'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN

const OVERVIEW_VIEW = {
  center: [0.4, 56.15],
  zoom: 3.05,
}

const OVERVIEW_PRESENTATION_VIEW = {
  center: OVERVIEW_VIEW.center,
  zoom: OVERVIEW_VIEW.zoom + 0.2,
  pitch: 0,
  bearing: 0,
}

const AUTO_TOUR_START_DELAY_MS = 2600
const AUTO_TOUR_STEP_MS = 5200

const cityConfigs = [
  {
    id: 'london',
    name: 'London',
    center: [-0.1276, 51.5072],
    focusZoom: 14.2,
    cinematicBearing: -10,
    dataPath: '/data/part1/london_charging_osm.geojson',
    summary:
      'London has the densest mapped charging network, with visible clusters around inner-city destinations, major roads, and borough town centres.',
  },
  {
    id: 'birmingham',
    name: 'Birmingham',
    center: [-1.8904, 52.4862],
    focusZoom: 13.9,
    cinematicBearing: 8,
    dataPath: '/data/part1/birmingham_charging_osm.geojson',
    summary:
      'Birmingham shows a dispersed charging network across the city centre, major retail parks, and strategic road corridors, reflecting its role as the UK\'s second-largest city.',
  },
  {
    id: 'leeds',
    name: 'Leeds',
    center: [-1.5491, 53.8008],
    focusZoom: 14.0,
    cinematicBearing: 12,
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
  const sectionRef = useRef(null)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const markersRef = useRef([])
  const viewportObserverRef = useRef(null)
  const introTimeoutRef = useRef(null)
  const autoTourTimeoutRef = useRef(null)
  const introArmedRef = useRef(true)
  const autoTourStartedRef = useRef(false)
  const autoTourIndexRef = useRef(0)
  const userInteractedRef = useRef(false)
  const [datasetByCity, setDatasetByCity] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCityId, setActiveCityId] = useState('london')
  const [worldView, setWorldView] = useState(true)
  const [focusRequest, setFocusRequest] = useState(0)

  const activeCity = useMemo(
    () => cityConfigs.find((city) => city.id === activeCityId) || cityConfigs[0],
    [activeCityId],
  )

  const clearAutoTourTimer = () => {
    if (autoTourTimeoutRef.current) {
      clearTimeout(autoTourTimeoutRef.current)
      autoTourTimeoutRef.current = null
    }
  }

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
    return raw
  }, [activeCityId, datasetByCity])

  const cityStats = useMemo(() => {
    const features = filteredGeoJson.features || []
    const rapidCount = features.filter((feature) => feature.properties?.rapidLikely).length
    const uniqueOperators = new Set(
      features.map((feature) => feature.properties?.operatorLabel).filter(Boolean),
    ).size
    const sampleStations = [...new Set(features.filter((feature) => feature.properties?.name).map((feature) => feature.properties.name))]
      .slice(0, 4)

    return {
      stationCount: features.length,
      rapidCount,
      rapidShare: features.length ? (rapidCount / features.length) * 100 : 0,
      operatorCount: uniqueOperators,
      topOperators: getTopOperators(features),
      sampleStations,
    }
  }, [filteredGeoJson])

  const focusMapOnCity = (cityId) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const city = cityConfigs.find((item) => item.id === cityId) || cityConfigs[0]
    const cityGeoJson = datasetByCity[cityId] || blankFeatureCollection()
    const source = map.getSource('part1-city-stations')

    if (source) {
      source.setData(cityGeoJson)
    }

    popupRef.current?.remove()
    clearMapAnimationTimers()
    map.stop()

    map.flyTo({
      center: city.center,
      zoom: city.focusZoom || 13.2,
      pitch: 12,
      bearing: city.cinematicBearing ? city.cinematicBearing * 0.35 : 0,
      curve: 1.7,
      speed: 0.52,
      duration: 2600,
      essential: true,
    })
  }

  const requestCityFocus = (cityId) => {
    userInteractedRef.current = true
    clearAutoTourTimer()
    setActiveCityId(cityId)
    setWorldView(false)
    introArmedRef.current = false
    setFocusRequest((value) => value + 1)
  }

  const requestOverviewReset = () => {
    userInteractedRef.current = true
    clearAutoTourTimer()
    setWorldView(true)
  }

  const clearMapAnimationTimers = () => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current)
      introTimeoutRef.current = null
    }
  }

  const scheduleAutoTour = (delay = AUTO_TOUR_STEP_MS) => {
    clearAutoTourTimer()
    if (loading || userInteractedRef.current) return

    autoTourTimeoutRef.current = setTimeout(() => {
      const nextCity = cityConfigs[autoTourIndexRef.current % cityConfigs.length]
      autoTourIndexRef.current = (autoTourIndexRef.current + 1) % cityConfigs.length
      setActiveCityId(nextCity.id)
      setWorldView(false)
      setFocusRequest((value) => value + 1)
      scheduleAutoTour(AUTO_TOUR_STEP_MS)
    }, delay)
  }

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: OVERVIEW_VIEW.center,
      zoom: OVERVIEW_VIEW.zoom - 0.7,
      pitch: 0,
      bearing: -8,
      attributionControl: false,
      antialias: true,
      dragRotate: false,
      touchPitch: false,
    })

    mapRef.current = map
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'part1-city-map-popup',
    })

    map.on('style.load', () => {
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
            'rgba(247, 243, 248, 0)',
            0.25,
            '#edd5e8',
            0.5,
            '#d6bfdc',
            0.75,
            '#c2c0df',
            1,
            '#abd8de',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 18, 10, 34],
          'heatmap-opacity': 0.8,
        },
      })

      map.addLayer({
        id: 'part1-city-stations-clusters',
        type: 'circle',
        source: 'part1-city-stations',
        filter: ['has', 'point_count'],
        layout: { visibility: 'visible' },
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#ead1e5', 20, '#cdb7dc', 60, '#abd8de'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 60, 30],
          'circle-stroke-color': 'rgba(255,255,255,0.96)',
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
          'circle-color': ['case', ['==', ['get', 'rapidLikely'], true], '#9fcfd4', '#d7b5d8'],
          'circle-stroke-color': 'rgba(255,255,255,0.96)',
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
        userInteractedRef.current = true
        clearAutoTourTimer()
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
        userInteractedRef.current = true
        clearAutoTourTimer()
        const feature = event.features?.[0]
        if (!feature) return

        popupRef.current
          ?.setLngLat(feature.geometry.coordinates)
          .setHTML(buildPopupHtml(feature))
          .addTo(map)
      })

      cityConfigs.forEach((city) => {
        const markerButton = document.createElement('button')
        markerButton.className = 'part1-city-marker'
        markerButton.type = 'button'
        markerButton.innerHTML = `<span></span><strong>${city.name}</strong>`
        markerButton.setAttribute('aria-label', city.name)
        markerButton.addEventListener('click', () => {
          requestCityFocus(city.id)
        })

        const marker = new mapboxgl.Marker({
          element: markerButton,
          anchor: 'bottom',
        })
          .setLngLat(city.center)
          .addTo(map)

        markersRef.current.push({ cityId: city.id, marker, element: markerButton })
      })
      map.resize()
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      clearMapAnimationTimers()
      clearAutoTourTimer()
      viewportObserverRef.current?.disconnect()
      viewportObserverRef.current = null
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
    const section = sectionRef.current
    if (!map || !section) return

    viewportObserverRef.current?.disconnect()

    viewportObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        if (!entry.isIntersecting) {
          if (worldView) introArmedRef.current = true
          return
        }

        if (!worldView || !introArmedRef.current || !map.isStyleLoaded()) return

        introArmedRef.current = false
        clearMapAnimationTimers()
        map.stop()
        popupRef.current?.remove()
        map.jumpTo({
          center: OVERVIEW_VIEW.center,
          zoom: OVERVIEW_VIEW.zoom - 0.9,
          bearing: -10,
          pitch: 0,
        })

        introTimeoutRef.current = setTimeout(() => {
          map.easeTo({
            center: OVERVIEW_PRESENTATION_VIEW.center,
            zoom: OVERVIEW_PRESENTATION_VIEW.zoom,
            pitch: OVERVIEW_PRESENTATION_VIEW.pitch,
            bearing: OVERVIEW_PRESENTATION_VIEW.bearing,
            duration: 1800,
            essential: true,
          })
        }, 80)

        if (!userInteractedRef.current && !autoTourStartedRef.current) {
          autoTourStartedRef.current = true
          autoTourIndexRef.current = 0
          scheduleAutoTour(AUTO_TOUR_START_DELAY_MS)
        }
      },
      {
        threshold: 0.48,
      },
    )

    viewportObserverRef.current.observe(section)

    return () => {
      viewportObserverRef.current?.disconnect()
      viewportObserverRef.current = null
    }
  }, [worldView, loading])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    map.resize()

    const source = map.getSource('part1-city-stations')
    if (!source) return

    source.setData(worldView ? blankFeatureCollection() : filteredGeoJson)

    if (map.getLayer('part1-city-stations-heat')) {
      map.setLayoutProperty('part1-city-stations-heat', 'visibility', 'none')
    }
    if (map.getLayer('part1-city-stations-clusters')) {
      map.setLayoutProperty('part1-city-stations-clusters', 'visibility', 'visible')
    }
    if (map.getLayer('part1-city-stations-cluster-count')) {
      map.setLayoutProperty('part1-city-stations-cluster-count', 'visibility', 'visible')
    }
    if (map.getLayer('part1-city-stations-points')) {
      map.setLayoutProperty('part1-city-stations-points', 'visibility', 'visible')
    }
  }, [filteredGeoJson, worldView])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    map.resize()
    clearMapAnimationTimers()
    map.stop()

    if (worldView) {
      popupRef.current?.remove()
      introArmedRef.current = true
      map.flyTo({
        center: OVERVIEW_PRESENTATION_VIEW.center,
        zoom: OVERVIEW_PRESENTATION_VIEW.zoom,
        pitch: OVERVIEW_PRESENTATION_VIEW.pitch,
        bearing: OVERVIEW_PRESENTATION_VIEW.bearing,
        curve: 1.26,
        speed: 0.36,
        duration: 2200,
        essential: true,
      })
      return
    }

    focusMapOnCity(activeCity.id)
  }, [activeCity, worldView, datasetByCity, focusRequest])

  if (loading) {
    return (
      <section className="glass-card part1-city-globe">
        <div className="part1-city-loading">Loading city charging map...</div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="glass-card part1-city-globe">
      <div className="part1-city-head">
        <div>
          <p className="eyebrow">City distribution explorer</p>
          <h2 className="part1-city-title">Where are charging facilities concentrated in major cities?</h2>
          <p className="part1-city-intro">
            Click a city to zoom straight into its urban charging landscape, then compare how London, Birmingham, and
            Leeds organise provision through visible clusters, corridors, and destination-based groupings.
          </p>
        </div>

        <div className="part1-city-control-row">
          <button type="button" className="part1-city-pill" onClick={requestOverviewReset}>
            Reset view
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
                onClick={() => requestCityFocus(city.id)}
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
              <span>All mapped stations</span>
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
