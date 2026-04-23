import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createCirclePolygon, getFeatureBounds } from '../../../utils/geoUtils'
import { SPEED_STYLES, TIME_BAND_OPTIONS, getTravelBandRadiusKm, getTravelSpeedOption } from '../shared/part3Shared.js'

const FALLBACK_TOKEN =
  'pk.eyJ1Ijoic2hpcmxleTk1NSIsImEiOiJjbWdmOWZ2NXcwNHVjMmlzOTY2bnQxODB4In0.GhGDYYSRrDKQd9NNbvrFyw'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] }
}

function buildPointCollection(anchor) {
  if (!anchor?.coordinates) return emptyFeatureCollection()

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { label: anchor.label || 'Selected location' },
        geometry: {
          type: 'Point',
          coordinates: anchor.coordinates,
        },
      },
    ],
  }
}

function buildStationCollection(stations = []) {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => ({
      ...station,
      properties: {
        ...(station.properties || {}),
        featureId: String(station.id),
      },
    })),
  }
}

function buildSpeedFilter(speedBand) {
  return ['==', ['get', 'speedBand'], speedBand]
}

function buildRingColorExpression() {
  return [
    'match',
    ['get', 'travelBandId'],
    'min5',
    '#d96fa8',
    'min10',
    '#58b7ff',
    'min15',
    '#efc34f',
    '#58b7ff',
  ]
}

function buildRingCollection(anchor, travelSpeedId) {
  const coordinates = anchor?.coordinates
  if (!coordinates || anchor?.source === 'city') return emptyFeatureCollection()

  const travelSpeed = getTravelSpeedOption(travelSpeedId)
  const ringOptions = [...TIME_BAND_OPTIONS].sort((left, right) => right.minutes - left.minutes)

  return {
    type: 'FeatureCollection',
    features: ringOptions.flatMap((option) => {
      const radiusKm = getTravelBandRadiusKm(option.minutes, travelSpeed.kmPerHour)
      const circle = createCirclePolygon(coordinates, radiusKm)
      return (circle.features || []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties || {}),
          travelBandId: option.id,
          label: option.label,
          radiusKm,
          minutes: option.minutes,
        },
      }))
    }),
  }
}

function buildCircleBounds(center, radiusKm) {
  const circle = createCirclePolygon(center, radiusKm)
  const coordinates = circle.features?.[0]?.geometry?.coordinates?.[0] || []
  if (!coordinates.length) return null

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  if (![minLng, maxLng, minLat, maxLat].every(Number.isFinite)) return null

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export default function NeighbourhoodMap({
  city,
  stations = [],
  selectedStation,
  anchor,
  speedFilter,
  travelSpeedId,
  onSelectStation,
  onSelectPoint,
  onPanelResize,
}) {
  const containerRef = useRef(null)
  const shellRef = useRef(null)
  const mapRef = useRef(null)
  const handlersRef = useRef({ onSelectPoint, onSelectStation })
  const [mapReady, setMapReady] = useState(false)

  handlersRef.current = { onSelectPoint, onSelectStation }

  useEffect(() => {
    if (!shellRef.current || !onPanelResize) return

    const emitHeight = () => {
      onPanelResize(shellRef.current?.offsetHeight || 0)
    }

    emitHeight()

    const observer = new ResizeObserver(() => {
      emitHeight()
    })

    observer.observe(shellRef.current)
    window.addEventListener('resize', emitHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', emitHeight)
    }
  }, [onPanelResize, stations.length, selectedStation, speedFilter, travelSpeedId])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: city?.center || [-0.12, 51.5],
      zoom: city?.defaultZoom || 10,
      minZoom: 7,
      maxZoom: 15,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      map.addSource('part3-stations', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      })

      map.addSource('part3-anchor', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      })

      map.addSource('part3-service-ring', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      })

      map.addLayer({
        id: 'part3-service-fill',
        type: 'fill',
        source: 'part3-service-ring',
        paint: {
          'fill-color': buildRingColorExpression(),
          'fill-opacity': [
            'match',
            ['get', 'travelBandId'],
            'min5',
            0.14,
            'min10',
            0.09,
            'min15',
            0.06,
            0.06,
          ],
        },
      })

      map.addLayer({
        id: 'part3-service-outline',
        type: 'line',
        source: 'part3-service-ring',
        paint: {
          'line-color': buildRingColorExpression(),
          'line-width': [
            'match',
            ['get', 'travelBandId'],
            'min5',
            1.9,
            'min10',
            2.3,
            'min15',
            2.1,
            1.9,
          ],
          'line-opacity': 0.62,
          'line-dasharray': [
            'match',
            ['get', 'travelBandId'],
            'min5',
            ['literal', [1, 0]],
            'min10',
            ['literal', [2.2, 2]],
            'min15',
            ['literal', [4, 2.4]],
            ['literal', [2, 2]],
          ],
        },
      })

      map.addLayer({
        id: 'part3-point-halo',
        type: 'circle',
        source: 'part3-stations',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.8, 12, 7.8],
          'circle-color': '#ffffff',
          'circle-opacity': 0.84,
        },
      })

      map.addLayer({
        id: 'part3-points-local',
        type: 'circle',
        source: 'part3-stations',
        filter: buildSpeedFilter('local'),
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3.8, 12, 6.2],
          'circle-color': SPEED_STYLES.local.color,
          'circle-stroke-color': 'rgba(255,255,255,0.98)',
          'circle-stroke-width': 1,
          'circle-opacity': 0.95,
        },
      })

      map.addLayer({
        id: 'part3-points-rapid',
        type: 'circle',
        source: 'part3-stations',
        filter: buildSpeedFilter('rapid'),
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.4, 12, 6.8],
          'circle-color': SPEED_STYLES.rapid.color,
          'circle-stroke-color': 'rgba(255,255,255,0.98)',
          'circle-stroke-width': 1,
          'circle-opacity': 0.96,
        },
      })

      map.addLayer({
        id: 'part3-points-ultra',
        type: 'circle',
        source: 'part3-stations',
        filter: buildSpeedFilter('ultra'),
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5.2, 12, 7.8],
          'circle-color': SPEED_STYLES.ultra.color,
          'circle-stroke-color': 'rgba(255,255,255,0.98)',
          'circle-stroke-width': 1.1,
          'circle-opacity': 0.98,
        },
      })

      map.addLayer({
        id: 'part3-selected-station',
        type: 'circle',
        source: 'part3-stations',
        filter: ['==', ['get', 'featureId'], ''],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 12, 12],
          'circle-color': 'rgba(255,255,255,0.18)',
          'circle-stroke-color': '#23262d',
          'circle-stroke-width': 2.6,
        },
      })

      map.addLayer({
        id: 'part3-anchor-point',
        type: 'circle',
        source: 'part3-anchor',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 6.5, 12, 9],
          'circle-color': '#23262d',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      ;['part3-points-local', 'part3-points-rapid', 'part3-points-ultra'].forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = ''
        })
        map.on('click', layerId, (event) => {
          const feature = event.features?.[0]
          if (!feature) return
          handlersRef.current.onSelectStation?.(feature.properties?.featureId || feature.id)
        })
      })

      map.on('click', (event) => {
        const clickedFeatures = map.queryRenderedFeatures(event.point, {
          layers: ['part3-points-local', 'part3-points-rapid', 'part3-points-ultra'],
        })
        if (clickedFeatures.length) return

        handlersRef.current.onSelectPoint?.({
          coordinates: [event.lngLat.lng, event.lngLat.lat],
          label: 'Pinned neighbourhood',
          source: 'map',
        })
      })

      setMapReady(true)
    })

    return () => {
      setMapReady(false)
      map.remove()
      mapRef.current = null
    }
  }, [city])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.isStyleLoaded()) return

    const source = map.getSource('part3-stations')
    if (!source) return

    source.setData(buildStationCollection(stations))

    if (map.getLayer('part3-selected-station')) {
      map.setFilter('part3-selected-station', ['==', ['get', 'featureId'], String(selectedStation?.id || '')])
    }
  }, [mapReady, stations, selectedStation])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.isStyleLoaded()) return

    const source = map.getSource('part3-anchor')
    if (!source) return
    source.setData(buildPointCollection(anchor))

    const ringSource = map.getSource('part3-service-ring')
    if (ringSource) {
      ringSource.setData(buildRingCollection(anchor, travelSpeedId))
    }
  }, [anchor, mapReady, travelSpeedId])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.isStyleLoaded()) return
    if (!stations.length) return

    const bounds = getFeatureBounds(stations)
    if (!bounds) return

    map.fitBounds(bounds, {
      padding: { top: 72, right: 72, bottom: 72, left: 72 },
      duration: 900,
    })
  }, [city?.id, mapReady, stations])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.isStyleLoaded() || !anchor?.coordinates) return

    if (anchor?.source && anchor.source !== 'city') {
      const outerRadiusKm = getTravelBandRadiusKm(
        TIME_BAND_OPTIONS[TIME_BAND_OPTIONS.length - 1].minutes,
        getTravelSpeedOption(travelSpeedId).kmPerHour,
      )
      const bounds = buildCircleBounds(anchor.coordinates, outerRadiusKm)

      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 56, right: 56, bottom: 56, left: 56 },
          duration: 700,
        })
        return
      }
    }

    map.easeTo({
      center: anchor.coordinates,
      duration: 700,
      zoom: Math.max(map.getZoom(), speedFilter === 'ultra' ? 10 : speedFilter === 'rapid' ? 10.6 : 11.2),
    })
  }, [anchor, mapReady, speedFilter, travelSpeedId])

  return (
    <section ref={shellRef} className="part3-map-card glass-card">
      <div className="part3-map-header">
        <div>
          <p className="part3-control-label">Interactive map</p>
          <h3>Click a charger or map point to compare 5, 10, and 15 minute reach</h3>
        </div>

        <div className="part3-map-key">
          {Object.entries(SPEED_STYLES).map(([key, value]) => (
            <span key={key} className="part3-map-key__item">
              <span className="part3-map-key__dot" style={{ background: value.color }} />
              {value.label}
            </span>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="part3-map-canvas" />

      <p className="part3-map-footnote">
        Charger dots remain grouped by power band. Once you click a charger or pin a neighbourhood, the map overlays
        three concentric travel-time bands scaled by the selected average urban speed.
      </p>
    </section>
  )
}
