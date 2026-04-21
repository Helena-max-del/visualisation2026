import { useEffect, useRef, useState } from 'react'
import { usePart2Data } from '../../hooks/usePart2Data'

function useCountUp(target, decimals = 1, duration = 1600) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!target) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - t, 3)
          setVal(+(target * ease).toFixed(decimals))
          if (t < 1) requestAnimationFrame(tick)
          else setVal(target)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, decimals, duration])

  return { val, ref }
}

function CountCard({ label, target, decimals, note, highlight, delay }) {
  const { val, ref } = useCountUp(target, decimals)

  return (
    <div
      ref={ref}
      className={`p2-summary-card${highlight ? ' p2-summary-card--highlight' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="p2-summary-label">{label}</p>
      <h3 className="p2-summary-value">{val.toFixed(decimals)}</h3>
      <p className="p2-summary-note">{note}</p>
    </div>
  )
}

function TextCard({ label, value, note, delay }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true)
          obs.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`p2-summary-card p2-summary-card--text${vis ? ' is-visible' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="p2-summary-label">{label}</p>
      <h3 className="p2-summary-value p2-summary-value--sm">{value ?? '--'}</h3>
      <p className="p2-summary-note">{note}</p>
    </div>
  )
}

export default function AdequacySummaryCards() {
  const { sortedByTotal, medianTotal, medianRapid, loading } = usePart2Data()

  if (loading) {
    return (
      <div className="p2-summary-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p2-summary-card p2-summary-card--skeleton" />
        ))}
      </div>
    )
  }

  const bestTotal = sortedByTotal[0]
  const worstTotal = sortedByTotal[sortedByTotal.length - 1]

  return (
    <div className="p2-summary-grid">
      <CountCard
        label="Median total adequacy"
        target={medianTotal}
        decimals={1}
        note="chargers per 1,000 plug-in vehicles, London median"
        highlight
        delay={0}
      />
      <CountCard
        label="Median rapid adequacy"
        target={medianRapid}
        decimals={2}
        note="rapid (50kW+) chargers per 1,000 plug-in vehicles"
        delay={0.1}
      />
      <TextCard
        label="Highest total provision"
        value={bestTotal?.name}
        note={bestTotal ? `${bestTotal.chargersPer1000PiV.toFixed(1)} chargers per 1,000 PiV` : ''}
        delay={0.2}
      />
      <TextCard
        label="Lowest total provision"
        value={worstTotal?.name}
        note={worstTotal ? `${worstTotal.chargersPer1000PiV.toFixed(1)} chargers per 1,000 PiV` : ''}
        delay={0.3}
      />
    </div>
  )
}
