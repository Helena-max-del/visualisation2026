const cityCards = [
  {
    name: 'London',
    label: 'Capital-scale benchmark',
    description:
      'London works as the benchmark case: the largest and most mature network in the set, useful for showing how provision concentrates around dense centres, orbital routes, and borough hubs when investment is relatively deep.',
  },
  {
    name: 'Birmingham',
    label: 'Strategic crossroads case',
    description:
      'Birmingham matters because it tests a different metropolitan logic, where charging provision is shaped less by central density alone and more by dispersed urban form, strategic roads, and regional through-movement.',
  },
  {
    name: 'Leeds',
    label: 'Regional-scale contrast',
    description:
      'Leeds gives the comparison a meaningful regional contrast: a substantial but smaller northern city where the map can show whether growth still produces visible coverage and clustering without the scale of London or Birmingham.',
  },
]

export default function CityFocusBridge() {
  return (
    <section className="part1-city-bridge glass-card">
      <div className="part1-city-bridge-head">
        <div>
          <p className="eyebrow">Why these cities</p>
          <h2 className="part1-city-bridge-title">Why reading these three cities together is meaningful</h2>
        </div>
        <p className="part1-city-bridge-copy">
          The national and regional summaries show how much the network has grown, but they cannot show how that growth
          is actually organised on the ground. London, Birmingham, and Leeds are used together because they bracket
          three distinct urban conditions: a capital-scale benchmark, a strategic inland crossroads, and a regional
          metropolitan contrast. Reading them side by side makes the city maps analytically useful rather than just
          illustrative.
        </p>
      </div>

      <div className="part1-city-bridge-grid">
        {cityCards.map((city) => (
          <article key={city.name} className="part1-city-bridge-card">
            <p className="part1-city-bridge-label">{city.label}</p>
            <h3>{city.name}</h3>
            <p>{city.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
