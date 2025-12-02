import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { API_URL } from '../config/axios.js'

const CATEGORIES = [
  'Ayuntamientos',
  'Costas',
  'Medio Ambiente',
  'Aena',
  'Puertos',
  'Transporte',
  'Defensa',
  'Edificios públicos',
  'Tráfico',
  'Delegacion de gobierno'
]

export default function Permits() {
  const navigate = useNavigate()
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPermit, setEditingPermit] = useState(null)
  const [formData, setFormData] = useState({
    administracion: '',
    area: '',
    contacto: '',
    telefono: '',
    correo: '',
    notas: '',
    categoria: ''
  })

  const loadPermits = async () => {
    try {
      const res = await axios.get(`${API_URL}/permits`, { withCredentials: true })
      setPermits(res.data)
    } catch (error) {
      console.error('Error cargando permits:', error)
      alert('Error cargando permisos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermits()
  }, [])

  const openCreateModal = () => {
    setEditingPermit(null)
    setFormData({
      administracion: '',
      area: '',
      contacto: '',
      telefono: '',
      correo: '',
      notas: '',
      categoria: ''
    })
    setShowModal(true)
  }

  const openEditModal = (permit) => {
    setEditingPermit(permit)
    setFormData({
      administracion: permit.administracion || '',
      area: permit.area || '',
      contacto: permit.contacto || '',
      telefono: permit.telefono || '',
      correo: permit.correo || '',
      notas: permit.notas || '',
      categoria: permit.categoria || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.administracion.trim()) {
        alert('El campo Administración es obligatorio')
        setIsSubmitting(false)
        return
      }

      if (editingPermit) {
        await axios.put(`${API_URL}/permits/${editingPermit.id}`, formData, {
          withCredentials: true
        })
      } else {
        await axios.post(`${API_URL}/permits`, formData, {
          withCredentials: true
        })
      }

      await loadPermits()
      setShowModal(false)
    } catch (error) {
      console.error('Error guardando permit:', error)
      alert('Error guardando el permiso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (permit) => {
    if (!window.confirm('¿Seguro que quieres eliminar este registro de permisos?')) return
    try {
      await axios.delete(`${API_URL}/permits/${permit.id}`, {
        withCredentials: true
      })
      await loadPermits()
    } catch (error) {
      console.error('Error eliminando permit:', error)
      alert('Error eliminando el permiso')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando permisos...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Permits</h1>
          <p className="text-gray-500 text-sm mt-1">
            Base de datos de permisos y contactos por administración
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm text-gray-700"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green/90 transition-colors text-sm"
          >
            Añadir registro
          </button>
        </div>
      </div>

      {permits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          No hay registros de permisos. Pulsa &quot;Añadir registro&quot; para crear el primero.
        </div>
      ) : (
        <div className="space-y-4">
          {permits
            .filter((permit) =>
              selectedCategory === 'all'
                ? true
                : permit.categoria === selectedCategory
            )
            .map((permit) => (
            <div
              key={permit.id}
              className="bg-white rounded-xl shadow-md px-5 py-4 border border-gray-100 hover:border-accent-green/50 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/permits/${permit.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {permit.administracion}
                    </h2>
                    {permit.categoria && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {permit.categoria}
                      </span>
                    )}
                  </div>
                  {permit.area && (
                    <p className="text-sm text-gray-500 mb-1">{permit.area}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 mt-2">
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Contacto</p>
                      <p>{permit.contacto || <span className="text-gray-300">—</span>}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Teléfono</p>
                      <p>{permit.telefono || <span className="text-gray-300">—</span>}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Correo</p>
                      <p className="truncate">
                        {permit.correo || <span className="text-gray-300">—</span>}
                      </p>
                    </div>
                  </div>
                  {permit.notas && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                      {permit.notas}
                    </p>
                  )}
                </div>
                <div
                  className="flex flex-col items-end gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(permit)}
                      className="p-1.5 text-gray-600 hover:text-dark-blue hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(permit)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/permits/${permit.id}`)}
                    className="text-xs text-dark-blue hover:text-dark-blue-light"
                  >
                    Ver detalle →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingPermit ? 'Editar permiso' : 'Nuevo permiso'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Administración *</label>
                <input
                  type="text"
                  value={formData.administracion}
                  onChange={(e) =>
                    setFormData({ ...formData, administracion: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Área</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  <option value="">Sin categoría</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) =>
                      setFormData({ ...formData, contacto: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Correo</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) =>
                    setFormData({ ...formData, correo: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
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


