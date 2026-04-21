import { useEffect, useRef, useState } from 'react'
import { usePart2Data } from '../../hooks/usePart2Data'
import { PulseBarsGlyph } from './Part2Glyphs.jsx'

const N_HIGHLIGHT = 5
const STAGGER_MS = 38
const DURATION_MS = 820
const EASE_POW = 2.8

function colorKey(index, total) {
  if (index < N_HIGHLIGHT) return 'top'
  if (index >= total - N_HIGHLIGHT) return 'bot'
  return 'mid'
}

export default function BoroughRankChart() {
  const { sortedByTotal, medianTotal, loading, error } = usePart2Data()
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
    if (!started || !sortedByTotal.length) return
    const n = sortedByTotal.length
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
  }, [started, sortedByTotal])

  if (loading) return <div className="p2-chart-loading">Loading...</div>
  if (error) return <div className="p2-chart-loading">Error loading data</div>

  const maxVal = sortedByTotal[0]?.chargersPer1000PiV ?? 1
  const medianPct = (medianTotal / maxVal) * 100
  const leader = sortedByTotal[0]

  return (
    <div ref={wrapRef} className="p2-premium-chart">
      <div className="p2-chart-header p2-chart-header--premium">
        <div className="p2-chart-hero">
          <div className="p2-chart-icon p2-chart-icon--blue">
            <PulseBarsGlyph live={started} />
          </div>
          <div>
            <p className="p2-chart-eyebrow">Total provision</p>
            <h3 className="p2-chart-title">Chargers per 1,000 plug-in vehicles</h3>
          </div>
        </div>

        <div className="p2-chart-chips">
          <span className="p2-chart-chip p2-chart-chip--blue">
            Leader {leader?.name}
          </span>
          <span className="p2-chart-chip">
            Median {medianTotal.toFixed(1)}
          </span>
        </div>

        <p className="p2-chart-desc">
          Boroughs are benchmarked against local plug-in vehicle stock rather than population,
          revealing where installed supply is genuinely keeping pace with adoption.
          <span className="p2-legend-inline">
            <i className="p2-dot p2-dot--top" /> Top 5
            <i className="p2-dot p2-dot--mid" /> Mid
            <i className="p2-dot p2-dot--bot" /> Bottom 5
          </span>
        </p>
      </div>

      <div className="p2-bars-wrap">
        <div className="p2-bars-labels">
          {sortedByTotal.map((d, i) => (
            <div
              key={d.code}
              className={`p2-bar-label-row${hovered === d.code ? ' is-hovered' : ''}`}
              onMouseEnter={() => setHovered(d.code)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={`p2-rank p2-rank--${colorKey(i, sortedByTotal.length)}`}>
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

          {sortedByTotal.map((d, i) => {
            const pct = (d.chargersPer1000PiV / maxVal) * 100
            const ck = colorKey(i, sortedByTotal.length)
            const prog = progresses[i] ?? 0
            const isLive = prog > 0 && prog < 1
            const animPct = prog * pct
            const animVal = prog * d.chargersPer1000PiV

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
                  {animVal.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="p2-chart-footnote">
        DfT EVCI local authority table Jan 2026 + VEH0142 2025 Q3 licensed plug-in cars.
      </p>
    </div>
  )
}
