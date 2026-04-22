const part1Sources = [
  'DfT EVCI9001 quarterly national charging-device statistics, January 2015 to January 2026. This supplies the national growth series and the speed-band breakdown used in Part 1.',
  'DfT EVCI0101 regional and country summaries, January 2025 to January 2026. This supplies the comparable regional overview used in Part 1.',
]

const part1Method = [
  'The national growth chart is based on quarterly public charging-device counts from DfT. The main total-device series runs from 2015-Q1 to 2026-Q1.',
  'The current 50kW+ series only becomes available later in the DfT table. Earlier rapid figures use a legacy threshold, so they are not merged directly into the newer 50kW+ line.',
  'The speed-composition section uses the most recent six quarters, where the DfT speed bands are already on the current 3-8, 8-49, 50-149 and 150+ kW classification.',
  'The regional comparison uses DfT region summaries from 2025-Q1 onward, because this is the period where regional aggregation becomes more reliable after the Public Charge Point Regulations 2023 open-data requirement.',
]

const part1Limitations = [
  'These statistics describe public charging devices, not connectors. A single device may support multiple connectors and charging speeds.',
  'Counts represent devices reported operational at the start of each quarter, so short-term outages and reporting delays are not visible here.',
  'The definition change from a legacy rapid threshold to the current 50kW+ threshold means long-run fast-charging comparisons must be made carefully.',
  'Regional comparison is informative for broad spatial patterns, but it still hides substantial variation within regions and between local authorities.',
]

const part1Transparency = [
  'This site uses processed copies of the original DfT tables so that the browser only loads the fields required for the narrative and interactions.',
  'AI-assisted coding support was used during interface prototyping, code refactoring, and debugging. Final data choices, metric definitions, and wording were checked back against the source tables before publishing.',
  'The final project info file submitted with the coursework should still include the agreed group-contributions table and the final AI-use wording approved by the team.',
]

const part2Sources = [
  'DfT EVCI local-authority charging table (January 2026), providing total public charger counts and 50 kW+ rapid charger counts for each London borough, used as the core supply-side input.',
  'DfT VEH0142 plug-in vehicle statistics (2025 Q3), providing licensed plug-in vehicle stocks (BEV + PHEV) by local authority, used to quantify localised demand.',
  'ONS Census 2021 (TS045 car availability table), providing the share of no-car households per borough, used to construct the public-charging dependence proxy in the bivariate classification.',
]

const part2Method = [
  'Adequacy indicators are expressed as chargers per 1,000 locally licensed plug-in vehicles, rather than per capita, so that rankings reflect whether supply is keeping pace with local EV adoption rather than simply residential density.',
  'The same normalisation is applied separately to rapid chargers (50 kW+) to identify whether fast-charging supply follows a different spatial logic from overall provision.',
  "A rank-shift measure is computed as the absolute difference in each borough's position between the total and rapid adequacy rankings. Large shifts indicate boroughs where the composition of the network diverges structurally from its overall scale.",
  "A rapid-share metric, defined as the proportion of each borough's public chargers that are rapid, is derived to measure the speed orientation of each local network independently of its size.",
]

const part2Bivariate = [
  'The supply dimension uses total public chargers per 10,000 residents; the demand dimension uses the no-car household share as a proxy for public-charging dependence.',
  'Both variables are independently divided into terciles based on the London-wide distribution, producing a 3 x 3 matrix of nine classes.',
  'The deep purple cell (class 3-1) identifies boroughs with high demand and low supply, interpreted as the most constrained cases.',
  "The bivariate map is implemented in Mapbox GL JS, with borough boundaries loaded as GeoJSON and colours applied dynamically via a Mapbox match expression. Hover interactions expose each borough's supply tier, demand tier, and full indicator values.",
]

const part2Transparency = [
  'All indicators in this section are derived from publicly released DfT and ONS source tables. The full calculation logic is retained in the front-end codebase and can be independently verified.',
  'Data processing and indicator computation are built in React, with useMemo used to cache sorted rankings and keep the interactive views responsive.',
  'AI-assisted support was used during interface prototyping and code debugging. All final metric definitions and data selections were checked against the original source tables before publication.',
]

const part3Sources = [
  'Open Charge Map API data was used as the primary source of charger point locations and charger metadata.',
  'The dataset provides charger coordinates, operator names, charging power outputs, connector types, status fields where available, and some pricing or usage-related metadata.',
  'UK local-authority boundary data from the Office for National Statistics Open Geography Portal was used to spatially clip and filter charger locations to London, Leeds, and Birmingham.',
]

const part3Method = [
  'Charger point data was collected through the Open Charge Map API using city-based geographic queries and converted into GeoJSON format for web-based visualisation.',
  'Spatial filtering was applied using local-authority boundary geometries to isolate charging infrastructure within the three study cities.',
  'The tool methodology is built around an interactive web map designed to estimate approximate 5-, 10-, and 15-minute driving catchments based on configurable average travel speeds.',
  'Users can click on the map or search for a postcode or place name to explore nearby charging accessibility, while rapid-capable chargers can be filtered separately to compare faster-charging access patterns.',
  'The interface calculates nearby charger counts, nearest charging points, and operator distributions within the selected catchment area.',
]

const part3Features = [
  'Interactive city selection between London, Leeds, and Birmingham.',
  'Search functionality using postcode or place-name lookup.',
  'Dynamic drive-time accessibility estimation using adjustable travel speeds.',
  'Interactive catchment visualisation using multi-ring accessibility buffers.',
  'Rapid charger filtering for fast-charging accessibility analysis.',
  'Popup information panels displaying charger-level metadata such as operator, charging speed, and availability-related information.',
  'Real-time summary panels showing nearby charger density and accessibility indicators.',
]

const part3Limitations = [
  'Open Charge Map is a crowd-sourced dataset, meaning spatial coverage may vary between cities and neighbourhoods.',
  'Some charging stations may be missing or incompletely recorded, particularly in lower-contribution areas.',
  'Charger status and pricing information are not consistently available across all operators and locations.',
  'The accessibility model uses simplified straight-line distance estimation rather than full road-network routing, so travel times are approximate rather than exact driving durations.',
  'Differences in operator reporting standards may affect consistency in charging-speed classifications and metadata completeness.',
  'The tool focuses on public charging infrastructure only and does not include private residential or workplace chargers.',
]

const part3Transparency = [
  'All charger-point data used in the explorer is derived from publicly accessible Open Charge Map API services.',
  'Processed GeoJSON datasets were generated to optimise browser performance and reduce unnecessary API calls during interaction.',
  'The methodology and preprocessing workflow are designed to remain transparent and reproducible for future extension or comparison studies.',
  'The project explicitly communicates uncertainty around crowd-sourced data completeness and accessibility estimation.',
]

function BulletCard({ title, items, full = false }) {
  return (
    <article className={`about-card${full ? ' about-card--full' : ''}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  )
}

function ParagraphCard({ title, paragraphs, full = false }) {
  return (
    <article className={`about-card${full ? ' about-card--full' : ''}`}>
      <h3>{title}</h3>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  )
}

function MethodSection({ eyebrow, title, intro, children }) {
  return (
    <section className="about-section">
      <div className="about-section__header">
        <p className="about-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{intro}</p>
      </div>
      <div className="about-grid">{children}</div>
    </section>
  )
}

export default function AboutMethodology() {
  return (
    <section className="about-page">
      <div className="about-shell">
        <div className="about-heading">
          <p className="about-eyebrow">Methodology</p>
          <h1>How the project was built</h1>
          <p>
            This page is the project methodology summary requested in the coursework guidance.
            It brings together the logic, data sources, and transparency notes for the three
            main sections of the site so the narrative, indicators, and tools can be read as
            one coherent workflow.
          </p>
        </div>

        <MethodSection
          eyebrow="Part 1"
          title="How Part 1 was built"
          intro="Part 1 establishes the national and regional growth story: how quickly the UK public charging network has grown, how much of that growth has shifted towards faster charging, and how regional comparison only becomes meaningfully comparable once the DfT regional series stabilises from 2025 onward."
        >
          <ParagraphCard
            title="Research focus"
            paragraphs={[
              'The opening section asks how quickly the UK public EV charging network has expanded, how far that growth has shifted towards faster charging, and whether headline expansion begins to translate into more geographically distributed provision.',
              'The structure moves from national growth, to charging-speed composition, to a regional overview. That progression establishes the broad context before the later sections move down to borough and neighbourhood scales.',
            ]}
          />

          <BulletCard title="Part 1 data sources" items={part1Sources} />
          <BulletCard title="Method for Part 1" items={part1Method} full />
          <BulletCard title="Limitations" items={part1Limitations} />
          <BulletCard title="Open science and transparency" items={part1Transparency} />
        </MethodSection>

        <MethodSection
          eyebrow="Part 2"
          title="How Part 2 was built"
          intro="This methodology note covers the data sources used in Part 2, the construction logic behind the adequacy indicators, the technical implementation of the bivariate classification, and the main transparency notes attached to the borough-level analysis."
        >
          <ParagraphCard
            title="Research focus"
            paragraphs={[
              'Part 2 asks whether the public charging supply across London boroughs genuinely matches local electric vehicle demand. Against a backdrop of overall network expansion, the question is which boroughs, especially those whose residents depend most on public charging, still face a meaningful undersupply.',
              'The analysis moves from overall adequacy rankings, to the spatial distribution of rapid charging provision, to a bivariate mapping of supply-demand alignment. This layered structure is designed to address the central question: does growth in headline numbers translate into equitable access?',
            ]}
          />

          <BulletCard title="Part 2 data sources" items={part2Sources} />
          <BulletCard title="Method for Part 2" items={part2Method} full />
          <BulletCard title="Bivariate spatial classification" items={part2Bivariate} full />
          <BulletCard title="Open science and transparency" items={part2Transparency} />
        </MethodSection>

        <MethodSection
          eyebrow="Part 3"
          title="How Part 3 was built"
          intro="Part 3 documents the accessibility-explorer workflow prepared for the city-scale tool, covering the point-data source, spatial filtering approach, interaction design, limitations, and transparency notes for the neighbourhood-facing component."
        >
          <ParagraphCard
            title="Research focus"
            paragraphs={[
              'Part 3 was designed as a user-facing exploratory tool that allows residents to investigate the accessibility of public EV charging infrastructure in London, Leeds, and Birmingham.',
              'The section focuses on how charging availability changes across neighbourhoods, how quickly users can access nearby chargers, and whether access differs between urban areas. The interface combines interactive mapping, approximate drive-time catchments, and charger-level information to create a practical accessibility exploration experience for everyday users.',
            ]}
          />

          <BulletCard title="Part 3 data sources" items={part3Sources} />
          <BulletCard title="Method for Part 3" items={part3Method} full />
          <BulletCard title="User interaction features" items={part3Features} />
          <BulletCard title="Limitations" items={part3Limitations} />
          <BulletCard title="Open science and transparency" items={part3Transparency} full />
        </MethodSection>
      </div>
    </section>
  )
}
