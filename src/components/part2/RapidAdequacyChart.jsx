import { useEffect, useRef, useState } from 'react'
import { usePart2Data } from '../../hooks/usePart2Data'
import { RapidBoltGlyph } from './Part2Glyphs.jsx'

const N_HIGHLIGHT = 5
const STAGGER_MS = 38
const DURATION_MS = 820
const EASE_POW = 2.8

function colorKey(index, total) {
  if (index < N_HIGHLIGHT) return 'top'
  if (index >= total - N_HIGHLIGHT) return 'bot'
  return 'mid'
}

export default function RapidAdequacyChart() {
  const { sortedByRapid, medianRapid, loading, error } = usePart2Data()
  const [started, setStarted] = useState(false)
  const [progresses, setProgresses] = useState([])
  const [hovered, setHovered] = useState(null)
  const wrapRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const el = wrapRef.current
    const timer = setTimeout(() => setStarted(true), 300)
    if (!el) return () => clearTimeout(timer)
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(timer)
          setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0 },
    )
    obs.observe(el)
    return () => {
      clearTimeout(timer)
      obs.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!started || !sortedByRapid.length) return
    const n = sortedByRapid.length
    const origin = performance.now()
    const starts = Array.from({ length: n }, (_, i) => origin + i * STAGGER_MS)

    setProgresses(new Array(n).fill(0))

    const tick = (now) => {
      const ps = starts.map((s) => {
        if (now < s) return 0
        const t = Math.min((now - s) / DURATION_MS, 1)
        return 1 - Math.pow(1 - t, EASE_POW)
      })
      setProgresses(ps)
      if (ps.some((p) => p < 1)) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [started, sortedByRapid])

  if (loading) return <div className="p2-chart-loading">Loading...</div>
  if (error) return <div className="p2-chart-loading">Error loading data</div>

  const maxVal = sortedByRapid[0]?.rapidPer1000PiV ?? 1
  const medianPct = (medianRapid / maxVal) * 100
  const leader = sortedByRapid[0]

  return (
    <div ref={wrapRef} className="p2-premium-chart">
      <div className="p2-chart-header p2-chart-header--premium">
        <div className="p2-chart-hero">
          <div className="p2-chart-icon p2-chart-icon--amber">
            <RapidBoltGlyph live={started} />
          </div>
          <div>
            <p className="p2-chart-eyebrow">Rapid provision (50kW+)</p>
            <h3 className="p2-chart-title">Rapid chargers per 1,000 plug-in vehicles</h3>
          </div>
        </div>

        <div className="p2-chart-chips">
          <span className="p2-chart-chip p2-chart-chip--amber">
            Leader {leader?.name}
          </span>
          <span className="p2-chart-chip">
            Median {medianRapid.toFixed(2)}
          </span>
        </div>

        <p className="p2-chart-desc">
          Fast-charging coverage follows a different geography from overall provision, which
          means some boroughs have built a speed-oriented network while others remain slow-heavy.
          <span className="p2-legend-inline">
            <i className="p2-dot p2-dot--top" /> Top 5
            <i className="p2-dot p2-dot--mid" /> Mid
            <i className="p2-dot p2-dot--bot" /> Bottom 5
          </span>
        </p>
      </div>

      <div className="p2-bars-wrap">
        <div className="p2-bars-labels">
          {sortedByRapid.map((d, i) => (
            <div
              key={d.code}
              className={`p2-bar-label-row${hovered === d.code ? ' is-hovered' : ''}`}
              onMouseEnter={() => setHovered(d.code)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={`p2-rank p2-rank--${colorKey(i, sortedByRapid.length)}`}>
                {i + 1}
              </span>
              <span className="p2-name">{d.name}</span>
            </div>
          ))}
        </div>

        <div className="p2-bars-tracks">
          <div className="p2-median-line" style={{ left: `${medianPct}%` }}>
            <span className="p2-median-label">Median</span>
          </div>

          {sortedByRapid.map((d, i) => {
            const pct = (d.rapidPer1000PiV / maxVal) * 100
            const ck = colorKey(i, sortedByRapid.length)
            const prog = progresses[i] ?? 0
            const isLive = prog > 0 && prog < 1
            const animPct = prog * pct
            const animVal = prog * d.rapidPer1000PiV

            return (
              <div
                key={d.code}
                className={`p2-bar-track-row${hovered === d.code ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHovered(d.code)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="p2-track">
                  <div className="p2-track-grid" />
                  <div
                    className={`p2-fill p2-fill--${ck}${isLive ? ' p2-fill--live' : ''}`}
                    style={{ width: `${animPct}%`, transition: 'none' }}
                  />
                  <div
                    className={`p2-endcap p2-endcap--${ck}${isLive ? ' is-live' : ''}`}
                    style={{ left: `${animPct}%` }}
                  />
                </div>
                <span className={`p2-val p2-val--${ck} p2-val-pill`}>
                  {animVal.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="p2-chart-footnote">
        Rapid = 50kW and above. DfT EVCI Jan 2026 + VEH0142 2025 Q3.
      </p>
    </div>
  )
}
