const part1Sources = [
  'DfT EVCI9001 quarterly national charging-device statistics, January 2015 to January 2026. This supplies the national growth series and the speed-band breakdown used in Part 1.',
  'DfT EVCI0101 region and country summaries, January 2025 to January 2026. This supplies the comparable region-level section in Part 1.',
]

const widerProjectSources = [
  'DfT EVCI0102 local-authority charger counts and rates, used for borough and local adequacy work.',
  'DfT EVCI0103 parliamentary constituency charger tables, retained as a supporting geography for later exploration.',
  'DfT VEH0142 plug-in vehicle statistics, used to compare charger supply with likely local demand.',
  'Rapid charging points geodata, used for the resident-facing accessibility tool and map-based work.',
]

const methodologySteps = [
  'The national growth chart is based on quarterly public charging-device counts from DfT. The main total-device series runs from 2015-Q1 to 2026-Q1.',
  'The current 50kW+ series only becomes available later in the DfT table. Earlier rapid figures use a legacy threshold, so they are not merged directly into the newer 50kW+ line.',
  'The speed-composition section uses the most recent six quarters, where the DfT speed bands are already on the current 3-8, 8-49, 50-149 and 150+ kW classification.',
  'The regional comparison uses DfT region summaries from 2025-Q1 onward, because the release notes state that this is the period where regional aggregation becomes more reliable after the Public Charge Point Regulations 2023 open-data requirement.',
]

const limitations = [
  'These statistics describe public charging devices, not connectors. A single device may support multiple connectors and charging speeds.',
  'Counts represent devices reported operational at the start of each quarter, so short-term outages and reporting delays are not visible here.',
  'The definition change from a legacy rapid threshold to the current 50kW+ threshold means long-run fast-charging comparisons must be made carefully.',
  'Region-level comparison is informative for broad spatial inequality, but it still hides substantial variation within regions and between local authorities.',
]

const transparencyNotes = [
  'This site uses processed copies of the original DfT tables so that the browser only loads the fields required for the narrative and interactions.',
  'AI-assisted coding support was used during interface prototyping, code refactoring and debugging. Final data choices, metric definitions and wording were checked back against the source tables before publishing.',
  'The project info file submitted with the coursework should still include the final group contributions table and the final AI-use wording agreed by the team.',
]

export default function AboutMethodology() {
  return (
    <section className="about-page">
      <div className="about-shell">
        <div className="about-heading">
          <p className="about-eyebrow">Methodology</p>
          <h1>How the project was built</h1>
          <p>
            This page is the project methodology summary requested in the coursework guidance. It explains the main
            data sources, how the Part 1 indicators were constructed, the main limitations of the evidence, and the
            transparency notes that should also be reflected in the final project info file.
          </p>
        </div>

        <div className="about-grid">
          <article className="about-card">
            <h2>Research focus</h2>
            <p>
              The project asks how the UK public EV charging network has grown, how far that growth has shifted towards
              faster charging, and whether headline expansion translates into fairer local access.
            </p>
            <p>
              The structure moves from national growth, to borough-level adequacy, to a resident-facing exploration
              tool. That ordering follows the overview-to-detail approach recommended in the teaching materials.
            </p>
          </article>

          <article className="about-card">
            <h2>Part 1 data sources</h2>
            <ul>
              {part1Sources.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="about-card about-card--full">
            <h2>Method for Part 1</h2>
            <ul>
              {methodologySteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="about-card">
            <h2>Wider project data</h2>
            <ul>
              {widerProjectSources.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="about-card">
            <h2>Limitations</h2>
            <ul>
              {limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="about-card about-card--full">
            <h2>Open science and transparency</h2>
            <ul>
              {transparencyNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
