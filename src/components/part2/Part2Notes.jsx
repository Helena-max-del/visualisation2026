import { useEffect, useRef, useState } from 'react'

function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
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

function IcoDatabase({ play }) {
  const s = (i) => ({ style: { '--i': i } })
  return (
    <svg className={`p2mc-svg${play ? ' p2mc-play' : ''}`} viewBox="0 0 40 40" fill="none">
      <ellipse className="p2mc-stroke" cx="20" cy="11" rx="12" ry="4" {...s(0)} />
      <path className="p2mc-stroke" d="M8 11v10M32 11v10" {...s(1)} />
      <ellipse className="p2mc-stroke" cx="20" cy="21" rx="12" ry="4" {...s(2)} />
      <path className="p2mc-stroke" d="M8 21v10M32 21v10" {...s(3)} />
      <ellipse className="p2mc-stroke" cx="20" cy="31" rx="12" ry="4" {...s(4)} />
    </svg>
  )
}

function IcoRatio({ play }) {
  const s = (i) => ({ style: { '--i': i } })
  return (
    <svg className={`p2mc-svg${play ? ' p2mc-play' : ''}`} viewBox="0 0 40 40" fill="none">
      <path
        className="p2mc-stroke"
        d="M22 6 L18 18h5L18 33"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...s(0)}
      />
      <line className="p2mc-stroke" x1="4" y1="20" x2="36" y2="20" {...s(1)} />
      <path
        className="p2mc-stroke"
        d="M10 22 L14 17h12l4 5v9a2 2 0 01-2 2H12a2 2 0 01-2-2v-9z"
        strokeLinejoin="round"
        {...s(2)}
      />
      <circle className="p2mc-fill-dot" cx="15" cy="35.5" r="2.2" {...s(3)} />
      <circle className="p2mc-fill-dot" cx="25" cy="35.5" r="2.2" {...s(3)} />
    </svg>
  )
}

function IcoMatrix({ play }) {
  const s = (i) => ({ style: { '--i': i } })
  return (
    <svg className={`p2mc-svg${play ? ' p2mc-play' : ''}`} viewBox="0 0 40 40" fill="none">
      <rect className="p2mc-stroke" x="4" y="4" width="32" height="32" rx="3" {...s(0)} />
      <line className="p2mc-stroke" x1="4" y1="14.7" x2="36" y2="14.7" {...s(1)} />
      <line className="p2mc-stroke" x1="4" y1="25.3" x2="36" y2="25.3" {...s(1)} />
      <line className="p2mc-stroke" x1="14.7" y1="4" x2="14.7" y2="36" {...s(1)} />
      <line className="p2mc-stroke" x1="25.3" y1="4" x2="25.3" y2="36" {...s(1)} />
      <rect className="p2mc-cell p2mc-cell--a" x="4.5" y="25.8" width="9.7" height="9.7" rx="1.5" {...s(2)} />
      <rect className="p2mc-cell p2mc-cell--b" x="15.2" y="15.2" width="9.7" height="9.7" rx="1.5" {...s(3)} />
      <rect className="p2mc-cell p2mc-cell--c" x="25.8" y="4.5" width="9.7" height="9.7" rx="1.5" {...s(4)} />
    </svg>
  )
}

function IcoWarning({ play }) {
  const s = (i) => ({ style: { '--i': i } })
  return (
    <svg className={`p2mc-svg${play ? ' p2mc-play' : ''}`} viewBox="0 0 40 40" fill="none">
      <path className="p2mc-stroke" d="M20 6 L36 34 H4 Z" strokeLinejoin="round" {...s(0)} />
      <line className="p2mc-stroke" x1="20" y1="17" x2="20" y2="26" strokeLinecap="round" {...s(1)} />
      <circle className="p2mc-fill-dot" cx="20" cy="30.5" r="2" {...s(2)} />
    </svg>
  )
}

const STEPS = [
  {
    id: 'data',
    step: '01',
    Icon: IcoDatabase,
    color: '#4f7af2',
    title: 'Data Sources',
    body: (
      <>
        Supply from <strong>DfT EVCI Jan 2026</strong> - total and 50kW+ public charger
        counts per London borough. Vehicle stock from <strong>DfT VEH0142 2025 Q3</strong>,
        filtered to licensed plug-in cars (BEV + PHEV) by ONS local authority geography.
      </>
    ),
  },
  {
    id: 'adequacy',
    step: '02',
    Icon: IcoRatio,
    color: '#d18b2f',
    title: 'Adequacy Indicators',
    body: (
      <>
        <strong>Chargers per 1,000 plug-in vehicles</strong> and{' '}
        <strong>rapid chargers per 1,000 plug-in vehicles</strong> normalise supply against
        local EV ownership, making rankings sensitive to where EVs actually are, not just
        where people live.
      </>
    ),
  },
  {
    id: 'bivariate',
    step: '03',
    Icon: IcoMatrix,
    color: '#be64ac',
    title: 'Bivariate Classification',
    body: (
      <>
        Boroughs are cross-classified: <strong>supply tier</strong> (chargers per 10,000
        residents, tercile) x <strong>demand tier</strong> (no-car household share as a
        public-charging dependence proxy). Purple = high need + low supply = most constrained.
      </>
    ),
  },
  {
    id: 'limits',
    step: '04',
    Icon: IcoWarning,
    color: '#c94f4f',
    title: 'Limitations',
    body: (
      <>
        Vehicle stock lags actual EV demand. No-car data is from <strong>Census 2021</strong>.
        Charger reliability, opening hours, and payment accessibility are not captured.
        <strong> Private and workplace-only chargers are excluded throughout.</strong>
      </>
    ),
  },
]

const FORMULA = [
  { text: 'Chargers (50kW+)', sub: 'supply', color: '#4f7af2' },
  { text: '/', sub: null, color: '#8a8f9a' },
  { text: 'Plug-in Vehicles', sub: 'local stock', color: '#d18b2f' },
  { text: 'x 1,000', sub: null, color: '#8a8f9a' },
  { text: '= Adequacy Score', sub: 'per borough', color: '#be64ac' },
]

export default function Part2Notes() {
  const { ref: headRef, inView: headIn } = useInView(0.1)
  const { ref: formulaRef, inView: formulaIn } = useInView(0.15)
  const { ref: gridRef, inView: gridIn } = useInView(0.05)
  const { ref: quoteRef, inView: quoteIn } = useInView(0.2)

  return (
    <section className="p2-methodology">
      <div ref={headRef} className={`p2-methodology-header p2-fade-up${headIn ? ' is-in' : ''}`}>
        <p className="p2-chart-eyebrow">Methodology</p>
        <h2 className="p2-methodology-title">
          How these indicators
          <br />
          are constructed
        </h2>
      </div>

      <div ref={formulaRef} className={`p2-formula${formulaIn ? ' is-in' : ''}`}>
        <p className="p2-formula-label">The core calculation</p>
        <div className="p2-formula-row">
          {FORMULA.map((p, i) => (
            <div key={i} className="p2-formula-part" style={{ '--fi': i }}>
              <span className="p2-formula-term" style={{ color: p.color }}>{p.text}</span>
              {p.sub && <span className="p2-formula-sub">{p.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      <div ref={gridRef} className="p2-mcard-grid">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`p2mc${gridIn ? ' is-in' : ''}`}
            style={{ '--card-delay': `${i * 0.11}s`, '--card-color': step.color }}
          >
            <div className="p2mc-head">
              <span className="p2mc-num">{step.step}</span>
              <step.Icon play={gridIn} />
            </div>
            <h4 className="p2mc-title">{step.title}</h4>
            <p className="p2mc-body">{step.body}</p>
          </div>
        ))}
      </div>

      <div ref={quoteRef} className={`p2-takeaway p2-fade-up${quoteIn ? ' is-in' : ''}`}>
        <p className="p2-chart-eyebrow">Key finding</p>
        <blockquote className="p2-takeaway-quote">
          "Even within London, provision is uneven: boroughs with higher proportions of no-car
          households, and therefore greater likely dependence on public charging,
          <mark className="p2-quote-mark"> are not consistently better served</mark>.
          Network growth alone does not close this gap."
        </blockquote>
      </div>
    </section>
  )
}
