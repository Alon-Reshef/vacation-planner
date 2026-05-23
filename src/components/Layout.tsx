import { Link, NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const navItems = [
  { to: '/', icon: '🏝️', labelKey: 'home' as const },
  { to: '/hotels', icon: '🏨', labelKey: 'hotels' as const },
  { to: '/admin', icon: '⚙️', labelKey: 'admin' as const },
]

export function Layout() {
  const { state, session, logout } = useApp()
  if (!state) return null
  const titles = state.settings.pageTitles

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-28 pt-2">
      <div className="mb-2 flex items-center justify-between safe-top">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600/80">
          {state.settings.tripName}
        </p>
        {session ? (
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-teal-700 underline-offset-2 hover:underline"
          >
            Sign out ({session.displayName})
          </button>
        ) : (
          <Link to="/login" className="text-xs font-medium text-teal-700 underline-offset-2 hover:underline">
            Sign in to edit
          </Link>
        )}
      </div>

      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-teal-100/80 bg-white/90 backdrop-blur-lg safe-bottom">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {navItems.map(({ to, icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-teal-600/70 hover:text-teal-800'
                }`
              }
            >
              <span className="text-xl" aria-hidden>
                {icon}
              </span>
              <span>{titles[labelKey]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
