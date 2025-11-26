import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Proyectos from './pages/Proyectos'
import Locations from './pages/Locations'
import Crew from './pages/Crew'
import Vendors from './pages/Vendors'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Proyectos />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/crew" element={<Crew />} />
          <Route path="/vendors" element={<Vendors />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

