export default function Part3Notes() {
  return (
    <section className="part3-notes glass-card">
      <div className="part3-notes-copy">
        <p className="part3-control-label">About</p>
        <h3>Interaction design and user experience logic</h3>
        <p>
          Part 3 transforms the analytical findings into an interactive public-facing exploration tool focused on
          everyday EV charging accessibility. Rather than presenting static maps, the interface encourages users to
          actively test how charging access changes across neighbourhoods, travel assumptions, and charging
          preferences.
        </p>
        <p>
          The interaction flow is designed around exploratory decision-making. Users can switch between cities, search
          for locations, adjust assumed travel speed, prioritise rapid charging access, and instantly compare
          accessibility conditions through dynamically updated catchment zones and charging summaries. The interface
          translates complex spatial relationships into intuitive feedback, allowing users to quickly understand whether
          a location appears well-served or under-provided in terms of charging infrastructure.
        </p>
        <p>
          To support accessibility for non-specialist audiences, the design prioritises clarity and progressive
          disclosure. Key indicators such as nearby charger availability, rapid-charging access, provider diversity,
          and local station conditions are surfaced through a simplified dashboard interface, while richer metadata
          remains available through map interaction and detailed inspection panels. This allows the tool to function
          both as an exploratory urban interface and as a practical neighbourhood-level charging accessibility
          assistant.
        </p>
      </div>
    </section>
  )
}
