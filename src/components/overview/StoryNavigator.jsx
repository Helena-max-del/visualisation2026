import { Link } from 'react-router-dom'

export default function StoryNavigator() {
  return (
    <section className="content-section card-grid">
      <Link className="story-card" to="/part1">
        <h3>Part 1</h3>
        <p>Growth of the public charging network over time.</p>
      </Link>
      <Link className="story-card" to="/part2">
        <h3>Part 2</h3>
        <p>Spatial adequacy and mismatch between provision and likely demand.</p>
      </Link>
      <Link className="story-card" to="/part3">
        <h3>Part 3</h3>
        <p>Neighbourhood tool for resident-facing exploration.</p>
      </Link>
    </section>
  )
}
