import MetricCard from '../common/MetricCard.jsx'

export default function AdequacySummaryCards() {
  return (
    <section className="metric-grid">
      <MetricCard label="Median total adequacy" value="39.9" note="Placeholder value" />
      <MetricCard label="Median rapid adequacy" value="3.3" note="Placeholder value" />
      <MetricCard label="Strongest total provision" value="Tower Hamlets" note="Placeholder text" />
    </section>
  )
}
