const FILTER_OPTIONS = [
  {
    id: 'publicOnly',
    title: 'Public access first',
    description: 'Hide sites explicitly marked as private and prioritise generally accessible charging.',
  },
  {
    id: 'alwaysOpenOnly',
    title: '24/7 only',
    description: 'Keep only stations with round-the-clock opening information in the source data.',
  },
  {
    id: 'knownCapacityOnly',
    title: 'Known bay count',
    description: 'Prioritise stations where the dataset reports an explicit capacity or point count.',
  },
  {
    id: 'freeOnly',
    title: 'Free to use',
    description: 'Surface sites tagged as free, useful for cost-sensitive local exploration.',
  },
]

export default function PreferenceFilters({ preferences, onToggle }) {
  return (
    <section className="part3-control-card part3-preference-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">Use-case filters</p>
        <h3>Refine the network by everyday conditions</h3>
        <p>
          These switches help residents move beyond raw proximity and focus on the kinds of stations they could
          plausibly rely on in practice.
        </p>
      </div>

      <div className="part3-preference-grid">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`part3-preference-toggle${preferences[option.id] ? ' is-active' : ''}`}
            onClick={() => onToggle(option.id)}
            aria-pressed={preferences[option.id]}
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
