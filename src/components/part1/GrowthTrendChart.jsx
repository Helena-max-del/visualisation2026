import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function compactNumber(value) {
  const num = Number(value || 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`
  return num.toLocaleString()
}

export default function GrowthTrendChart({ data = [], activeQuarter = null }) {
  if (!data.length) return null

  const normalized = data.map((d) => ({
    quarter: d.quarter,
    total_devices: Number(d.total_devices || 0),
    devices_50kw_plus: d.devices_50kw_plus == null ? null : Number(d.devices_50kw_plus),
    yoy_growth_pct: d.yoy_growth_pct != null && d.yoy_growth_pct !== '' ? Number(d.yoy_growth_pct) : null,
  }))

  const activeIndex = activeQuarter ? normalized.findIndex((d) => d.quarter === activeQuarter) : -1

  const chartData = normalized.map((d, i) => ({
    ...d,
    activeMarkerTotal: i === activeIndex ? d.total_devices : null,
    activeMarkerFast: i === activeIndex ? d.devices_50kw_plus : null,
  }))

  return (
    <div className="part1-growth-chart">
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 16, right: 22, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="rgba(35,38,45,0.08)" vertical={false} strokeDasharray="4 6" />

          <XAxis
            dataKey="quarter"
            tickFormatter={(value) => (value.endsWith('Q1') ? value.split('-')[0] : '')}
            tick={{ fill: 'rgba(35,38,45,0.62)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={20}
          />

          <YAxis
            yAxisId="left"
            tickFormatter={compactNumber}
            tick={{ fill: 'rgba(35,38,45,0.62)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'rgba(35,38,45,0.62)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />

          {activeIndex >= 0 && (
            <ReferenceArea
              yAxisId="left"
              x1={chartData[activeIndex]?.quarter}
              x2={chartData[activeIndex]?.quarter}
              strokeOpacity={0}
              fill="rgba(79,122,242,0.09)"
            />
          )}

          <Tooltip
            contentStyle={{
              background: 'rgba(248, 245, 239, 0.98)',
              border: '1px solid rgba(35,38,45,0.10)',
              borderRadius: '8px',
              color: '#23262d',
            }}
            labelStyle={{ color: '#23262d', fontWeight: 700 }}
            formatter={(value, name) => {
              if (value == null || value === '') return ['n/a', name]
              if (name === 'YoY growth of total devices') return [`${Number(value).toFixed(1)}%`, name]
              return [Number(value).toLocaleString(), name]
            }}
          />

          <Legend wrapperStyle={{ color: 'rgba(35,38,45,0.75)', paddingTop: 14, fontSize: 13 }} />

          <Bar
            yAxisId="right"
            dataKey="yoy_growth_pct"
            name="YoY growth of total devices"
            fill="rgba(122,133,160,0.30)"
            radius={[8, 8, 0, 0]}
            barSize={28}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="total_devices"
            name="Total devices"
            stroke="#d18b2f"
            strokeWidth={3}
            dot={{ r: 3.5, fill: '#d18b2f', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="devices_50kw_plus"
            name="50kW+ devices (from 2023-Q4)"
            stroke="#4f7af2"
            strokeWidth={3}
            dot={{ r: 3.5, fill: '#4f7af2', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />

          {activeIndex >= 0 && (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="activeMarkerTotal"
                stroke="transparent"
                dot={{
                  r: 7,
                  fill: '#d18b2f',
                  stroke: 'rgba(209,139,47,0.18)',
                  strokeWidth: 8,
                }}
                activeDot={false}
                legendType="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="activeMarkerFast"
                stroke="transparent"
                dot={{
                  r: 7,
                  fill: '#4f7af2',
                  stroke: 'rgba(79,122,242,0.18)',
                  strokeWidth: 8,
                }}
                activeDot={false}
                legendType="none"
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
