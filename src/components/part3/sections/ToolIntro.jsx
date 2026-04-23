import SectionHeader from '../../common/SectionHeader.jsx'

export default function ToolIntro({ activeCity, citySummary }) {
  return (
    <section className="part3-hero">
      <SectionHeader
        eyebrow="Part 3 | Neighbourhood tool"
        title="Neighbourhood charging access tool"
        description="This resident-facing interface translates the earlier city- and borough-scale findings into a local screening tool. Users can switch cities, search known charging locations, or click directly on the map to estimate how well a neighbourhood is served."
      />

      <div className="part3-hero-grid">
        <article className="part3-hero-card glass-card">
          <p className="part3-hero-card__label">Active city</p>
          <h3>{activeCity?.label || 'Loading city'}</h3>
          <p>{citySummary?.description || 'Loading city context.'}</p>
        </article>

        <article className="part3-hero-card glass-card">
          <p className="part3-hero-card__label">Mapped chargers</p>
          <h3>{Number(citySummary?.stationCount || 0).toLocaleString()}</h3>
          <p>Current Open Charge Map entries available for this exploratory interface.</p>
        </article>

        <article className="part3-hero-card glass-card">
          <p className="part3-hero-card__label">Rapid share</p>
          <h3>{citySummary?.rapidShareLabel || '0%'}</h3>
          <p>{citySummary?.rapidNote || 'Rapid and ultra-rapid availability is summarised for the active city.'}</p>
        </article>
      </div>
    </section>
  )
}
