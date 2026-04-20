import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
  const chartData = data.slice(-6)
  const currentSystemNote =
    'The chart below uses the most recent six quarters, all on the current 3-8, 8-49, 50-149 and 150+ kW bands.'

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
          Standard charging still makes up the largest share by volume in {latest.quarter}. But rapid and ultra-rapid
          categories are the clearest signal that the network is becoming more time-efficient for everyday and
          long-distance use.
        </p>

        <div className="speed-chart-card">
          <div className="speed-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cStd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b8f97" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#8b8f97" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="cPlus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f7af2" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#4f7af2" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="cRap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d18b2f" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#d18b2f" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="cUltra" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c0567a" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#c0567a" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(35,38,45,0.08)" vertical={false} strokeDasharray="4 6" />
                <XAxis
                  dataKey="quarter"
                  stroke="rgba(35,38,45,0.55)"
                  tick={{ fontSize: 11, fill: 'rgba(35,38,45,0.72)' }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(35,38,45,0.55)"
                  tick={{ fontSize: 11, fill: 'rgba(35,38,45,0.72)' }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(248,245,239,0.98)',
                    border: '1px solid rgba(35,38,45,0.10)',
                    borderRadius: '8px',
                    color: '#23262d',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="standard" stackId="1" stroke="#8b8f97" fill="url(#cStd)" />
                <Area type="monotone" dataKey="standardPlus" stackId="1" stroke="#4f7af2" fill="url(#cPlus)" />
                <Area type="monotone" dataKey="rapid" stackId="1" stroke="#d18b2f" fill="url(#cRap)" />
                <Area type="monotone" dataKey="ultraRapid" stackId="1" stroke="#c0567a" fill="url(#cUltra)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="speed-chart-legend">
            {categoryConfig.map((item) => (
              <span key={item.key} className="speed-chart-legend-item">
                <i style={{ backgroundColor: item.accent }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
