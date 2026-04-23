import { SPEED_OPTIONS } from '../shared/part3Shared.js'

export default function ServiceAreaLegend({ speedFilter, rapidPriority }) {
  return (
    <section className="part3-legend-card glass-card">
      <div className="part3-legend-header">
        <div>
          <p className="part3-control-label">How the tool scores places</p>
          <h3>Catchment logic and resident-facing interpretation</h3>
        </div>
      </div>

      <div className="part3-legend-grid">
        {SPEED_OPTIONS.map((option) => (
          <article
            key={option.id}
            className={`part3-legend-item${option.id === speedFilter ? ' is-active' : ''}`}
          >
            <strong>{option.label}</strong>
            <span>{option.radiusKm} km catchment</span>
            <p>{option.note}</p>
          </article>
        ))}
      </div>

      <div className="part3-legend-note">
        <p>
          The neighbourhood score combines four signals: the number of matching chargers inside the catchment, the
          distance to the nearest suitable charger, the availability of rapid fallback, and the diversity of nearby
          operators.
        </p>
        <p>
          The map now also draws three travel-time bands around the selected point. These 5, 10, and 15 minute rings
          expand or contract with the chosen average travel speed, helping residents read local reach more intuitively.
        </p>
        <p>
          {rapidPriority
            ? 'Rapid-priority mode increases the weight of quick-turnaround charging, which is more appropriate for residents without home charging or for taxi and delivery use cases.'
            : 'Routine mode gives more weight to nearby everyday availability, which better reflects local top-up charging and overnight dependence.'}
        </p>
        <p>
          The additional use-case filters then narrow the network by practical conditions such as public accessibility,
          round-the-clock opening, explicit bay-count metadata, and free-to-use tags.
        </p>
      </div>
    </section>
  )
}
