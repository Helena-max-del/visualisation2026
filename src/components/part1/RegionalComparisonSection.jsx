import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const metricOptions = [
  {
    key: 'totalPer100k',
    label: 'Devices per 100k',
    summary: 'Population-adjusted overview across differently sized regions.',
  },
  {
    key: 'totalDevices',
    label: 'Total devices',
    summary: 'Absolute network size at all speeds.',
  },
  {
    key: 'devices50kwPlusPer100k',
    label: '50kW+ per 100k',
    summary: 'Population-adjusted access to faster charging.',
  },
  {
    key: 'devices50kwPlus',
    label: '50kW+ devices',
    summary: 'Absolute stock of faster public charging devices.',
  },
]

const linePalette = ['#99558a', '#5e6d9f', '#2f7b86', '#c694ba', '#95a1b8']
const quarterBandPalette = [
  'rgba(153, 85, 138, 0.06)',
  'rgba(94, 109, 159, 0.05)',
  'rgba(47, 123, 134, 0.05)',
  'rgba(198, 148, 186, 0.06)',
]

function compactNumber(value) {
  const num = Number(value || 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toLocaleString()
}

function formatMetricValue(metricKey, value) {
  if (value == null) return 'n/a'
  const numeric = Number(value)
  if (metricKey.includes('Per100k')) return numeric.toFixed(1)
  return numeric.toLocaleString()
}

function formatSignedMetricValue(metricKey, value) {
  if (value == null) return 'n/a'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatMetricValue(metricKey, Math.abs(value))}`
}

function formatAxisValue(metricKey, value) {
  if (metricKey.includes('Per100k')) return Number(value).toFixed(value >= 100 ? 0 : 1)
  return compactNumber(value)
}

function buildMetricDomain(chartData, comparisonRegions) {
  const values = chartData.flatMap((row) =>
    comparisonRegions
      .map((region) => row[region.name])
      .filter((value) => value != null && Number.isFinite(Number(value)))
      .map((value) => Number(value)),
  )

  if (!values.length) return ['auto', 'auto']

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.15
    return [Math.max(0, min - padding), max + padding]
  }

  const spread = max - min
  const lower = Math.max(0, min - spread * 0.18)
  const upper = max + spread * 0.14
  return [Number(lower.toFixed(1)), Number(upper.toFixed(1))]
}

function RegionalBubbleDot({ cx, cy, stroke, payload, isSelected, latestQuarter }) {
  if (cx == null || cy == null || !payload) return null

  const isLatest = payload.quarter === latestQuarter
  const outerRadius = isSelected ? (isLatest ? 17 : 15) : 11.5

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill={stroke}
        fillOpacity={isSelected ? 0.38 : 0.26}
        stroke="rgba(255,255,255,0.82)"
        strokeWidth={isSelected ? 2.2 : 1.6}
      />
      {isSelected && isLatest ? (
        <text
          x={cx + 22}
          y={cy - 12}
          fill="rgba(35,38,45,0.58)"
          fontSize="11"
          fontWeight="700"
        >
          Current
        </text>
      ) : null}
    </g>
  )
}

export default function RegionalComparisonSection({ data = [], note = '' }) {
  const hasData = data.length > 0
  const defaultRegionName = hasData ? data.find((item) => item.name === 'London')?.name || data[0].name : ''
  const [selectedRegionName, setSelectedRegionName] = useState(defaultRegionName)
  const [metricKey, setMetricKey] = useState('totalPer100k')

  useEffect(() => {
    if (!hasData) return
    if (!data.some((item) => item.name === selectedRegionName)) {
      setSelectedRegionName(defaultRegionName)
    }
  }, [data, defaultRegionName, hasData, selectedRegionName])

  const selectedRegion = useMemo(
    () => (hasData ? data.find((region) => region.name === selectedRegionName) || data[0] : null),
    [data, hasData, selectedRegionName]
  )

  const ranking = useMemo(() => {
    if (!hasData) return []
    return data
      .map((region) => {
        const first = region.series[0]
        const latest = region.series[region.series.length - 1]
        const latestValue = latest?.[metricKey] ?? null
        const firstValue = first?.[metricKey] ?? null
        const changeAbs =
          latestValue != null && firstValue != null ? Number(latestValue) - Number(firstValue) : null
        const changePct =
          changeAbs != null && Number(firstValue) !== 0 ? (changeAbs / Number(firstValue)) * 100 : null
        const fastShare =
          latest?.totalDevices ? (Number(latest.devices50kwPlus || 0) / Number(latest.totalDevices)) * 100 : null

        return {
          name: region.name,
          latestValue,
          changeAbs,
          changePct,
          fastShare,
        }
      })
      .sort((a, b) => Number(b.latestValue || 0) - Number(a.latestValue || 0))
  }, [data, hasData, metricKey])

  const selectedStats = selectedRegion ? ranking.find((row) => row.name === selectedRegion.name) || ranking[0] : null
  const leader = ranking[0]
  const fastestGrowth = [...ranking].sort((a, b) => Number(b.changePct || 0) - Number(a.changePct || 0))[0]
  const metricMeta = metricOptions.find((option) => option.key === metricKey) || metricOptions[0]

  const comparisonNames = useMemo(() => {
    const topNames = ranking.slice(0, 4).map((row) => row.name)
    return [...new Set([selectedRegion?.name, ...topNames].filter(Boolean))].slice(0, 5)
  }, [ranking, selectedRegion])

  const comparisonRegions = useMemo(
    () => comparisonNames.map((name) => data.find((region) => region.name === name)).filter(Boolean),
    [comparisonNames, data]
  )

  const chartData = useMemo(() => {
    if (!selectedRegion) return []
    return selectedRegion.series.map((point, index) => {
      const row = { quarter: point.quarter }

      comparisonRegions.forEach((region) => {
        row[region.name] = region.series[index]?.[metricKey] ?? null
      })

      return row
    })
  }, [selectedRegion, comparisonRegions, metricKey])

  const chartDomain = useMemo(() => buildMetricDomain(chartData, comparisonRegions), [chartData, comparisonRegions])
  const latestQuarter = chartData[chartData.length - 1]?.quarter ?? null
  const chartBands = useMemo(
    () =>
      chartData.slice(0, -1).map((row, index) => ({
        x1: row.quarter,
        x2: chartData[index + 1]?.quarter,
        fill: quarterBandPalette[index % quarterBandPalette.length],
      })),
    [chartData],
  )

  if (!hasData || !selectedRegion) return null

  return (
    <section className="regional-explorer">
      <div className="glass-card regional-explorer-main">
        <div className="regional-explorer-header">
          <p className="eyebrow">Regional overview</p>
          <h2 className="regional-explorer-title">Regional distribution overview from 2025</h2>
          <p className="regional-explorer-copy">
            The DfT region tables begin in 2025-Q1, so this section uses the latest five comparable quarters to show
            how charging provision is distributed across UK regions, how the picture changes under different metrics,
            and which places lead once population is taken into account.
          </p>
        </div>

        <div className="regional-metric-row">
          {metricOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={option.key === metricKey ? 'regional-metric-pill is-active' : 'regional-metric-pill'}
              onClick={() => setMetricKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="regional-stat-grid">
          <article className="regional-stat-card">
            <p className="regional-stat-label">Selected region</p>
            <h3>{selectedRegion.name}</h3>
            <p className="regional-stat-value">{formatMetricValue(metricKey, selectedStats?.latestValue)}</p>
            <p className="regional-stat-note">{metricMeta.summary}</p>
          </article>

          <article className="regional-stat-card">
            <p className="regional-stat-label">Change since 2025-Q1</p>
            <h3>{formatSignedMetricValue(metricKey, selectedStats?.changeAbs)}</h3>
            <p className="regional-stat-note">
              {selectedStats?.changePct == null
                ? 'No comparable baseline is available.'
                : `${selectedStats.changePct.toFixed(1)}% over the five-quarter region series.`}
            </p>
          </article>

          <article className="regional-stat-card">
            <p className="regional-stat-label">50kW+ share</p>
            <h3>{selectedStats?.fastShare == null ? 'n/a' : `${selectedStats.fastShare.toFixed(1)}%`}</h3>
            <p className="regional-stat-note">Share of the selected region&apos;s latest stock that is 50kW+.</p>
          </article>

          <article className="regional-stat-card">
            <p className="regional-stat-label">Latest leader</p>
            <h3>{leader?.name || 'n/a'}</h3>
            <p className="regional-stat-note">
              {leader ? `${formatMetricValue(metricKey, leader.latestValue)} in 2026-Q1.` : 'No ranking data is available.'}
            </p>
          </article>
        </div>

        <div className="regional-line-legend">
          {comparisonRegions.map((region, index) => (
            <span
              key={region.name}
              className={region.name === selectedRegion.name ? 'regional-line-tag is-selected' : 'regional-line-tag'}
            >
              <i style={{ backgroundColor: linePalette[index % linePalette.length] }} />
              {region.name}
            </span>
          ))}
        </div>

        <div className="regional-chart-frame">
          <div className="regional-chart-head">
            <div>
              <p className="regional-panel-eyebrow">Trend view</p>
              <h3>Comparable five-quarter trajectory</h3>
            </div>
            <p>
              {selectedRegion.name} is highlighted against the current leading comparison regions for {metricMeta.label.toLowerCase()}.
            </p>
          </div>

          <div className="regional-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 14, right: 28, left: 4, bottom: 6 }}>
                {chartBands.map((band) =>
                  band.x2 ? (
                    <ReferenceArea
                      key={`${band.x1}-${band.x2}`}
                      x1={band.x1}
                      x2={band.x2}
                      y1={chartDomain[0]}
                      y2={chartDomain[1]}
                      fill={band.fill}
                      fillOpacity={1}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                    />
                  ) : null,
                )}
                <CartesianGrid stroke="rgba(135,121,142,0.18)" vertical={false} strokeDasharray="4 6" />
                <XAxis
                  dataKey="quarter"
                  tick={{ fill: 'rgba(35,38,45,0.60)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  domain={chartDomain}
                  tickCount={5}
                  tickFormatter={(value) => formatAxisValue(metricKey, value)}
                  tick={{ fill: 'rgba(35,38,45,0.60)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(252, 249, 252, 0.98)',
                    border: '1px solid rgba(153,85,138,0.14)',
                    borderRadius: '8px',
                    color: '#23262d',
                  }}
                  labelStyle={{ color: '#23262d', fontWeight: 700 }}
                  formatter={(value, name) => [formatMetricValue(metricKey, value), name]}
                />

                {comparisonRegions.map((region, index) => (
                  <Line
                    key={region.name}
                    type="natural"
                    dataKey={region.name}
                    stroke={linePalette[index % linePalette.length]}
                    strokeOpacity={0}
                    strokeWidth={0}
                    dot={(props) => (
                      <RegionalBubbleDot
                        {...props}
                        isSelected={region.name === selectedRegion.name}
                        latestQuarter={latestQuarter}
                      />
                    )}
                    activeDot={false}
                    connectNulls={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="regional-source-note">{note}</p>
      </div>

      <aside className="glass-card regional-ranking-panel">
        <div className="regional-ranking-header">
          <p className="regional-panel-eyebrow">Latest 2026-Q1 regional ranking</p>
          <h3>{metricMeta.label}</h3>
          <p>
            {fastestGrowth?.changePct == null
              ? 'Growth-rate comparison is not available.'
              : `Strongest proportional increase since 2025-Q1: ${fastestGrowth.name} (${fastestGrowth.changePct.toFixed(1)}%).`}
          </p>
        </div>

        <div className="regional-ranking-list">
          {ranking.map((row, index) => (
            <button
              key={row.name}
              type="button"
              onClick={() => setSelectedRegionName(row.name)}
              className={row.name === selectedRegion.name ? 'regional-ranking-row is-active' : 'regional-ranking-row'}
            >
              <span className="regional-ranking-index">{index + 1}</span>
              <span className="regional-ranking-name">{row.name}</span>
              <span className="regional-ranking-value">{formatMetricValue(metricKey, row.latestValue)}</span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  )
}
