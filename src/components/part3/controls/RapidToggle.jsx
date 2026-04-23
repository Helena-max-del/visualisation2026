export default function RapidToggle({ rapidPriority, onChange }) {
  return (
    <section className="part3-control-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">Driver profile</p>
        <h3>Tell the tool how urgent fast charging is</h3>
        <p>
          Turning this on shifts the neighbourhood score toward rapid and ultra-rapid fallback, which better reflects
          drivers without home charging.
        </p>
      </div>

      <button
        type="button"
        className={`part3-toggle${rapidPriority ? ' is-active' : ''}`}
        onClick={() => onChange(!rapidPriority)}
        aria-pressed={rapidPriority}
      >
        <span className="part3-toggle__track">
          <span className="part3-toggle__thumb" />
        </span>
        <span className="part3-toggle__copy">
          <strong>{rapidPriority ? 'Rapid need prioritised' : 'Routine charging mode'}</strong>
          <span>
            {rapidPriority
              ? 'Score weighting emphasises quick-turnaround charging within a wider catchment.'
              : 'Score weighting emphasises neighbourhood availability and close-to-home access.'}
          </span>
        </span>
      </button>
    </section>
  )
}
