import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const FALLBACK_TOKEN =
  'pk.eyJ1Ijoic2hpcmxleTk1NSIsImEiOiJjbWdmOWZ2NXcwNHVjMmlzOTY2bnQxODB4In0.GhGDYYSRrDKQd9NNbvrFyw'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN

const BIVARIATE_COLORS = {
  '1-1': '#e8e8e8', '1-2': '#ace4e4', '1-3': '#64acbe',
  '2-1': '#e8b4d0', '2-2': '#ad9abd', '2-3': '#5698b9',
  '3-1': '#be64ac', '3-2': '#8c62aa', '3-3': '#3b4994',
}

const DEMAND_LABELS = ['Low need', 'Medium need', 'High need']
const SUPPLY_LABELS = ['Low supply', 'Medium supply', 'High supply']

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

export default function AdequacyMap() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const featuresRef = useRef([])
  const autoIdxRef = useRef(0)
  const autoTimerRef = useRef(null)
  const userHoverRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [panel, setPanel] = useState(null)
  const [autoName, setAutoName] = useState(null)

  const highlight = useCallback((name) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    map.setFilter(
      'borough-hover-line',
      name ? ['==', ['get', 'name'], name] : ['==', ['get', 'name'], ''],
    )
  }, [])

  const startAuto = useCallback(() => {
    autoTimerRef.current = setInterval(() => {
      if (userHoverRef.current) return
      const feats = featuresRef.current
      if (!feats.length) return
      const feat = feats[autoIdxRef.current % feats.length]
      const p = feat.properties
      autoIdxRef.current += 1
      setAutoName(p.name)
      highlight(p.name)
    }, 1400)
  }, [highlight])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-0.1, 51.49],
      zoom: 9,
      minZoom: 8,
      maxZoom: 13,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('boroughs', {
        type: 'geojson',
        data: '/data/part2/bivariate_boroughs.geojson',
        generateId: true,
      })

      map.addLayer({
        id: 'borough-fill',
        type: 'fill',
        source: 'boroughs',
        paint: {
          'fill-color': buildMatchExpr('#ccc'),
          'fill-opacity': 0.78,
          'fill-opacity-transition': { duration: 400 },
        },
      })

      map.addLayer({
        id: 'borough-outline',
        type: 'line',
        source: 'boroughs',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-opacity': 0.9 },
      })

      map.addLayer({
        id: 'borough-labels',
        type: 'symbol',
        source: 'boroughs',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 9, 11, 11],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-max-width': 7,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#23262d',
          'text-halo-color': 'rgba(255,255,255,0.88)',
          'text-halo-width': 1.5,
        },
      })

      map.addLayer({
        id: 'borough-hover-line',
        type: 'line',
        source: 'boroughs',
        filter: ['==', ['get', 'name'], ''],
        paint: {
          'line-color': '#23262d',
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('sourcedata', (e) => {
        if (e.sourceId !== 'boroughs' || !e.isSourceLoaded) return
        const fs = map.querySourceFeatures('boroughs', { sourceLayer: '' })
        if (fs.length && !featuresRef.current.length) {
          const seen = new Set()
          featuresRef.current = fs.filter((f) => {
            if (seen.has(f.properties.name)) return false
            seen.add(f.properties.name)
            return true
          })
          startAuto()
        }
      })

      map.on('mousemove', 'borough-fill', (e) => {
        if (!e.features?.length) return
        userHoverRef.current = true
        const p = e.features[0].properties
        highlight(p.name)
        setAutoName(null)
        setPanel({
          name: p.name,
          bClass: p.bivariate_class,
          totalChargers: p.total_chargers,
          chargersPer10k: p.chargers_per_10k_pop,
          pctNoCar: p.pct_no_car,
          supplyTier: p.supply_tier,
          demandTier: p.demand_tier,
        })
      })

      map.on('mouseleave', 'borough-fill', () => {
        userHoverRef.current = false
        setPanel(null)
        setAutoName(null)
      })

      setReady(true)
    })

    return () => {
      clearInterval(autoTimerRef.current)
      map.remove()
      mapRef.current = null
      featuresRef.current = []
    }
  }, [highlight, startAuto])

  useEffect(() => {
    if (!autoName || !featuresRef.current.length) return
    const feat = featuresRef.current.find((f) => f.properties.name === autoName)
    if (!feat) return
    const p = feat.properties
    setPanel({
      name: p.name,
      bClass: p.bivariate_class,
      totalChargers: p.total_chargers,
      chargersPer10k: p.chargers_per_10k_pop,
      pctNoCar: p.pct_no_car,
      supplyTier: p.supply_tier,
      demandTier: p.demand_tier,
    })
  }, [autoName])

  const panelColor = panel?.bClass ? BIVARIATE_COLORS[panel.bClass] : '#ccc'

  return (
    <div className="p2-map-shell">
      <div className="p2-map-header">
        <p className="p2-chart-eyebrow">Borough-level spatial analysis</p>
        <h3 className="p2-chart-title">Supply-demand alignment across London boroughs</h3>
        <p className="p2-chart-desc">
          Each borough is coloured by a <strong>bivariate classification</strong>, combining
          charging supply (chargers per 10,000 residents) with charging demand (proportion
          of no-car households). <strong style={{ color: '#be64ac' }}>Purple</strong> = high
          need, low supply.
        </p>
      </div>

      <div className="p2-map-body">
        <div ref={containerRef} className="p2-map-canvas" />

        <div className={`p2-map-panel${panel ? ' is-visible' : ''}`}>
          <div className="p2-map-panel-accent" style={{ background: panelColor }} />
          <div className="p2-map-panel-body">
            {panel ? (
              <>
                <p className="p2-map-panel-label">Selected borough</p>
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

                <div
                  className="p2-map-panel-swatch"
                  style={{ background: panelColor }}
                  title={`Bivariate class ${panel.bClass}`}
                />
              </>
            ) : (
              <p className="p2-map-panel-idle">Hover a borough to explore</p>
            )}
          </div>

          <div className="p2-map-legend">
            <p className="p2-map-legend-title">Supply / Demand</p>
            <div className="p2-bv-grid">
              {[3, 2, 1].map((d) =>
                [1, 2, 3].map((s) => (
                  <div
                    key={`${d}-${s}`}
                    className={`p2-bv-cell${panel?.bClass === `${d}-${s}` ? ' is-active' : ''}`}
                    style={{ background: BIVARIATE_COLORS[`${d}-${s}`] }}
                    title={`${DEMAND_LABELS[d - 1]} / ${SUPPLY_LABELS[s - 1]}`}
                  />
                )),
              )}
            </div>
            <div className="p2-bv-axis-row">
              <span>Low</span>
              <span>High</span>
            </div>
            <p className="p2-bv-note">
              <span className="p2-bv-dot" style={{ background: '#be64ac' }} />
              High need, low supply = most constrained
            </p>
          </div>
        </div>
      </div>

      {!ready && <div className="p2-map-loading">Loading map...</div>}

      <p className="p2-chart-footnote">
        Demand proxy: Census 2021 no-car household share. Supply: DfT EVCI Jan 2026.
        Tiers by London-wide tercile split.
      </p>
    </div>
  )
}
