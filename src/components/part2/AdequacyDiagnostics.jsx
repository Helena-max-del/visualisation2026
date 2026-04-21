import { useEffect, useRef, useState } from 'react'
import { usePart2Data } from '../../hooks/usePart2Data'
import { OrbitRingGlyph, ShiftGlyph } from './Part2Glyphs.jsx'

function useInView(threshold = 0.05) {
  const ref = useRef(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

function RankShiftPanel({ rows, live }) {
  const maxRank = 33

  return (
    <div className="p2-signal-card">
      <div className="p2-signal-head">
        <div className="p2-signal-icon p2-signal-icon--blue">
          <ShiftGlyph live={live} />
        </div>
        <div>
          <p className="p2-chart-eyebrow">Rank divergence</p>
          <h3 className="p2-chart-title">Where total supply and rapid supply tell different stories</h3>
        </div>
      </div>

      <p className="p2-chart-desc">
        These boroughs move the most between the total adequacy ranking and the rapid adequacy
        ranking. Long connectors indicate a bigger structural mismatch.
      </p>

      <div className="p2-shift-axis">
        <span>Total rank</span>
        <span>Rapid rank</span>
      </div>

      <div className="p2-shift-list">
        {rows.map((row, index) => {
          const totalLeft = ((row.totalRank - 1) / (maxRank - 1)) * 100
          const rapidLeft = ((row.rapidRank - 1) / (maxRank - 1)) * 100
          const start = Math.min(totalLeft, rapidLeft)
          const width = Math.abs(totalLeft - rapidLeft)
          const risesInRapid = row.rankDelta > 0

          return (
            <div
              key={row.code}
              className={`p2-shift-row${live ? ' is-live' : ''}`}
              style={{ '--shift-delay': `${index * 90}ms` }}
            >
              <div className="p2-shift-meta">
                <span className="p2-shift-name">{row.name}</span>
                <span className={`p2-shift-delta${risesInRapid ? ' is-positive' : ''}`}>
                  {risesInRapid ? '+' : ''}
                  {Math.abs(row.rankDelta)} places
                </span>
              </div>

              <div className="p2-shift-track">
                <div className="p2-shift-guide" />
                <div className="p2-shift-link" style={{ left: `${start}%`, width: `${width}%` }} />
                <div className="p2-shift-dot p2-shift-dot--total" style={{ left: `${totalLeft}%` }} />
                <div className="p2-shift-dot p2-shift-dot--rapid" style={{ left: `${rapidLeft}%` }} />
              </div>

              <div className="p2-shift-ranks">
                <span>#{row.totalRank}</span>
                <span>#{row.rapidRank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RapidSharePanel({ rows, live }) {
  return (
    <div className="p2-signal-card">
      <div className="p2-signal-head">
        <div className="p2-signal-icon p2-signal-icon--amber">
          <OrbitRingGlyph live={live} />
        </div>
        <div>
          <p className="p2-chart-eyebrow">Rapid mix</p>
          <h3 className="p2-chart-title">Fast charging is concentrated in a different set of boroughs</h3>
        </div>
      </div>

      <p className="p2-chart-desc">
        Rapid share captures the proportion of each borough&apos;s public network that is 50kW+.
        A high share suggests a more speed-oriented mix, even when overall supply remains low.
      </p>

      <div className="p2-ring-grid">
        {rows.map((row, index) => {
          const pct = row.rapidShare * 100
          const dash = `${pct} ${100 - pct}`

          return (
            <div
              key={row.code}
              className={`p2-ring-card${live ? ' is-live' : ''}`}
              style={{ '--ring-delay': `${index * 110}ms` }}
            >
              <div className="p2-ring-wrap">
                <svg viewBox="0 0 42 42" className="p2-ring-svg" aria-hidden="true">
                  <circle className="p2-ring-track" cx="21" cy="21" r="15.915" />
                  <circle
                    className="p2-ring-fill"
                    cx="21"
                    cy="21"
                    r="15.915"
                    pathLength="100"
                    strokeDasharray={dash}
                  />
                </svg>
                <div className="p2-ring-core">
                  <strong>{pct.toFixed(1)}%</strong>
                  <span>rapid</span>
                </div>
              </div>

              <div className="p2-ring-copy">
                <h4>{row.name}</h4>
                <p>
                  {row.rapidChargers.toFixed(0)} rapid / {row.totalChargers.toFixed(0)} total chargers
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdequacyDiagnostics() {
  const { rankShift, sortedByRapidShare, loading, error } = usePart2Data()
  const { ref, inView } = useInView()

  if (loading) return null
  if (error) return null

  const shiftRows = rankShift.slice(0, 8)
  const rapidMixRows = sortedByRapidShare.slice(0, 6)

  return (
    <div ref={ref} className="part2-insight-row">
      <RankShiftPanel rows={shiftRows} live={inView} />
      <RapidSharePanel rows={rapidMixRows} live={inView} />
    </div>
  )
}
