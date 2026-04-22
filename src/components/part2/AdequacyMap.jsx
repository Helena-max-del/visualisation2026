import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { loadJson } from '../../utils/loadData'

const FALLBACK_TOKEN =
  'pk.eyJ1Ijoic2hpcmxleTk1NSIsImEiOiJjbWdmOWZ2NXcwNHVjMmlzOTY2bnQxODB4In0.GhGDYYSRrDKQd9NNbvrFyw'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN

// ── Shared bivariate palette ──────────────────────────────────────────────────
const BIVARIATE_COLORS = {
  '1-1': '#e8e8e8', '1-2': '#ace4e4', '1-3': '#64acbe',
  '2-1': '#e8b4d0', '2-2': '#ad9abd', '2-3': '#5698b9',
  '3-1': '#be64ac', '3-2': '#8c62aa', '3-3': '#3b4994',
}

const DEMAND_LABELS = ['Low need',   'Medium need',   'High need']
const SUPPLY_LABELS = ['Low supply', 'Medium supply', 'High supply']

// ── City accent colours (for UI chrome) ──────────────────────────────────────
const CITY_ACCENT = {
  london:      '#4f7af2',
  birmingham:  '#d18b2f',
  leeds:       '#8c62aa',
}

// ── Charging station dot colours ─────────────────────────────────────────────
const BHAM_REG   = '#d18b2f'
const BHAM_RAPID = '#f5a623'
const LEEDS_REG   = '#8c62aa'
const LEEDS_RAPID = '#c49bde'

// ── Camera presets ────────────────────────────────────────────────────────────
const CITY_VIEWS = {
  all:        { center: [-0.95, 52.55], zoom: 6.80, label: 'All cities'  },
  london:     { center: [-0.10, 51.49], zoom: 9.00, label: 'London'      },
  birmingham: { center: [-1.895, 52.48], zoom: 11.50, label: 'Birmingham' },
  leeds:      { center: [-1.548, 53.80], zoom: 11.50, label: 'Leeds'      },
}

// ── City name label source (shown at low zoom only) ───────────────────────────
const CITY_LABELS_GJ = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-0.10,  51.58] }, properties: { label: 'London',     city: 'london'     } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-1.895, 52.55] }, properties: { label: 'Birmingham', city: 'birmingham' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-1.548, 53.88] }, properties: { label: 'Leeds',      city: 'leeds'      } },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildMatchExpr(fallback) {
  const expr = ['match', ['get', 'bivariate_class']]
  Object.entries(BIVARIATE_COLORS).forEach(([k, v]) => expr.push(k, v))
  expr.push(fallback)
  return expr
}

function classLabel(cls) {
  if (!cls) return ''
  const [d, s] = cls.split('-').map(Number)
  return `${DEMAND_LABELS[d - 1]} / ${SUPPLY_LABELS[s - 1]}`
}

function extractKw(value) {
  if (!value) return null
  const hits = String(value).match(/(\d+(?:\.\d+)?)\s*kW/gi)
  if (!hits?.length) return null
  return Math.max(...hits.map(m => Number(m.replace(/[^0-9.]/g, '')) || 0))
}

function enrichStations(collection) {
  return {
    ...collection,
    features: (collection?.features || []).map(f => {
      const p = f.properties || {}
      const kw = extractKw(p.max_output)
      return { ...f, properties: { ...p, rapid: kw >= 50 || Boolean(p.socket_chademo || p.socket_ccs) } }
    }),
  }
}

// ── Per-city layer helpers ────────────────────────────────────────────────────
function addCityLayers(map, sourceId, hoverLayerId, labelsLayerId, minzoomLabels = 10.5) {
  map.addLayer({
    id: `${sourceId}-fill`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color':   buildMatchExpr('#ccc'),
      'fill-opacity': 0.76,
      'fill-opacity-transition': { duration: 400 },
    },
  })

  map.addLayer({
    id: `${sourceId}-outline`,
    type: 'line',
    source: sourceId,
    paint: { 'line-color': '#ffffff', 'line-width': 0.9, 'line-opacity': 0.85 },
  })

  map.addLayer({
    id: hoverLayerId,
    type: 'line',
    source: sourceId,
    filter: ['==', ['get', 'name'], ''],
    paint: { 'line-color': '#23262d', 'line-width': 2.2, 'line-opacity': 0.9 },
  })

  map.addLayer({
    id: labelsLayerId,
    type: 'symbol',
    source: sourceId,
    minzoom: minzoomLabels,
    layout: {
      'text-field':            ['get', 'name'],
      'text-size':             ['interpolate', ['linear'], ['zoom'], minzoomLabels, 8, 13, 11],
      'text-font':             ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      'text-anchor':           'center',
      'text-max-width':        6,
      'text-allow-overlap':    false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color':      '#23262d',
      'text-halo-color': 'rgba(255,255,255,0.88)',
      'text-halo-width': 1.4,
    },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdequacyMap() {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const featuresRef  = useRef([])
  const autoIdxRef   = useRef(0)
  const autoTimerRef = useRef(null)
  const userHoverRef = useRef(false)

  const [ready,      setReady]      = useState(false)
  const [panel,      setPanel]      = useState(null)
  const [autoName,   setAutoName]   = useState(null)
  const [activeCity, setActiveCity] = useState('all')

  // ── Highlight helpers ───────────────────────────────────────────────────────
  const highlightBorough = useCallback((name) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    map.setFilter('borough-hover-line',
      name ? ['==', ['get', 'name'], name] : ['==', ['get', 'name'], ''])
  }, [])

  const highlightMsoa = useCallback((citySource, name) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const layerId = `${citySource}-hover-line`
    if (!map.getLayer(layerId)) return
    map.setFilter(layerId,
      name ? ['==', ['get', 'name'], name] : ['==', ['get', 'name'], ''])
  }, [])

  const clearAllHighlights = useCallback(() => {
    highlightBorough(null)
    highlightMsoa('bham-msoa', null)
    highlightMsoa('leeds-msoa', null)
  }, [highlightBorough, highlightMsoa])

  // ── Auto-tour London boroughs ───────────────────────────────────────────────
  const startAuto = useCallback(() => {
    autoTimerRef.current = setInterval(() => {
      if (userHoverRef.current) return
      const feats = featuresRef.current
      if (!feats.length) return
      const feat = feats[autoIdxRef.current % feats.length]
      autoIdxRef.current += 1
      setAutoName(feat.properties.name)
      highlightBorough(feat.properties.name)
    }, 1400)
  }, [highlightBorough])

  // ── Fly to city ─────────────────────────────────────────────────────────────
  const flyToCity = useCallback((cityId) => {
    const map = mapRef.current
    if (!map) return
    const view = CITY_VIEWS[cityId]
    if (!view) return
    map.flyTo({ center: view.center, zoom: view.zoom, duration: 1100, essential: true })
    setActiveCity(cityId)
  }, [])

  // ── Map setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     'mapbox://styles/mapbox/light-v11',
      center:    CITY_VIEWS.all.center,
      zoom:      CITY_VIEWS.all.zoom,
      minZoom:   4.5,
      maxZoom:   14,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', async () => {

      // ── Load remote data in parallel ────────────────────────────────────────
      let bhamStations  = null
      let leedsStations = null
      try {
        const [bRaw, lRaw] = await Promise.all([
          loadJson('/data/part1/birmingham_charging_osm.geojson'),
          loadJson('/data/part1/leeds_charging_osm.geojson'),
        ])
        bhamStations  = enrichStations(bRaw)
        leedsStations = enrichStations(lRaw)
      } catch (err) {
        console.warn('[AdequacyMap] station data load failed:', err)
      }

      // ── Sources ──────────────────────────────────────────────────────────────
      // London
      map.addSource('boroughs', {
        type: 'geojson',
        data: '/data/part2/bivariate_boroughs.geojson',
        generateId: true,
      })
      // Birmingham & Leeds bivariate MSOA
      map.addSource('bham-msoa', {
        type: 'geojson',
        data: '/data/part2/birmingham_msoa_bivariate.geojson',
        generateId: true,
      })
      map.addSource('leeds-msoa', {
        type: 'geojson',
        data: '/data/part2/leeds_msoa_bivariate.geojson',
        generateId: true,
      })
      // Individual station points (overlaid at high zoom)
      if (bhamStations)  map.addSource('bham-stations',  { type: 'geojson', data: bhamStations  })
      if (leedsStations) map.addSource('leeds-stations', { type: 'geojson', data: leedsStations })
      // City name labels
      map.addSource('city-labels', { type: 'geojson', data: CITY_LABELS_GJ })

      // ── Layers: bivariate fill + outline + hover + labels ────────────────────
      // London boroughs
      map.addLayer({
        id: 'borough-fill', type: 'fill', source: 'boroughs',
        paint: {
          'fill-color':   buildMatchExpr('#ccc'),
          'fill-opacity': 0.78,
          'fill-opacity-transition': { duration: 400 },
        },
      })
      map.addLayer({
        id: 'borough-outline', type: 'line', source: 'boroughs',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'borough-hover-line', type: 'line', source: 'boroughs',
        filter: ['==', ['get', 'name'], ''],
        paint: { 'line-color': '#23262d', 'line-width': 2.5, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'borough-labels', type: 'symbol', source: 'boroughs',
        minzoom: 8.5,
        layout: {
          'text-field':            ['get', 'name'],
          'text-size':             ['interpolate', ['linear'], ['zoom'], 9, 9, 11, 11],
          'text-font':             ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
          'text-anchor':           'center',
          'text-max-width':        7,
          'text-allow-overlap':    false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color':      '#23262d',
          'text-halo-color': 'rgba(255,255,255,0.88)',
          'text-halo-width': 1.5,
        },
      })

      // Birmingham MSOAs
      addCityLayers(map, 'bham-msoa', 'bham-msoa-hover-line', 'bham-msoa-labels', 11)

      // Leeds MSOAs
      addCityLayers(map, 'leeds-msoa', 'leeds-msoa-hover-line', 'leeds-msoa-labels', 11)

      // ── Station dot layers (visible at high zoom only) ───────────────────────
      if (bhamStations) {
        map.addLayer({
          id: 'bham-pts-reg', type: 'circle', source: 'bham-stations',
          minzoom: 10.5,
          filter: ['!=', ['get', 'rapid'], true],
          paint: {
            'circle-radius':       ['interpolate', ['linear'], ['zoom'], 10.5, 2.5, 14, 5],
            'circle-color':        BHAM_REG,
            'circle-opacity':      0.75,
            'circle-stroke-width': 0.8,
            'circle-stroke-color': 'rgba(255,255,255,0.65)',
          },
        })
        map.addLayer({
          id: 'bham-pts-rapid', type: 'circle', source: 'bham-stations',
          minzoom: 10.5,
          filter: ['==', ['get', 'rapid'], true],
          paint: {
            'circle-radius':       ['interpolate', ['linear'], ['zoom'], 10.5, 4, 14, 8],
            'circle-color':        BHAM_RAPID,
            'circle-opacity':      0.94,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,0.88)',
          },
        })
      }

      if (leedsStations) {
        map.addLayer({
          id: 'leeds-pts-reg', type: 'circle', source: 'leeds-stations',
          minzoom: 10.5,
          filter: ['!=', ['get', 'rapid'], true],
          paint: {
            'circle-radius':       ['interpolate', ['linear'], ['zoom'], 10.5, 2.5, 14, 5],
            'circle-color':        LEEDS_REG,
            'circle-opacity':      0.75,
            'circle-stroke-width': 0.8,
            'circle-stroke-color': 'rgba(255,255,255,0.65)',
          },
        })
        map.addLayer({
          id: 'leeds-pts-rapid', type: 'circle', source: 'leeds-stations',
          minzoom: 10.5,
          filter: ['==', ['get', 'rapid'], true],
          paint: {
            'circle-radius':       ['interpolate', ['linear'], ['zoom'], 10.5, 4, 14, 8],
            'circle-color':        LEEDS_RAPID,
            'circle-opacity':      0.94,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,0.88)',
          },
        })
      }

      // ── City name labels (hidden when zoomed into borough/MSOA level) ────────
      map.addLayer({
        id: 'city-label-text', type: 'symbol', source: 'city-labels',
        maxzoom: 8.5,
        layout: {
          'text-field':          ['get', 'label'],
          'text-font':           ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          'text-size':           ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 14],
          'text-letter-spacing': 0.05,
          'text-anchor':         'center',
        },
        paint: {
          'text-color': [
            'match', ['get', 'city'],
            'london',     '#4f7af2',
            'birmingham', '#d18b2f',
            'leeds',      '#8c62aa',
            '#23262d',
          ],
          'text-halo-color': 'rgba(255,255,255,0.94)',
          'text-halo-width': 2,
        },
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      // ── Auto-tour: collect London borough features ───────────────────────────
      map.on('sourcedata', (e) => {
        if (e.sourceId !== 'boroughs' || !e.isSourceLoaded) return
        const fs = map.querySourceFeatures('boroughs', { sourceLayer: '' })
        if (fs.length && !featuresRef.current.length) {
          const seen = new Set()
          featuresRef.current = fs.filter(f => {
            if (seen.has(f.properties.name)) return false
            seen.add(f.properties.name)
            return true
          })
          startAuto()
        }
      })

      // ── Hover: generic MSOA/borough handler ─────────────────────────────────
      const onAreaMove = (type, cityKey, highlightFn) => (e) => {
        if (!e.features?.length) return
        userHoverRef.current = true
        map.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties
        clearAllHighlights()
        highlightFn(p.name)
        setAutoName(null)

        if (type === 'borough') {
          setPanel({
            type: 'borough', city: 'london',
            name: p.name, bClass: p.bivariate_class,
            totalChargers: p.total_chargers,
            chargersPer10k: p.chargers_per_10k_pop,
            pctNoCar: p.pct_no_car,
            supplyTier: p.supply_tier,
            demandTier: p.demand_tier,
          })
        } else {
          setPanel({
            type: 'msoa', city: cityKey,
            name: p.name, bClass: p.bivariate_class,
            totalChargers: p.total_chargers,
            areaKm2: p.area_km2,
            chargersPerKm2: p.chargers_per_km2,
            pctNoCar: p.pct_no_car,
            supplyTier: p.supply_tier,
            demandTier: p.demand_tier,
          })
        }
      }

      const onAreaLeave = () => {
        userHoverRef.current = false
        map.getCanvas().style.cursor = ''
        setPanel(null)
        setAutoName(null)
        clearAllHighlights()
      }

      map.on('mousemove',  'borough-fill',    onAreaMove('borough',      'london',      (n) => highlightBorough(n)))
      map.on('mouseleave', 'borough-fill',    onAreaLeave)
      map.on('mousemove',  'bham-msoa-fill',  onAreaMove('msoa',         'birmingham',  (n) => highlightMsoa('bham-msoa', n)))
      map.on('mouseleave', 'bham-msoa-fill',  onAreaLeave)
      map.on('mousemove',  'leeds-msoa-fill', onAreaMove('msoa',         'leeds',       (n) => highlightMsoa('leeds-msoa', n)))
      map.on('mouseleave', 'leeds-msoa-fill', onAreaLeave)

      // ── Hover: individual station dots (high-zoom overlay) ───────────────────
      const onStationMove = (cityName, accentColor) => (e) => {
        if (!e.features?.length) return
        userHoverRef.current = true
        map.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties
        setAutoName(null)
        clearAllHighlights()
        setPanel({
          type: 'station', city: cityName, color: accentColor,
          name:      p.name || p.operator || 'Charging station',
          operator:  p.operator || p.brand || 'Unknown',
          rapid:     p.rapid === true || p.rapid === 'true',
          maxOutput: p.max_output || null,
          access:    p.access    || null,
          fee:       p.fee       || null,
        })
      }
      const onStationLeave = () => {
        userHoverRef.current = false
        map.getCanvas().style.cursor = ''
        setPanel(null)
        setAutoName(null)
      }

      if (bhamStations) {
        map.on('mousemove',  'bham-pts-reg',   onStationMove('Birmingham', BHAM_REG))
        map.on('mousemove',  'bham-pts-rapid', onStationMove('Birmingham', BHAM_RAPID))
        map.on('mouseleave', 'bham-pts-reg',   onStationLeave)
        map.on('mouseleave', 'bham-pts-rapid', onStationLeave)
      }
      if (leedsStations) {
        map.on('mousemove',  'leeds-pts-reg',   onStationMove('Leeds', LEEDS_REG))
        map.on('mousemove',  'leeds-pts-rapid', onStationMove('Leeds', LEEDS_RAPID))
        map.on('mouseleave', 'leeds-pts-reg',   onStationLeave)
        map.on('mouseleave', 'leeds-pts-rapid', onStationLeave)
      }

      setReady(true)
    })

    return () => {
      clearInterval(autoTimerRef.current)
      map.remove()
      mapRef.current  = null
      featuresRef.current = []
    }
  }, [highlightBorough, highlightMsoa, clearAllHighlights, startAuto])

  // ── Auto-tour: push borough panel data ──────────────────────────────────────
  useEffect(() => {
    if (!autoName || !featuresRef.current.length) return
    const feat = featuresRef.current.find(f => f.properties.name === autoName)
    if (!feat) return
    const p = feat.properties
    setPanel({
      type: 'borough', city: 'london',
      name: p.name, bClass: p.bivariate_class,
      totalChargers: p.total_chargers,
      chargersPer10k: p.chargers_per_10k_pop,
      pctNoCar: p.pct_no_car,
      supplyTier: p.supply_tier,
      demandTier: p.demand_tier,
    })
  }, [autoName])

  // ── Derived panel state ──────────────────────────────────────────────────────
  const panelAccent =
    panel?.type === 'station'
      ? (panel.color ?? '#ccc')
      : (BIVARIATE_COLORS[panel?.bClass] ?? '#ccc')

  const cityAccent = CITY_ACCENT[panel?.city] ?? '#23262d'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p2-map-shell">

      {/* Header */}
      <div className="p2-map-header">
        <p className="p2-chart-eyebrow">Three-city spatial analysis</p>
        <h3 className="p2-chart-title">
          Supply–demand alignment across London, Birmingham and Leeds
        </h3>
        <p className="p2-chart-desc">
          All three cities use the same <strong>bivariate classification</strong>: colour encodes
          the combination of charging supply and public-charging demand (no-car households).{' '}
          <strong style={{ color: '#be64ac' }}>Purple</strong> = high need, low supply.
          London shows borough-level data; Birmingham and Leeds show Census 2021 MSOA-level data.
          Zoom in to see individual station dots overlay on top of the MSOA polygons.
        </p>
      </div>

      {/* City selector */}
      <div className="p2-city-tabs" role="group" aria-label="Jump to city">
        {Object.entries(CITY_VIEWS).map(([id, view]) => (
          <button
            key={id}
            type="button"
            className={`p2-city-tab p2-city-tab--${id}${activeCity === id ? ' is-active' : ''}`}
            onClick={() => flyToCity(id)}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Map + panel */}
      <div className="p2-map-body">
        <div ref={containerRef} className="p2-map-canvas" />

        <div className={`p2-map-panel${panel ? ' is-visible' : ''}`}>
          <div className="p2-map-panel-accent" style={{ background: panelAccent }} />

          <div className="p2-map-panel-body">
            {panel ? (

              /* ── Station dot hover ─────────────────────────────────────────── */
              panel.type === 'station' ? (
                <>
                  <div className="p2-map-station-badge"
                    style={{ background: `${panel.color}18`, borderColor: `${panel.color}40` }}>
                    <span className="p2-map-station-dot" style={{ background: panel.color }} />
                    <span style={{ color: panel.color }}>{panel.city}</span>
                  </div>
                  <h4 className="p2-map-panel-name">{panel.name}</h4>
                  <p className="p2-map-panel-class">
                    {panel.rapid
                      ? <><span className="p2-rapid-badge">⚡ Rapid</span>≥&thinsp;50&thinsp;kW</>
                      : 'Standard charge point'}
                  </p>
                  <div className="p2-map-panel-stats">
                    <div className="p2-map-stat">
                      <span>Operator</span>
                      <strong style={{ color: panel.color }}>{panel.operator}</strong>
                    </div>
                    {panel.maxOutput && (
                      <div className="p2-map-stat">
                        <span>Max output</span>
                        <strong>{panel.maxOutput}</strong>
                      </div>
                    )}
                    {panel.access && (
                      <div className="p2-map-stat">
                        <span>Access</span>
                        <strong style={{ textTransform: 'capitalize' }}>{panel.access}</strong>
                      </div>
                    )}
                    {panel.fee && (
                      <div className="p2-map-stat">
                        <span>Fee</span>
                        <strong style={{ textTransform: 'capitalize' }}>{panel.fee}</strong>
                      </div>
                    )}
                  </div>
                </>

              /* ── London borough ─────────────────────────────────────────────── */
              ) : panel.type === 'borough' ? (
                <>
                  <div className="p2-map-area-badge" style={{ background: '#4f7af218', borderColor: '#4f7af240' }}>
                    <span className="p2-map-area-pip" style={{ background: '#4f7af2' }} />
                    <span style={{ color: '#4f7af2' }}>London borough</span>
                  </div>
                  <h4 className="p2-map-panel-name">{panel.name}</h4>
                  <p className="p2-map-panel-class">{classLabel(panel.bClass)}</p>
                  <div className="p2-map-panel-stats">
                    <div className="p2-map-stat">
                      <span>Total chargers</span>
                      <strong>{Number(panel.totalChargers).toLocaleString()}</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Per 10k residents</span>
                      <strong>{Number(panel.chargersPer10k).toFixed(1)}</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>No-car households</span>
                      <strong>{(Number(panel.pctNoCar) * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Supply tier</span>
                      <strong>{panel.supplyTier} / 3</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Demand tier</span>
                      <strong>{panel.demandTier} / 3</strong>
                    </div>
                  </div>
                  <div className="p2-map-panel-swatch" style={{ background: panelAccent }}
                    title={`Bivariate class ${panel.bClass}`} />
                </>

              /* ── Birmingham / Leeds MSOA ─────────────────────────────────────── */
              ) : (
                <>
                  <div className="p2-map-area-badge"
                    style={{ background: `${cityAccent}18`, borderColor: `${cityAccent}40` }}>
                    <span className="p2-map-area-pip" style={{ background: cityAccent }} />
                    <span style={{ color: cityAccent }}>
                      {panel.city.charAt(0).toUpperCase() + panel.city.slice(1)} MSOA
                    </span>
                  </div>
                  <h4 className="p2-map-panel-name">{panel.name}</h4>
                  <p className="p2-map-panel-class">{classLabel(panel.bClass)}</p>
                  <div className="p2-map-panel-stats">
                    <div className="p2-map-stat">
                      <span>Total chargers</span>
                      <strong>{Number(panel.totalChargers).toLocaleString()}</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Per km²</span>
                      <strong>{Number(panel.chargersPerKm2).toFixed(2)}</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>No-car households</span>
                      <strong>{(Number(panel.pctNoCar) * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Supply tier</span>
                      <strong>{panel.supplyTier} / 3</strong>
                    </div>
                    <div className="p2-map-stat">
                      <span>Demand tier</span>
                      <strong>{panel.demandTier} / 3</strong>
                    </div>
                  </div>
                  <div className="p2-map-panel-swatch" style={{ background: panelAccent }}
                    title={`Bivariate class ${panel.bClass}`} />
                </>
              )

            ) : (
              <p className="p2-map-panel-idle">
                Hover any area or charging station to explore
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="p2-map-legend">
            <p className="p2-map-legend-title">Bivariate — supply / demand</p>
            <div className="p2-bv-grid">
              {[3, 2, 1].map(d =>
                [1, 2, 3].map(s => (
                  <div key={`${d}-${s}`}
                    className={`p2-bv-cell${panel?.bClass === `${d}-${s}` ? ' is-active' : ''}`}
                    style={{ background: BIVARIATE_COLORS[`${d}-${s}`] }}
                    title={`${DEMAND_LABELS[d - 1]} / ${SUPPLY_LABELS[s - 1]}`}
                  />
                ))
              )}
            </div>
            <div className="p2-bv-axis-row"><span>Low</span><span>High</span></div>
            <p className="p2-bv-note">
              <span className="p2-bv-dot" style={{ background: '#be64ac' }} />
              High need, low supply = most constrained
            </p>

            {/* Coverage level note */}
            <div className="p2-map-legend-units">
              <div className="p2-map-legend-unit">
                <span className="p2-map-legend-pip" style={{ background: '#4f7af2' }} />
                <span>London — boroughs</span>
              </div>
              <div className="p2-map-legend-unit">
                <span className="p2-map-legend-pip" style={{ background: '#d18b2f' }} />
                <span>Birmingham — MSOAs</span>
              </div>
              <div className="p2-map-legend-unit">
                <span className="p2-map-legend-pip" style={{ background: '#8c62aa' }} />
                <span>Leeds — MSOAs</span>
              </div>
            </div>

            {/* Station dot legend (visible at zoom ≥ 10.5) */}
            <div className="p2-stn-legend">
              <p className="p2-map-legend-title" style={{ marginTop: 12 }}>Station overlay (zoom in)</p>
              <div className="p2-stn-legend-row">
                <span className="p2-stn-dot p2-stn-dot--sm" style={{ background: BHAM_REG }} />
                <span className="p2-stn-dot p2-stn-dot--lg" style={{ background: BHAM_RAPID }} />
                <span className="p2-stn-legend-name">Birmingham</span>
              </div>
              <div className="p2-stn-legend-row">
                <span className="p2-stn-dot p2-stn-dot--sm" style={{ background: LEEDS_REG }} />
                <span className="p2-stn-dot p2-stn-dot--lg" style={{ background: LEEDS_RAPID }} />
                <span className="p2-stn-legend-name">Leeds</span>
              </div>
              <p className="p2-stn-legend-hint">Small = standard · Large = rapid (≥50 kW)</p>
            </div>
          </div>
        </div>
      </div>

      {!ready && <div className="p2-map-loading">Loading map…</div>}

      <p className="p2-chart-footnote">
        London: DfT EVCI Jan 2026 · Census 2021 no-car household share · tiers by London-wide
        tercile split.
        Birmingham &amp; Leeds: MSOA boundaries from ONS Open Geography Portal · Census 2021
        TS045 no-car % from NOMIS · charger counts from OpenStreetMap (OSM contributors) ·
        supply metric = chargers per km² · tiers by within-city tercile split.
      </p>
    </div>
  )
}
