import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://locationapp-backend.onrender.com/api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    tipo: '',
    notas: ''
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`)
      setVendors(response.data)
    } catch (error) {
      console.error('Error cargando vendors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('handleSubmit llamado', formData)
    
    try {
      console.log('Enviando petición a:', `${API_URL}/vendors`)
      const response = await axios.post(`${API_URL}/vendors`, formData, {
        timeout: 30000
      })
      console.log('Respuesta recibida:', response)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      
      if (response.status === 201 || response.status === 200) {
        console.log('Vendor creado exitosamente:', response.data)
        setShowModal(false)
        setFormData({ nombre: '', contacto: '', email: '', telefono: '', tipo: '', notas: '' })
        await loadVendors()
        console.log('Vendors recargados')
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (error) {
      console.error('Error creando vendor:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el vendor'
      alert(`Error: ${errorMessage}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
        >
          + Nuevo Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <div 
            key={vendor.id} 
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-2xl transition-shadow border border-gray-100 hover:border-accent-green/40"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2 truncate">{vendor.nombre}</h2>
            {vendor.tipo && (
              <p className="text-xs text-gray-600 mb-1">
                <span className="font-semibold text-gray-800">Tipo: </span>
                {vendor.tipo}
              </p>
            )}
            {vendor.contacto && (
              <p className="text-xs text-gray-600 mb-1 truncate">
                <span className="font-semibold text-gray-800">Contacto: </span>
                {vendor.contacto}
              </p>
            )}
            {vendor.email && (
              <p className="text-xs text-gray-600 mb-1 truncate">
                <span className="font-semibold text-gray-800">Email: </span>
                {vendor.email}
              </p>
            )}
            {vendor.telefono && (
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-semibold text-gray-800">Teléfono: </span>
                {vendor.telefono}
              </p>
            )}
            {vendor.notas && (
              <p className="text-xs text-gray-500 line-clamp-2">{vendor.notas}</p>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Nuevo Vendor</h2>
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
                <label className="block text-gray-700 mb-2">Tipo</label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: Catering, Transporte, Equipamiento..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
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

