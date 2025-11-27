import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Proyectos from './pages/Proyectos'
import ProyectoDetail from './pages/ProyectoDetail'
import Locations from './pages/Locations'
import LocationDetail from './pages/LocationDetail'
import Crew from './pages/Crew'
import Vendors from './pages/Vendors'
import Users from './pages/Users'
import Documents from './pages/Documents'
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
            path="/proyectos/:id/documents"
            element={
              <PrivateRoute>
                <Documents />
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
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
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

