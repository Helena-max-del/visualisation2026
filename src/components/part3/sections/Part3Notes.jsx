export default function Part3Notes() {
  return (
    <section className="part3-notes glass-card">
      <div className="part3-notes-copy">
        <p className="part3-control-label">Method note</p>
        <h3>Interaction design, stack, and UI logic</h3>
        <p>
          Part 3 reframes the earlier analytical findings as a resident-facing exploratory tool. The interface is built
          in React and styled to match the editorial glass-card language used across Parts 1 and 2, so the user moves
          from narrative explanation to direct local interrogation without a visual break. Mapbox GL JS powers the
          clickable city map, clustered charging points, and the service-area ring that updates with each speed mode.
          The current tool now reads directly from Open Charge Map extracts prepared in the Part 3 data folder, which
          means the interface can use richer metadata than the earlier placeholder layer: site status, usage cost,
          bay-count information, access mode, and connector records. Search remains intentionally lightweight: rather
          than relying on a full postcode geocoder, the tool searches station names, postcodes, town names, status
          text, and connector hints already present in the dataset, while the map click offers a more flexible way to
          inspect any neighbourhood.
        </p>
        <p>
          The UI/UX logic is designed around progressive disclosure. The top controls let users define city context,
          charging-speed preference, whether rapid access should be prioritised, and additional practical filters such
          as public access, 24/7 opening, known bay count, and free-to-use status. The map then acts as the main
          exploration surface, and the right-hand result panel translates spatial relationships into clear community
          feedback: access score, nearest suitable charger, rapid fallback, provider diversity, detailed station
          conditions, and local metadata-coverage indicators. This keeps the interaction legible for non-specialist
          users while remaining transparent about how each judgement is made.
        </p>
      </div>
    </section>
  )
}
