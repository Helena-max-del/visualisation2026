import { TRAVEL_SPEED_OPTIONS, TIME_BAND_OPTIONS, getTravelBandRadiusKm } from '../shared/part3Shared.js'

function formatRadius(radiusKm) {
  return `${radiusKm.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} km in ${TIME_BAND_OPTIONS[TIME_BAND_OPTIONS.length - 1].minutes} min`
}

export default function TravelSpeedSelector({ activeSpeed, onChange }) {
  return (
    <section className="part3-control-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">Travel speed</p>
        <h3>Scale the three reach rings by average urban movement</h3>
        <p>The outer circle always shows a 15-minute reach, while the inner two show 5 and 10 minutes.</p>
      </div>

      <div className="part3-travel-row">
        {TRAVEL_SPEED_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`part3-travel-chip${option.id === activeSpeed ? ' is-active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{formatRadius(getTravelBandRadiusKm(15, option.kmPerHour))}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
