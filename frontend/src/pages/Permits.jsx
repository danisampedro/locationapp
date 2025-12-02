import { useEffect, useState } from 'react'
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
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Permits</h1>
        <button
          onClick={openCreateModal}
          className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green/90 transition-colors"
        >
          Añadir registro
        </button>
      </div>

      {permits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          No hay registros de permisos. Pulsa &quot;Añadir registro&quot; para crear el primero.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administración
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{permit.administracion}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {permit.area || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {permit.categoria || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {permit.contacto || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {permit.telefono || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {permit.correo || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => openEditModal(permit)}
                      className="text-dark-blue hover:underline text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(permit)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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


