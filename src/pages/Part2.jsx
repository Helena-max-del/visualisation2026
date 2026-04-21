import AdequacySummaryCards from '../components/part2/AdequacySummaryCards.jsx'
import BoroughRankChart from '../components/part2/BoroughRankChart.jsx'
import RapidAdequacyChart from '../components/part2/RapidAdequacyChart.jsx'
import AdequacyDiagnostics from '../components/part2/AdequacyDiagnostics.jsx'
import CityContextPanel from '../components/part2/CityContextPanel.jsx'
import AdequacyMap from '../components/part2/AdequacyMap.jsx'
import Part2Notes from '../components/part2/Part2Notes.jsx'
import '../styles/part2.css'

export default function Part2() {
  return (
    <div className="part2-page">
      <section className="part2-shell">
        <div className="part2-wrap">
          {/* Page heading mirrors part1-page-heading pattern */}
          <div className="part2-page-heading">
            <p className="eyebrow">Part 2 / Spatial adequacy</p>
            <h1 className="part2-page-title">
              Is charging provision distributed where it is most needed?
            </h1>
            <p className="part2-page-subtitle">
              Headline growth in the national network does not guarantee that provision is
              spatially matched to places where residents are most likely to depend on public
              charging. This section examines borough-level adequacy across London, comparing
              charger supply against local plug-in vehicle stock and household car ownership.
            </p>
          </div>

          <AdequacySummaryCards />

          <div className="part2-intro-grid">
            <div>
              <p className="eyebrow">Why this matters</p>
              <h2 className="part2-section-heading">
                Growth does not equal readiness
              </h2>
            </div>
            <div className="part2-intro-copy">
              <p>
                The two ranking charts below show each London borough scored on{' '}
                <strong>total chargers per 1,000 plug-in vehicles</strong> and{' '}
                <strong>rapid chargers per 1,000 plug-in vehicles</strong>. A borough can
                rank highly on one measure while falling significantly lower on the other, so
                comparing both dimensions is essential to understanding the full picture.
              </p>
              <p>
                The map then overlays a bivariate classification that combines{' '}
                <strong>supply</strong> (charger provision) with <strong>demand</strong>{' '}
                (proportion of no-car households, as a proxy for public-charging dependence),
                revealing which boroughs face the sharpest mismatch.
              </p>
            </div>
          </div>

          <div className="part2-charts-row">
            <div className="glass-card part2-chart-panel">
              <BoroughRankChart />
            </div>
            <div className="glass-card part2-chart-panel">
              <RapidAdequacyChart />
            </div>
          </div>

          <AdequacyDiagnostics />

          <CityContextPanel />

          <div className="glass-card part2-map-wrap">
            <AdequacyMap />
          </div>

          <Part2Notes />
        </div>
      </section>
    </div>
  )
}
