import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios, { API_URL } from '../config/axios.js'

// Iconos monocromos para métricas del proyecto
const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CrewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87M12 7a4 4 0 110-8 4 4 0 010 8z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8a4 4 0 100-8 4 4 0 000 8zm12 0a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
)

const VendorIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l1-5h16l1 5M4 9h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6" />
  </svg>
)

// Icono monocromo para dirección
const AddressIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 00-7 7c0 4.418 7 13 7 13s7-8.582 7-13a7 7 0 00-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

export default function Proyectos() {
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [showModal, setShowModal] = useState(false)
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

  useEffect(() => {
    loadProyectos()
    loadAvailableData()
  }, [])

  const loadProyectos = async () => {
    try {
      const response = await axios.get(`${API_URL}/proyectos`, { withCredentials: true })
      const sorted = [...response.data].sort((a, b) => {
        const dateA = new Date(a.projectDate || a.createdAt)
        const dateB = new Date(b.projectDate || b.createdAt)
        return dateB - dateA
      })
      setProyectos(sorted)
    } catch (error) {
      console.error('Error cargando proyectos:', error)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('handleSubmit llamado', formData)
    
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

      console.log('Enviando petición a:', `${API_URL}/proyectos`)
      
      const response = await axios.post(
        `${API_URL}/proyectos`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000, // 60 segundos
          withCredentials: true
        }
      )
      
      console.log('Respuesta recibida:', response)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      
      if (response.status === 201 || response.status === 200) {
        console.log('Proyecto creado exitosamente:', response.data)
        setShowModal(false)
        setFormData({ nombre: '', descripcion: '', logo: null, company: '', cif: '', address: '', locationManager: '', locationCoordinator: '', projectDate: '', locations: [], crew: [], vendors: [] })
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Proyectos</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona todos tus proyectos de producción</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FolderIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay proyectos aún</h3>
          <p className="text-gray-500 mb-6">Crea tu primer proyecto para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos.map((proyecto) => (
          <div 
            key={proyecto.id} 
            onClick={() => navigate(`/proyectos/${proyecto.id}`)}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-2xl transition-shadow border border-gray-100 cursor-pointer hover:border-accent-green/40"
          >
            <div className="flex items-start gap-4 mb-4">
              {proyecto.logoUrl && (
                <img
                  src={proyecto.logoUrl}
                  alt={proyecto.nombre}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-gray-200"
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 truncate">{proyecto.nombre}</h2>
                {proyecto.company && (
                  <p className="text-xs text-gray-600 mb-0.5">
                    <span className="font-semibold text-gray-800">Company: </span>
                    <span className="truncate inline-block max-w-full align-middle">{proyecto.company}</span>
                  </p>
                )}
                {proyecto.cif && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    <span className="font-semibold text-gray-700">CIF: </span>
                    {proyecto.cif}
                  </p>
                )}
              </div>
            </div>
            
            {proyecto.descripcion && (
              <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{proyecto.descripcion}</p>
            )}
            
            {proyecto.address && (
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <span className="text-gray-700">
                  <AddressIcon />
                </span>
                <span className="truncate">{proyecto.address}</span>
              </p>
            )}
            
            {(proyecto.locationManager || proyecto.locationCoordinator) && (
              <div className="mb-3 space-y-0.5">
                {proyecto.locationManager && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">Manager: </span>
                    {proyecto.locationManager}
                  </p>
                )}
                {proyecto.locationCoordinator && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">Coordinator: </span>
                    {proyecto.locationCoordinator}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <LocationIcon />
                <span>{proyecto.Locations?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CrewIcon />
                <span>{proyecto.Crews?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <VendorIcon />
                <span>{proyecto.Vendors?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Nuevo Proyecto</h2>
              <p className="text-sm text-gray-500 mt-1">Completa los datos del proyecto</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
            <form id="proyecto-form" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue focus:border-transparent transition-all"
                  required
                  placeholder="Nombre del proyecto"
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
                      <p className="text-gray-600">
                        Arrastra el logo aquí o haz clic para seleccionar
                      </p>
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
                <label className="block text-gray-700 mb-2">Fecha del proyecto</label>
                <input
                  type="date"
                  value={formData.projectDate}
                  onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
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
            </form>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="proyecto-form"
                onClick={(e) => {
                  e.preventDefault()
                  const form = document.getElementById('proyecto-form')
                  if (form) {
                    const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                    form.dispatchEvent(formEvent)
                  } else {
                    handleSubmit(e)
                  }
                }}
                className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

