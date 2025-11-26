import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Onboarding from './components/Onboarding'
import Proyectos from './pages/Proyectos'
import ProyectoDetail from './pages/ProyectoDetail'
import Locations from './pages/Locations'
import LocationDetail from './pages/LocationDetail'
import Crew from './pages/Crew'
import Vendors from './pages/Vendors'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando sesión…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true)

  useEffect(() => {
    // Verificar si el usuario ya ha visto el onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (hasSeenOnboarding === 'true') {
      setShowOnboarding(false)
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Proyectos />
              </PrivateRoute>
            }
          />
          <Route
            path="/proyectos"
            element={
              <PrivateRoute>
                <Proyectos />
              </PrivateRoute>
            }
          />
          <Route
            path="/proyectos/:id"
            element={
              <PrivateRoute>
                <ProyectoDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <PrivateRoute>
                <Locations />
              </PrivateRoute>
            }
          />
          <Route
            path="/locations/:id"
            element={
              <PrivateRoute>
                <LocationDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/crew"
            element={
              <PrivateRoute>
                <Crew />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <PrivateRoute>
                <Vendors />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

