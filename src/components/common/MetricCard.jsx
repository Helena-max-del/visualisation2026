export default function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <p className="metric-card__label">{label}</p>
      <h3 className="metric-card__value">{value}</h3>
      {note ? <p className="metric-card__note">{note}</p> : null}
    </article>
  )
}
