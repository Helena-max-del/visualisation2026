export function PulseBarsGlyph({ live = false }) {
  return (
    <svg className={`p2-glyph${live ? ' is-live' : ''}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect className="p2-glyph-stroke" x="6" y="29" width="7" height="11" rx="3" />
      <rect className="p2-glyph-stroke" x="20.5" y="18" width="7" height="22" rx="3" />
      <rect className="p2-glyph-stroke" x="35" y="10" width="7" height="30" rx="3" />
      <path className="p2-glyph-stroke" d="M7 14c4.5 0 6.8 7 11.5 7S25 8 30 8s6.5 6 11 6" />
      <circle className="p2-glyph-core" cx="41" cy="14" r="2.6" />
    </svg>
  )
}

export function RapidBoltGlyph({ live = false }) {
  return (
    <svg className={`p2-glyph${live ? ' is-live' : ''}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path className="p2-glyph-stroke" d="M24 5 14 24h8l-4 19 16-24h-9l5-14Z" />
      <path className="p2-glyph-stroke" d="M8 34c4 0 6.5-3 10.5-3 3.9 0 5.8 3 9.5 3 4.1 0 6-3 12-3" />
      <circle className="p2-glyph-core" cx="40" cy="31" r="2.5" />
    </svg>
  )
}

export function ShiftGlyph({ live = false }) {
  return (
    <svg className={`p2-glyph${live ? ' is-live' : ''}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path className="p2-glyph-stroke" d="M8 35h32" />
      <path className="p2-glyph-stroke" d="M12 28c3-8 8-12 12-12s8 2 12 10" />
      <path className="p2-glyph-stroke" d="m28 13 8 1-3-7" />
      <circle className="p2-glyph-core" cx="12" cy="28" r="2.4" />
      <circle className="p2-glyph-core" cx="36" cy="26" r="2.4" />
    </svg>
  )
}

export function OrbitRingGlyph({ live = false }) {
  return (
    <svg className={`p2-glyph${live ? ' is-live' : ''}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle className="p2-glyph-stroke" cx="24" cy="24" r="15" />
      <path className="p2-glyph-stroke" d="M24 9a15 15 0 0 1 15 15" />
      <path className="p2-glyph-stroke" d="M11 24c0 7.2 5.8 13 13 13" />
      <circle className="p2-glyph-core" cx="24" cy="24" r="3.4" />
      <circle className="p2-glyph-core" cx="39" cy="24" r="2.2" />
    </svg>
  )
}
