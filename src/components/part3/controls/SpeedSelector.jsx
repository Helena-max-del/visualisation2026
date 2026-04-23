import { SPEED_OPTIONS } from '../shared/part3Shared.js'

export default function SpeedSelector({ activeSpeed, onChange }) {
  return (
    <section className="part3-control-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">Speed filter</p>
        <h3>Choose the type of access you want to inspect</h3>
        <p>The tool updates both the visible stations and the distance threshold used in the local assessment.</p>
      </div>

      <div className="part3-speed-list">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`part3-speed-option${option.id === activeSpeed ? ' is-active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className="part3-speed-option__title">{option.label}</span>
            <span className="part3-speed-option__meta">{option.note}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
