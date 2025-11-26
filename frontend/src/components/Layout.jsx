import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/proyectos', label: 'Proyectos', icon: '📁' },
  { path: '/locations', label: 'Locations', icon: '📍' },
  { path: '/crew', label: 'Crew', icon: '👥' },
  { path: '/vendors', label: 'Vendors', icon: '🏪' },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Location App</h1>
        </div>
        <nav className="mt-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
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

