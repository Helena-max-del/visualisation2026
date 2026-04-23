export default function CitySelector({ cities = [], activeCityId, onChange }) {
  return (
    <section className="part3-control-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">City</p>
        <h3>Switch the urban context</h3>
        <p>Use the same interface to compare how local access feels in different city environments.</p>
      </div>

      <div className="part3-chip-grid">
        {cities.map((city) => (
          <button
            key={city.id}
            type="button"
            className={`part3-chip${city.id === activeCityId ? ' is-active' : ''}`}
            onClick={() => onChange(city.id)}
          >
            <span className="part3-chip__title">{city.label}</span>
            <span className="part3-chip__meta">{city.stationCountLabel}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
