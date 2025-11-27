import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios, { API_URL } from '../config/axios.js'

export default function ProyectoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    logo: null,
    company: '',
    cif: '',
    address: '',
    locationManager: '',
    locationCoordinator: '',
    projectDate: '',
    locations: [],
    crew: [],
    vendors: []
  })
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCrew, setAvailableCrew] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])

  useEffect(() => {
    loadProyecto()
    loadAvailableData()
  }, [id])

  const loadProyecto = async () => {
    try {
      const response = await axios.get(`${API_URL}/proyectos/${id}`, { withCredentials: true })
      setProyecto(response.data)
      // Cargar datos en el formulario para edición
      setFormData({
        nombre: response.data.nombre || '',
        descripcion: response.data.descripcion || '',
        logo: null,
        company: response.data.company || '',
        cif: response.data.cif || '',
        address: response.data.address || '',
        locationManager: response.data.locationManager || '',
        locationCoordinator: response.data.locationCoordinator || '',
        projectDate: response.data.projectDate ? response.data.projectDate.slice(0, 10) : '',
        locations: response.data.Locations?.map(l => l.id.toString()) || [],
        crew: response.data.Crews?.map(c => c.id.toString()) || [],
        vendors: response.data.Vendors?.map(v => v.id.toString()) || []
      })
      setLoading(false)
    } catch (error) {
      console.error('Error cargando proyecto:', error)
      setLoading(false)
    }
  }

  const loadAvailableData = async () => {
    try {
      const [locationsRes, crewRes, vendorsRes] = await Promise.all([
        axios.get(`${API_URL}/locations`, { withCredentials: true }),
        axios.get(`${API_URL}/crew`, { withCredentials: true }),
        axios.get(`${API_URL}/vendors`, { withCredentials: true })
      ])
      setAvailableLocations(locationsRes.data)
      setAvailableCrew(crewRes.data)
      setAvailableVendors(vendorsRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const onDropLogo = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData({ ...formData, logo: acceptedFiles[0] })
    }
  }

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onDropLogo,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg']
    },
    maxFiles: 1
  })

  const removeLogo = () => {
    setFormData({ ...formData, logo: null })
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('descripcion', formData.descripcion)
      data.append('company', formData.company)
      data.append('cif', formData.cif)
      data.append('address', formData.address)
      data.append('locationManager', formData.locationManager)
      data.append('locationCoordinator', formData.locationCoordinator)
      if (formData.projectDate) {
        data.append('projectDate', formData.projectDate)
      }
      if (formData.logo) {
        data.append('logo', formData.logo)
      }
      data.append('locations', JSON.stringify(formData.locations))
      data.append('crew', JSON.stringify(formData.crew))
      data.append('vendors', JSON.stringify(formData.vendors))

      const response = await axios.put(
        `${API_URL}/proyectos/${id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
          withCredentials: true
        }
      )

      if (response.status === 200) {
        setShowEditModal(false)
        await loadProyecto()
        alert('Proyecto actualizado exitosamente')
      }
    } catch (error) {
      console.error('Error actualizando proyecto:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al actualizar el proyecto'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/proyectos/${id}`, { withCredentials: true })
      alert('Proyecto eliminado exitosamente')
      navigate('/proyectos')
    } catch (error) {
      console.error('Error eliminando proyecto:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al eliminar el proyecto'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando...</div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Proyecto no encontrado</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/proyectos')}
            className="text-gray-600 hover:text-gray-800 text-xl"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-4">
            {proyecto.logoUrl && (
              <img
                src={proyecto.logoUrl}
                alt={proyecto.nombre}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-800">{proyecto.nombre}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/proyectos/${id}/documents`)}
            className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documentos
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
        {proyecto.projectDate && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Fecha del proyecto</h3>
            <p className="text-gray-800">
              {new Date(proyecto.projectDate).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
        {proyecto.descripcion && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Descripción</h3>
            <p className="text-gray-700 leading-relaxed">{proyecto.descripcion}</p>
          </div>
        )}

        {(proyecto.company || proyecto.cif || proyecto.address || proyecto.locationManager || proyecto.locationCoordinator) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Información de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proyecto.company && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Company</p>
                  <p className="text-gray-800">{proyecto.company}</p>
                </div>
              )}
              {proyecto.cif && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">CIF</p>
                  <p className="text-gray-800">{proyecto.cif}</p>
                </div>
              )}
              {proyecto.address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="text-gray-800">{proyecto.address}</p>
                </div>
              )}
              {proyecto.locationManager && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location Manager</p>
                  <p className="text-gray-800">{proyecto.locationManager}</p>
                </div>
              )}
              {proyecto.locationCoordinator && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location Coordinator</p>
                  <p className="text-gray-800">{proyecto.locationCoordinator}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Locations Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Locations ({proyecto.Locations?.length || 0})</h3>
          </div>
          {proyecto.Locations && proyecto.Locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.Locations.map((loc) => (
                <div 
                  key={loc.id} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/locations/${loc.id}`)}
                >
                  <h4 className="font-semibold text-gray-800 mb-2">{loc.nombre}</h4>
                  {loc.direccion && (
                    <p className="text-sm text-gray-600 mb-1">📍 {loc.direccion}</p>
                  )}
                  {loc.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-2">{loc.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay locations asignadas a este proyecto</p>
          )}
        </div>

        {/* Crew Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Crew ({proyecto.Crews?.length || 0})</h3>
          </div>
          {proyecto.Crews && proyecto.Crews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.Crews.map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">{member.nombre}</h4>
                  {member.rol && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Rol:</span> {member.rol}
                    </p>
                  )}
                  {member.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Email:</span> {member.email}
                    </p>
                  )}
                  {member.telefono && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Teléfono:</span> {member.telefono}
                    </p>
                  )}
                  {member.notas && (
                    <p className="text-sm text-gray-500 mt-2">{member.notas}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay miembros del crew asignados a este proyecto</p>
          )}
        </div>

        {/* Vendors Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Vendors ({proyecto.Vendors?.length || 0})</h3>
          </div>
          {proyecto.Vendors && proyecto.Vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.Vendors.map((vendor) => (
                <div key={vendor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">{vendor.nombre}</h4>
                  {vendor.tipo && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tipo:</span> {vendor.tipo}
                    </p>
                  )}
                  {vendor.contacto && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Contacto:</span> {vendor.contacto}
                    </p>
                  )}
                  {vendor.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Email:</span> {vendor.email}
                    </p>
                  )}
                  {vendor.telefono && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Teléfono:</span> {vendor.telefono}
                    </p>
                  )}
                  {vendor.notas && (
                    <p className="text-sm text-gray-500 mt-2">{vendor.notas}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay vendors asignados a este proyecto</p>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Editar Proyecto</h2>
            <form onSubmit={handleEdit}>
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
                {formData.logo ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(formData.logo)}
                      alt="Logo preview"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : proyecto.logoUrl ? (
                  <div className="relative">
                    <img
                      src={proyecto.logoUrl}
                      alt="Current logo"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-500 mb-2">Logo actual (deja vacío para mantener)</p>
                    <div
                      {...getLogoRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isLogoDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getLogoInputProps()} />
                      {isLogoDragActive ? (
                        <p className="text-accent-green text-sm">Suelta el logo aquí...</p>
                      ) : (
                        <p className="text-gray-600 text-sm">Arrastra nuevo logo o haz clic para seleccionar</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    {...getLogoRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isLogoDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getLogoInputProps()} />
                    {isLogoDragActive ? (
                      <p className="text-accent-green">Suelta el logo aquí...</p>
                    ) : (
                      <p className="text-gray-600">Arrastra el logo aquí o haz clic para seleccionar</p>
                    )}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">CIF</label>
                <input
                  type="text"
                  value={formData.cif}
                  onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location Manager</label>
                <input
                  type="text"
                  value={formData.locationManager}
                  onChange={(e) => setFormData({ ...formData, locationManager: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location Coordinator</label>
                <input
                  type="text"
                  value={formData.locationCoordinator}
                  onChange={(e) => setFormData({ ...formData, locationCoordinator: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Fecha del proyecto</label>
                <input
                  type="date"
                  value={formData.projectDate}
                  onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
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
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

