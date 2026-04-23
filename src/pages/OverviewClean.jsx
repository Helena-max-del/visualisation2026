import { Link } from 'react-router-dom'
import ParticleEVHero from '../components/common/ParticleEVHero'

const sectionCards = [
  {
    number: '01',
    title: 'Part 1 | Growth',
    description:
      'Track how the UK public charging network has expanded over time and how the speed mix has changed.',
    image: '/assets/part1/policy-2024.png',
    to: '/part1',
  },
  {
    number: '02',
    title: 'Part 2 | Adequacy',
    description:
      'Compare charger supply with likely local dependence on public infrastructure at borough and city scale.',
    image: '/assets/part1/policy-2022.png',
    to: '/part2',
  },
  {
    number: '03',
    title: 'Part 3 | Tool',
    description:
      'Translate the findings into a resident-facing interface for checking local charging accessibility.',
    image: '/assets/part1/policy-2019.png',
    to: '/part3',
  },
]

export default function OverviewClean() {
  const jumpToStructure = () => {
    document.getElementById('overview-nav-start')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="overview-page">
      <section className="overview-intro-hero">
        <ParticleEVHero theme="light" />
        <div className="overview-intro-overlay" />

        <div className="overview-intro-content">
          <p className="overview-intro-eyebrow">Civic Infrastructure | UK EV Data Story</p>
          <h1 className="overview-intro-title">
            Charging the
            <br />
            Transition<span>.</span>
          </h1>
          <p className="overview-intro-copy">
            A visual exploration of how the UK public EV charging network has expanded over time, how charging speeds
            are changing, and how national growth connects to local accessibility.
          </p>
          <button type="button" className="overview-intro-button" onClick={jumpToStructure}>
            Explore the structure
          </button>
        </div>
      </section>

      <section className="overview-hero-panel" id="overview-nav-start">
        <div className="overview-hero-inner">
          <p className="overview-hero-eyebrow">Interface guide</p>
          <h2 className="overview-hero-title">How the dashboard is organised</h2>
          <p className="overview-hero-subtitle">
            From growth to adequacy to a resident-facing explorer, the story moves from national change to local use.
          </p>

          <div className="overview-card-grid">
            {sectionCards.map((card) => (
              <Link key={card.number} to={card.to} className="overview-card-link">
                <article className="overview-card">
                  <div className="overview-card-badge">{card.number}</div>
                  <div className="overview-card-image-shell">
                    <img src={card.image} alt={card.title} className="overview-card-image" />
                  </div>
                  <div className="overview-card-body">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
