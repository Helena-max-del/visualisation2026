// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const PARTS = [
  {
    number: '01',
    title: 'Growth',
    summary:
      'Tracks how the UK public charging network expanded between 2015 and 2026, how the speed mix shifted toward faster charging, and how regional distribution changed once open-data reporting became mandatory.',
    accent: 'blue',
  },
  {
    number: '02',
    title: 'Adequacy',
    summary:
      'Measures whether charger supply across London boroughs keeps pace with local EV demand. A bivariate classification cross-tabulates supply and dependence tiers to identify the most constrained areas, extended to Birmingham and Leeds at MSOA level.',
    accent: 'amber',
  },
  {
    number: '03',
    title: 'Accessibility Tool',
    summary:
      'A resident-facing explorer that estimates drive-time catchments from any postcode or location in London, Leeds, or Birmingham and summarises nearby charging provision, operator mix, and rapid-charging availability.',
    accent: 'plum',
  },
]

const TEAM = [
  { name: 'XINLEI SHI', photo: '/assets/team/xinlei-shi.jpg' },
  { name: 'PENGHE GAO', photo: '/assets/team/penghe-gao.jpg' },
  { name: 'JIAHUI LI', photo: '/assets/team/jiahui-li.jpg' },
]

const ALL_SOURCES = [
  {
    part: 'Part 1',
    name: 'DfT EVCI9001',
    description: 'Quarterly national charging-device statistics, 2015–2026. National growth series and speed-band breakdown.',
  },
  {
    part: 'Part 1',
    name: 'DfT EVCI0101',
    description: 'Regional and country summaries, 2025–2026. Comparable regional overview.',
  },
  {
    part: 'Part 2',
    name: 'DfT EVCI local-authority table',
    description: 'Total and 50 kW+ rapid charger counts per London borough, January 2026.',
  },
  {
    part: 'Part 2',
    name: 'DfT VEH0142',
    description: 'Licensed plug-in vehicle stocks (BEV + PHEV) by local authority, 2025 Q3.',
  },
  {
    part: 'Part 2',
    name: 'ONS Census 2021 (TS045)',
    description: 'Car or van availability. No-car household share per borough and MSOA.',
  },
  {
    part: 'Part 2',
    name: 'ONS Open Geography Portal',
    description: 'MSOA 2021 boundaries (BFE) for Birmingham and Leeds via ArcGIS FeatureServer.',
  },
  {
    part: 'Part 2 / Part 1',
    name: 'OpenStreetMap (Overpass)',
    description: 'Public charging-station point locations for London, Birmingham, and Leeds.',
  },
  {
    part: 'Part 3',
    name: 'Open Charge Map API',
    description: 'Charging-point locations, operator names, power outputs, connector types, and status metadata.',
  },
]

const TECH = [
  'React 18', 'Vite', 'React Router', 'Mapbox GL JS',
  'D3.js', 'CSS (vanilla)', 'Python · geopandas', 'NOMIS API', 'ONS Open Geography',
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PartCard({ number, title, summary, accent }) {
  return (
    <article className={`about-part-card about-part-card--${accent}`}>
      <span className="about-part-number">{number}</span>
      <h3>{title}</h3>
      <p>{summary}</p>
    </article>
  )
}

function TeamCard({ name, photo }) {
  return (
    <div className="about-team-card">
      <div className="about-team-avatar">
        {photo ? <img src={photo} alt={name} className="about-team-avatar-image" /> : name[0]}
      </div>
      <div>
        <strong>{name}</strong>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutMethodology() {
  return (
    <div className="about-page">
      <div className="about-shell">

        {/* ── Hero ── */}
        <header className="about-heading">
          <p className="about-eyebrow">UCL CASA · CEGE0029 Urban Visualisation · 2026</p>
          <h1>About This Project</h1>
          <p>
            <em>Am I Ready for an EV?</em> is a group data-visualisation project exploring the
            growth, spatial adequacy, and neighbourhood accessibility of the UK's public
            electric vehicle charging network. It was produced as part of the CEGE0029 module
            at the Centre for Advanced Spatial Analysis, University College London.
          </p>
        </header>

        {/* ── Three-part overview ── */}
        <section className="about-section">
          <div className="about-section__header">
            <p className="about-eyebrow">Project structure</p>
            <h2>Three interconnected questions</h2>
            <p>
              The site moves from national scale to borough scale to neighbourhood scale,
              with each part building on the previous one.
            </p>
          </div>
          <div className="about-parts-grid">
            {PARTS.map((p) => (
              <PartCard key={p.number} {...p} />
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="about-section">
          <div className="about-section__header">
            <p className="about-eyebrow">Contributors</p>
            <h2>Team</h2>
          </div>
          <div className="about-team-grid">
            {TEAM.map((m) => (
              <TeamCard key={m.name} {...m} />
            ))}
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="about-section">
          <div className="about-section__header">
            <p className="about-eyebrow">About</p>
            <h2>How the project was built</h2>
            <p>
              This section provides the full analytical methodology across all three parts of
              the site, covering data sources, indicator construction, spatial techniques, and
              transparency notes.
            </p>
          </div>

          <div className="about-method-body">
            <h3>Research framing</h3>
            <p>
              This project asks a question that sits at the intersection of infrastructure
              planning and spatial equity: does the rapid expansion of the UK's public EV
              charging network translate into equitable access for all urban residents? The
              analysis is structured in three parts, each addressing a different scale and
              type of question, together forming a sequential narrative from national growth
              to borough-level adequacy to neighbourhood-level accessibility.
            </p>

            <h3>Part 1 — National growth analysis</h3>
            <p>
              The first part establishes the macro-level context. Using quarterly
              charging-device counts released by the Department for Transport (DfT
              EVCI9001), we tracked the total number of public charging devices in operation
              from 2015 to early 2026. This series captures the doubling and re-doubling of
              network scale over a decade, but the headline count alone is insufficient: the
              compositional shift towards faster charging matters as much as total volume.
            </p>
            <p>
              To capture this, the analysis uses the DfT's current speed classification —
              grouping devices into 3–8 kW, 8–49 kW, 50–149 kW, and 150 kW+ bands — for
              the most recent six quarters, where the classification is internally consistent.
              Earlier periods used a different rapid threshold, so they are not merged
              directly into the current speed-band breakdown. Regional comparison draws on
              DfT's regional summaries from 2025-Q1 onward, where the Public Charge Point
              Regulations 2023 open-data requirement makes regional aggregation meaningfully
              comparable for the first time.
            </p>

            <h3>Part 2 — Borough-level adequacy</h3>
            <p>
              The second part moves from national trends to spatial adequacy within London.
              The central indicator is chargers per 1,000 locally licensed plug-in vehicles,
              derived from DfT's local-authority charging table (January 2026) and DfT's
              plug-in vehicle statistics (2025 Q3). Normalising supply by local EV adoption
              rather than by population ensures that rankings reflect whether supply is keeping
              pace with where EVs are actually registered, not simply where people live.
            </p>
            <p>
              The analysis separates total chargers from rapid chargers (50 kW+) because
              the spatial logic of fast-charging provision may differ from overall provision.
              A rank-shift measure — the absolute difference in each borough's position
              between the total and rapid rankings — identifies structural divergences in
              network composition. A rapid-share metric, defined as the proportion of public
              chargers rated 50 kW or above, is derived independently to measure the speed
              orientation of each local network.
            </p>
            <p>
              The central visualisation is a bivariate classification that cross-tabulates
              two independent dimensions: supply (chargers per 10,000 residents) and demand
              (no-car household share from ONS Census 2021). The no-car household share is
              used as a proxy for public-charging dependence, on the premise that households
              without a private vehicle are more likely to rely on public infrastructure for
              EV use, or to consider it a precondition for EV adoption. Both variables are
              independently divided into terciles based on the London-wide distribution,
              producing a 3×3 matrix of nine classes. Boroughs in the high-demand, low-supply
              cell (class 3-1) are identified as the most structurally constrained: high
              public dependence combined with the thinnest provision.
            </p>
            <p>
              The bivariate map is implemented in Mapbox GL JS with borough boundaries loaded
              as GeoJSON and colours applied via data-driven match expressions. The same
              classification is extended to Birmingham and Leeds using MSOA-level boundaries
              from the ONS Open Geography Portal and no-car household data from NOMIS, with
              supply estimated from OpenStreetMap charging-point geometries matched to each
              MSOA via a two-pass spatial join: strict containment first, then a nearest-MSOA
              fallback for points within approximately 400 m of a boundary.
            </p>

            <h3>Part 3 — Neighbourhood accessibility tool</h3>
            <p>
              The third part translates the borough-scale findings into a resident-facing
              exploration tool. Charging-point data was collected from the Open Charge Map
              API, converted to GeoJSON, and spatially filtered using local-authority boundary
              geometries to cover London, Leeds, and Birmingham. The tool allows users to
              select a location by postcode or place-name search and then estimates approximate
              5-, 10-, and 15-minute driving catchments based on configurable average travel
              speeds. Within each catchment, the tool calculates nearby charger counts,
              identifies the nearest charging points, and summarises operator distributions.
              A rapid-filter option allows users to compare fast-charging accessibility
              independently of overall provision.
            </p>
            <p>
              The accessibility model uses simplified straight-line buffers rather than
              full road-network routing, which means travel times are approximations rather
              than exact driving durations. This is a deliberate design choice that prioritises
              responsiveness and broad usability over routing precision: for initial
              neighbourhood-scale exploration, euclidean buffers are a reasonable
              first-order estimate of reach.
            </p>

            <h3>Limitations and transparency</h3>
            <p>
              Several limitations apply across all three parts. DfT statistics count devices,
              not connectors, so a single multi-connector unit may support several simultaneous
              users but appears as one device in the data. Regional and borough patterns
              reflect recorded public infrastructure only — workplace and residential private
              chargers are excluded throughout. The Open Charge Map dataset is crowd-sourced,
              meaning coverage varies between cities and may undercount emerging or
              less-reported areas. The no-car household proxy for demand is an approximation:
              some no-car households have no interest in EVs, and some car-owning households
              may rely heavily on public charging in areas with limited home-charging options.
            </p>
            <p>
              All source data used in this project is publicly available from DfT, ONS,
              NOMIS, the ONS Open Geography Portal, and Open Charge Map. The full indicator
              calculations are retained in the front-end codebase and can be independently
              verified. AI-assisted tools were used during interface prototyping, code
              refactoring, and debugging. All final data selections, metric definitions, and
              published wording were checked against the original source tables before
              publication. The agreed group-contributions table and final AI-use declaration
              are included in the coursework submission.
            </p>
          </div>
        </section>

        {/* ── Data sources ── */}
        <section className="about-section">
          <div className="about-section__header">
            <p className="about-eyebrow">Data</p>
            <h2>Data sources</h2>
            <p>All datasets used in this project are publicly available.</p>
          </div>
          <div className="about-sources-table">
            <div className="about-sources-head">
              <span>Part</span>
              <span>Dataset</span>
              <span>Used for</span>
            </div>
            {ALL_SOURCES.map((s) => (
              <div className="about-sources-row" key={s.name}>
                <span className="about-sources-part">{s.part}</span>
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech stack ── */}
        <section className="about-section">
          <div className="about-section__header">
            <p className="about-eyebrow">Stack</p>
            <h2>Tools &amp; technologies</h2>
          </div>
          <div className="about-tech-chips">
            {TECH.map((t) => (
              <span key={t} className="about-tech-chip">{t}</span>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
