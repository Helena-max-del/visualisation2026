import AdequacyIntro from '../components/part2/AdequacyIntro.jsx'
import AdequacySummaryCards from '../components/part2/AdequacySummaryCards.jsx'
import BoroughRankChart from '../components/part2/BoroughRankChart.jsx'
import RapidAdequacyChart from '../components/part2/RapidAdequacyChart.jsx'
import AdequacyMap from '../components/part2/AdequacyMap.jsx'
import Part2Notes from '../components/part2/Part2Notes.jsx'

export default function Part2() {
  return (
    <>
      <AdequacyIntro />
      <AdequacySummaryCards />
      <section className="chart-grid">
        <BoroughRankChart />
        <RapidAdequacyChart />
      </section>
      <section className="chart-grid">
        <AdequacyMap />
      </section>
      <Part2Notes />
    </>
  )
}
