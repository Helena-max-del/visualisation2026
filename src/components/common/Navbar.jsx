import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/part1', label: 'Growth' },
  { to: '/part2', label: 'Adequacy' },
  { to: '/part3', label: 'Tool' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-brand">
          <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '0', textTransform: 'uppercase', color: 'var(--primary)' }}>
            Civic Infrastructure
          </span>
        </div>

        <nav className="site-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

      </div>
    </header>
  )
}
