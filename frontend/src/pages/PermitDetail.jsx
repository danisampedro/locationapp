import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function PermitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [permit, setPermit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    administracion: '',
    area: '',
    contacto: '',
    telefono: '',
    correo: '',
    notas: '',
    categoria: ''
  })

  const loadPermit = async () => {
    try {
      const res = await axios.get(`${API_URL}/permits/${id}`, { withCredentials: true })
      setPermit(res.data)
      setFormData({
        administracion: res.data.administracion || '',
        area: res.data.area || '',
        contacto: res.data.contacto || '',
        telefono: res.data.telefono || '',
        correo: res.data.correo || '',
        notas: res.data.notas || '',
        categoria: res.data.categoria || ''
      })
    } catch (error) {
      console.error('Error cargando permiso:', error)
      alert('Error cargando permiso')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermit()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (!formData.administracion.trim()) {
        alert('El campo Administración es obligatorio')
        setIsSubmitting(false)
        return
      }
      await axios.put(`${API_URL}/permits/${id}`, formData, {
        withCredentials: true
      })
      await loadPermit()
      setIsEditing(false)
    } catch (error) {
      console.error('Error guardando permiso:', error)
      alert('Error guardando el permiso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar este registro de permisos?')) return
    try {
      await axios.delete(`${API_URL}/permits/${id}`, {
        withCredentials: true
      })
      navigate('/permits')
    } catch (error) {
      console.error('Error eliminando permiso:', error)
      alert('Error eliminando el permiso')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando permiso...</div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Permiso no encontrado</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/permits')}
            className="text-gray-600 hover:text-gray-800 text-xl"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{permit.administracion}</h1>
            {permit.area && (
              <p className="text-sm text-gray-500 mt-1">{permit.area}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-blue text-white hover:bg-dark-blue-light"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
        {!isEditing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Administración
                </h3>
                <p className="text-gray-800">{permit.administracion}</p>
              </div>
              {permit.categoria && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Categoría
                  </h3>
                  <p className="text-gray-800">{permit.categoria}</p>
                </div>
              )}
              {permit.area && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Área
                  </h3>
                  <p className="text-gray-800">{permit.area}</p>
                </div>
              )}
              {permit.contacto && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Contacto
                  </h3>
                  <p className="text-gray-800">{permit.contacto}</p>
                </div>
              )}
              {permit.telefono && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Teléfono
                  </h3>
                  <p className="text-gray-800">{permit.telefono}</p>
                </div>
              )}
              {permit.correo && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Correo
                  </h3>
                  <p className="text-gray-800">{permit.correo}</p>
                </div>
              )}
            </div>
            {permit.notas && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Notas
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {permit.notas}
                </p>
              </div>
            )}
          </>
        ) : (
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
                rows="4"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}







