import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    logo: null,
    locations: [],
    crew: [],
    vendors: []
  })
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCrew, setAvailableCrew] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])

  useEffect(() => {
    loadProyectos()
    loadAvailableData()
  }, [])

  const loadProyectos = async () => {
    try {
      const response = await axios.get(`${API_URL}/proyectos`)
      setProyectos(response.data)
    } catch (error) {
      console.error('Error cargando proyectos:', error)
    }
  }

  const loadAvailableData = async () => {
    try {
      const [locationsRes, crewRes, vendorsRes] = await Promise.all([
        axios.get(`${API_URL}/locations`),
        axios.get(`${API_URL}/crew`),
        axios.get(`${API_URL}/vendors`)
      ])
      setAvailableLocations(locationsRes.data)
      setAvailableCrew(crewRes.data)
      setAvailableVendors(vendorsRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('handleSubmit llamado', formData)
    
    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('descripcion', formData.descripcion)
      if (formData.logo) {
        data.append('logo', formData.logo)
      }
      data.append('locations', JSON.stringify(formData.locations))
      data.append('crew', JSON.stringify(formData.crew))
      data.append('vendors', JSON.stringify(formData.vendors))

      console.log('Enviando petición a:', `${API_URL}/proyectos`)
      
      const response = await axios.post(`${API_URL}/proyectos`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 segundos
      })
      
      console.log('Respuesta recibida:', response)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      
      if (response.status === 201 || response.status === 200) {
        console.log('Proyecto creado exitosamente:', response.data)
        setShowModal(false)
        setFormData({ nombre: '', descripcion: '', logo: null, locations: [], crew: [], vendors: [] })
        await loadProyectos()
        console.log('Proyectos recargados')
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (error) {
      console.error('Error creando proyecto:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el proyecto'
      alert(`Error: ${errorMessage}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Proyectos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos.map((proyecto) => (
          <div key={proyecto.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {proyecto.logoUrl && (
              <img
                src={proyecto.logoUrl}
                alt={proyecto.nombre}
                className="w-20 h-20 object-cover rounded-lg mb-4"
              />
            )}
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{proyecto.nombre}</h2>
            <p className="text-gray-600 mb-4">{proyecto.descripcion}</p>
            <div className="text-sm text-gray-500">
              <p>Locations: {proyecto.Locations?.length || 0}</p>
              <p>Crew: {proyecto.Crews?.length || 0}</p>
              <p>Vendors: {proyecto.Vendors?.length || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nuevo Proyecto</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files[0] })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Locations</label>
                <select
                  multiple
                  value={formData.locations}
                  onChange={(e) => setFormData({
                    ...formData,
                    locations: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {availableLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Crew</label>
                <select
                  multiple
                  value={formData.crew}
                  onChange={(e) => setFormData({
                    ...formData,
                    crew: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {availableCrew.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Vendors</label>
                <select
                  multiple
                  value={formData.vendors}
                  onChange={(e) => setFormData({
                    ...formData,
                    vendors: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {availableVendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  onClick={(e) => {
                    console.log('Botón Crear clickeado')
                    e.preventDefault()
                    handleSubmit(e)
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

