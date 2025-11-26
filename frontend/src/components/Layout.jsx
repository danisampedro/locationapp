import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Iconos SVG monocromos modernos
const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const StoreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const AppLogo = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

const menuItems = [
  { path: '/proyectos', label: 'Proyectos', icon: FolderIcon },
  { path: '/locations', label: 'Locations', icon: LocationIcon },
  { path: '/crew', label: 'Crew', icon: UsersIcon },
  { path: '/vendors', label: 'Vendors', icon: StoreIcon },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-blue shadow-lg flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <AppLogo />
            <h1 className="text-2xl font-bold text-white">Location App</h1>
          </div>
        </div>
        <nav className="mt-4 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const IconComponent = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-white/80 hover:bg-dark-blue-light hover:text-white transition-colors ${
                  isActive ? 'bg-dark-blue-light text-white border-r-4 border-accent-green' : ''
                }`}
              >
                <span className="mr-3"><IconComponent /></span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        {/* Usuario / Logout */}
        <div className="p-6 border-t border-white/10 text-white/80">
          {user && (
            <div className="flex flex-col gap-2">
              <div className="text-sm">
                <p className="font-semibold text-white">{user.username}</p>
                <p className="text-xs text-white/70 uppercase tracking-wide">
                  {user.role === 'admin' ? 'ADMIN' : 'USUARIO'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

