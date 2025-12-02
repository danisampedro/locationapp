import { useState, useEffect } from 'react'
import axios, { API_URL } from '../config/axios.js'

const VENDOR_CATEGORIES = [
  'Rentals',
  'Purchases',
  'Cleaning',
  'Security',
  'Water',
  'Labourers'
]

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    contacto: '',
    telefonoFijo: '',
    telefonoMovil: '',
    email: '',
    tipo: '',
    notas: '',
    logoFile: null
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`, { withCredentials: true })
      setVendors(response.data)
    } catch (error) {
      console.error('Error cargando vendors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('cif', formData.cif)
      data.append('direccion', formData.direccion)
      data.append('contacto', formData.contacto)
      data.append('telefonoFijo', formData.telefonoFijo)
      data.append('telefonoMovil', formData.telefonoMovil)
      data.append('email', formData.email)
      data.append('tipo', formData.tipo)
      data.append('notas', formData.notas)
      if (formData.logoFile) {
        data.append('logo', formData.logoFile)
      }

      const response = await axios.post(`${API_URL}/vendors`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
        withCredentials: true
      })

      if (response.status === 201 || response.status === 200) {
        setShowModal(false)
        setFormData({
          nombre: '',
          cif: '',
          direccion: '',
          contacto: '',
          telefonoFijo: '',
          telefonoMovil: '',
          email: '',
          tipo: '',
          notas: '',
          logoFile: null
        })
        await loadVendors()
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (error) {
      console.error('Error creando vendor:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el vendor'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredVendors = vendors.filter((v) =>
    selectedCategory === 'all' ? true : v.tipo === selectedCategory
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
          <p className="text-gray-500 text-sm mt-1">
            Base de datos de proveedores y empresas de servicio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm text-gray-700"
          >
            <option value="all">Todas las categorías</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors text-sm"
          >
            Nuevo vendor
          </button>
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          No hay vendors en esta categoría. Crea un nuevo registro para empezar.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-xl shadow-md px-5 py-4 border border-gray-100 hover:border-accent-green/50 hover:shadow-lg transition"
            >
              <div className="flex items-start gap-4">
                {vendor.logoUrl && (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={vendor.logoUrl}
                      alt={vendor.nombre}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {vendor.nombre}
                      </h2>
                      {vendor.cif && (
                        <p className="text-xs text-gray-500">CIF: {vendor.cif}</p>
                      )}
                    </div>
                    {vendor.tipo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {vendor.tipo}
                      </span>
                    )}
                  </div>
                  {vendor.direccion && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold text-gray-700">Dirección: </span>
                      {vendor.direccion}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 mt-2">
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Contacto</p>
                      <p>{vendor.contacto || <span className="text-gray-300">—</span>}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">
                        Teléfono fijo
                      </p>
                      <p>
                        {vendor.telefonoFijo || vendor.telefono || (
                          <span className="text-gray-300">—</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">
                        Teléfono móvil
                      </p>
                      <p>
                        {vendor.telefonoMovil || <span className="text-gray-300">—</span>}
                      </p>
                    </div>
                  </div>
                  {vendor.email && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-semibold text-gray-700">Correo: </span>
                      {vendor.email}
                    </p>
                  )}
                  {vendor.notas && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {vendor.notas}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nuevo vendor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Imagen logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoFile: e.target.files && e.target.files[0] ? e.target.files[0] : null
                    })
                  }
                  className="w-full text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Empresa</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">CIF</label>
                  <input
                    type="text"
                    value={formData.cif}
                    onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Sin categoría</option>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Correo</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Teléfono fijo</label>
                  <input
                    type="text"
                    value={formData.telefonoFijo}
                    onChange={(e) =>
                      setFormData({ ...formData, telefonoFijo: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Teléfono móvil</label>
                  <input
                    type="text"
                    value={formData.telefonoMovil}
                    onChange={(e) =>
                      setFormData({ ...formData, telefonoMovil: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear'}
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

