import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const metricOptions = [
  {
    key: 'totalPer100k',
    label: 'Devices per 100k',
    summary: 'Normalised comparison across differently sized regions.',
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

const linePalette = ['#4f7af2', '#d18b2f', '#3f8c5a', '#c0567a', '#7a85a0']

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

  if (!hasData || !selectedRegion) return null

  return (
    <section className="regional-explorer">
      <div className="glass-card regional-explorer-main">
        <div className="regional-explorer-header">
          <p className="eyebrow">Regional comparison</p>
          <h2 className="regional-explorer-title">Region-level inequality only becomes comparable from 2025</h2>
          <p className="regional-explorer-copy">
            The DfT region tables begin in 2025-Q1, so this section uses the latest five comparable quarters to show
            where the network is largest, where faster charging is densest, and how the picture changes once population
            is taken into account.
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 14, right: 18, left: 4, bottom: 6 }}>
              <CartesianGrid stroke="rgba(35,38,45,0.08)" vertical={false} strokeDasharray="4 6" />
              <XAxis
                dataKey="quarter"
                tick={{ fill: 'rgba(35,38,45,0.60)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                tickFormatter={(value) => formatAxisValue(metricKey, value)}
                tick={{ fill: 'rgba(35,38,45,0.60)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(248, 245, 239, 0.98)',
                  border: '1px solid rgba(35,38,45,0.10)',
                  borderRadius: '8px',
                  color: '#23262d',
                }}
                formatter={(value, name) => [formatMetricValue(metricKey, value), name]}
              />

              {comparisonRegions.map((region, index) => (
                <Line
                  key={region.name}
                  type="monotone"
                  dataKey={region.name}
                  stroke={linePalette[index % linePalette.length]}
                  strokeWidth={region.name === selectedRegion.name ? 4 : 2.5}
                  dot={{ r: region.name === selectedRegion.name ? 4 : 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="regional-source-note">{note}</p>
      </div>

      <aside className="glass-card regional-ranking-panel">
        <div className="regional-ranking-header">
          <p className="regional-panel-eyebrow">Latest 2026-Q1 ranking</p>
          <h3>{metricMeta.label}</h3>
          <p>
            {fastestGrowth?.changePct == null
              ? 'Growth-rate comparison is not available.'
              : `Fastest proportional growth since 2025-Q1: ${fastestGrowth.name} (${fastestGrowth.changePct.toFixed(1)}%).`}
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
