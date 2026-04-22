const categoryConfig = [
  {
    key: 'standard',
    label: 'Standard',
    power: '3-8 kW',
    badge: 'S',
    image:
      'https://images.unsplash.com/photo-1694889651019-2d774dc5a9ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    description: 'Primarily domestic and long-stay destination charging.',
    accent: '#6b7280',
  },
  {
    key: 'standardPlus',
    label: 'Standard Plus',
    power: '8-49 kW',
    badge: 'SP',
    image:
      'https://images.unsplash.com/photo-1707758283240-814ee7fbb33a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    description: 'Street-side or retail charging for medium dwell times.',
    accent: '#4f7af2',
  },
  {
    key: 'rapid',
    label: 'Rapid',
    power: '50-149 kW',
    badge: 'R',
    image:
      'https://images.unsplash.com/photo-1628630470704-851b2a73271b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    description: 'Fast public charging that supports corridor travel and quick top-ups.',
    accent: '#d18b2f',
  },
  {
    key: 'ultraRapid',
    label: 'Ultra Rapid',
    power: '150+ kW',
    badge: 'UR',
    image:
      'https://images.unsplash.com/photo-1515594515116-863345d8507c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    description: 'Dedicated hubs and motorway services built around very short waits.',
    accent: '#c0567a',
  },
]

export default function SpeedBandShowcase({ data = [] }) {
  if (!data.length) return null

  const latest = data[data.length - 1]
  const currentSystemNote =
    'These four categories are still useful for showing how the public network ranges from slower long-stay charging to time-efficient rapid and ultra-rapid provision.'

  return (
    <section className="speed-section glass-card">
      <div className="speed-section-copy">
        <p className="speed-eyebrow">Charging speed introduction</p>
        <h2 className="speed-title">
          Network composition by <span>speed categories</span>
        </h2>
        <p className="speed-subtitle">
          The charging network is divided into main categories based on power output. The shift towards rapid and
          ultra-rapid provision matters because it changes not just how much infrastructure exists, but how usable it
          feels in everyday travel.
        </p>
        <p className="speed-system-note">{currentSystemNote}</p>
      </div>

      <div className="speed-icon-row" aria-hidden="true">
        {categoryConfig.map((item) => (
          <div key={item.key} className="speed-icon-chip" style={{ '--speed-accent': item.accent }}>
            <span>{item.badge}</span>
          </div>
        ))}
      </div>

      <div className="speed-image-band">
        {categoryConfig.map((item, index) => (
          <article key={item.key} className="speed-image-panel" style={{ '--speed-accent': item.accent }}>
            <img src={item.image} alt={item.label} className="speed-image" />
            <div className="speed-image-overlay" />
            <div className="speed-image-index">{index + 1}</div>
            <div className="speed-image-copy">
              <p className="speed-image-power">{item.power}</p>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <div className="speed-image-metric">
                <span>Latest count</span>
                <strong>{Number(latest[item.key] || 0).toLocaleString()}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="speed-chart-shell">
        <p className="speed-chart-note">
          In {latest.quarter}, standard charging still makes up the largest share by volume, while rapid and
          ultra-rapid categories represent the most time-efficient part of the network for shorter stops and longer
          trips.
        </p>
      </div>
    </section>
  )
}
