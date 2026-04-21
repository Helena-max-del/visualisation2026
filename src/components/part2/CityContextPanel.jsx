import { useEffect, useMemo, useState } from 'react'
import { loadJson } from '../../utils/loadData'
import { OrbitRingGlyph, PulseBarsGlyph, RapidBoltGlyph } from './Part2Glyphs.jsx'

const CITY_CONFIGS = [
  {
    id: 'london',
    name: 'London',
    dataPath: '/data/part1/london_charging_osm.geojson',
    accent: 'blue',
    insight:
      'London combines the densest mapped network with the greatest internal inequality, which is why borough-level adequacy matters here.',
    Icon: PulseBarsGlyph,
  },
  {
    id: 'birmingham',
    name: 'Birmingham',
    dataPath: '/data/part1/birmingham_charging_osm.geojson',
    accent: 'amber',
    insight:
      'Birmingham reads as more corridor-led and dispersed, suggesting that citywide coverage and strategic road access may matter more than borough-style clustering.',
    Icon: RapidBoltGlyph,
  },
  {
    id: 'leeds',
    name: 'Leeds',
    dataPath: '/data/part1/leeds_charging_osm.geojson',
    accent: 'plum',
    insight:
      'Leeds sits between the two: less saturated than London, but still structured around centre-ring-road and destination clusters rather than a uniformly dense network.',
    Icon: OrbitRingGlyph,
  },
]

function extractNumericKw(value) {
  if (!value) return null
  const matches = String(value).match(/(\d+(?:\.\d+)?)\s*kW/gi)
  if (!matches?.length) return null
  return Math.max(...matches.map((match) => Number(match.replace(/[^0-9.]/g, '')) || 0))
}

function summariseStations(collection) {
  const features = (collection?.features || []).filter(
    (feature) => feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates),
  )

  const enriched = features.map((feature) => {
    const props = feature.properties || {}
    const maxKw = extractNumericKw(props.max_output)
    const rapidLikely = Boolean(maxKw >= 50 || props.socket_chademo || props.socket_ccs)
    return {
      ...feature,
      properties: {
        ...props,
        rapidLikely,
        operatorLabel: props.operator || props.brand || 'Unknown',
      },
    }
  })

  const stationCount = enriched.length
  const rapidCount = enriched.filter((feature) => feature.properties?.rapidLikely).length
  const operatorCount = new Set(
    enriched.map((feature) => feature.properties?.operatorLabel).filter(Boolean),
  ).size

  return {
    stationCount,
    rapidCount,
    rapidShare: stationCount ? (rapidCount / stationCount) * 100 : 0,
    operatorCount,
  }
}

export default function CityContextPanel() {
  const [state, setState] = useState({ loading: true, error: null, summaries: [] })

  useEffect(() => {
    let alive = true

    Promise.all(CITY_CONFIGS.map((city) => loadJson(city.dataPath)))
      .then((payloads) => {
        if (!alive) return

        const summaries = CITY_CONFIGS.map((city, index) => ({
          ...city,
          ...summariseStations(payloads[index]),
        }))

        setState({ loading: false, error: null, summaries })
      })
      .catch((err) => {
        if (!alive) return
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Unable to load city comparison data.',
          summaries: [],
        })
      })

    return () => {
      alive = false
    }
  }, [])

  const cards = useMemo(() => state.summaries, [state.summaries])

  if (state.loading) {
    return (
      <section className="part2-city-context">
        <div className="part2-city-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p2-city-card p2-city-card--skeleton" />
          ))}
        </div>
      </section>
    )
  }

  if (state.error || !cards.length) return null

  return (
    <section className="part2-city-context">
      <div className="part2-city-head">
        <div>
          <p className="p2-chart-eyebrow">Three-city context</p>
          <h2 className="part2-section-heading part2-section-heading--compact">
            London sits inside a wider urban comparison
          </h2>
        </div>
        <p className="part2-city-intro">
          Part 1 already showed that London, Birmingham, and Leeds have different charging
          geographies. That matters here: London&apos;s borough inequalities are part of a wider
          inter-city story, not a universal template for every UK urban network.
        </p>
      </div>

      <div className="part2-city-grid">
        {cards.map((city) => (
          <article key={city.id} className={`p2-city-card p2-city-card--${city.accent}`}>
            <div className="p2-city-card-head">
              <div className={`p2-city-icon p2-city-icon--${city.accent}`}>
                <city.Icon live />
              </div>
              <div>
                <p className="p2-chart-eyebrow">Part 1 dataset</p>
                <h3 className="p2-chart-title">{city.name}</h3>
              </div>
            </div>

            <div className="p2-city-metrics">
              <div>
                <span>Mapped stations</span>
                <strong>{city.stationCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Rapid-capable share</span>
                <strong>{city.rapidShare.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Rapid-capable points</span>
                <strong>{city.rapidCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Named operators</span>
                <strong>{city.operatorCount.toLocaleString()}</strong>
              </div>
            </div>

            <p className="p2-city-copy">{city.insight}</p>
          </article>
        ))}
      </div>

      <p className="p2-chart-footnote">
        Reused from Part 1: OpenStreetMap charging-station points for London, Birmingham, and
        Leeds. These city summaries are exploratory spatial context rather than audited official counts.
      </p>
    </section>
  )
}
