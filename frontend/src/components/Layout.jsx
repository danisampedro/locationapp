import { useState } from 'react'
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

const PermitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 012-2z" />
  </svg>
)

const AppLogo = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const DocumentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

const VisorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const TimesheetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h5m-5 4h3" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
  </svg>
)

const menuItems = [
  { path: '/proyectos', label: 'Proyectos', icon: FolderIcon },
  { path: '/locations', label: 'Locations', icon: LocationIcon },
  { path: '/crew', label: 'Crew', icon: UsersIcon },
  { path: '/vendors', label: 'Vendors', icon: StoreIcon },
  { path: '/permits', label: 'Permits', icon: PermitIcon },
  { path: '/mapas', label: 'Mapas', icon: MapIcon },
  { path: '/visor', label: 'Visor', icon: VisorIcon },
  { path: '/calendar', label: 'Calendario', icon: CalendarIcon },
  { path: '/timesheets', label: 'Timesheets', icon: TimesheetIcon }
]

const adminMenuItems = [
  { path: '/users', label: 'Usuarios', icon: SettingsIcon },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Detectar si estamos dentro de un proyecto (pero no en la lista de proyectos)
  const isInProject = location.pathname.startsWith('/proyectos/') && location.pathname !== '/proyectos'
  const projectId = isInProject ? location.pathname.split('/')[2] : null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (solo escritorio) */}
      <aside className="hidden md:flex w-64 bg-dark-blue shadow-lg flex flex-col">
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

          {/* Menú de Documents (solo cuando estamos dentro de un proyecto) */}
          {isInProject && projectId && (
            <>
              <div className="px-6 py-2 mt-4">
                <div className="border-t border-white/10"></div>
              </div>
              <div className="px-6 py-1">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Proyecto</p>
              </div>
              <Link
                to={`/proyectos/${projectId}/documents`}
                className={`flex items-center px-6 py-3 text-white/80 hover:bg-dark-blue-light hover:text-white transition-colors ${
                  location.pathname === `/proyectos/${projectId}/documents` ? 'bg-dark-blue-light text-white border-r-4 border-accent-green' : ''
                }`}
              >
                <span className="mr-3"><DocumentsIcon /></span>
                <span className="font-medium">Documentos</span>
              </Link>
            </>
          )}
          
          {/* Separador para menú de admin */}
          {user?.role === 'admin' && (
            <>
              <div className="px-6 py-2 mt-4">
                <div className="border-t border-white/10"></div>
              </div>
              <div className="px-6 py-1">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Administración</p>
              </div>
              {adminMenuItems.map((item) => {
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
            </>
          )}
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
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header móvil */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-dark-blue text-white">
          <div className="flex items-center gap-2">
            <AppLogo />
            <span className="font-semibold">Location App</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="inline-flex items-center justify-center p-2 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Abrir menú de navegación"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-blue text-white border-b border-white/10">
            <nav className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs whitespace-nowrap ${
                      isActive ? 'bg-dark-blue-light text-white' : 'text-white/80 hover:bg-dark-blue-light hover:text-white'
                    }`}
                  >
                    <span className="mr-2"><IconComponent /></span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}

              {isInProject && projectId && (
                <Link
                  to={`/proyectos/${projectId}/documents`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs whitespace-nowrap ${
                    location.pathname === `/proyectos/${projectId}/documents`
                      ? 'bg-dark-blue-light text-white'
                      : 'text-white/80 hover:bg-dark-blue-light hover:text-white'
                  }`}
                >
                  <span className="mr-2"><DocumentsIcon /></span>
                  <span className="font-medium">Documentos</span>
                </Link>
              )}

              {user?.role === 'admin' &&
                adminMenuItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-xs whitespace-nowrap ${
                        isActive ? 'bg-dark-blue-light text-white' : 'text-white/80 hover:bg-dark-blue-light hover:text-white'
                      }`}
                    >
                      <span className="mr-2"><IconComponent /></span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
            </nav>
          </div>
        )}

        {/* Contenido principal */}
        <div className={location.pathname === '/mapas' || location.pathname === '/visor' ? 'flex-1' : 'flex-1 p-4 md:p-8'}>
          {children}
        </div>
      </main>
    </div>
  )
}

