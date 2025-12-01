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
    assistantLocationManager: '',
    basecampManager: '',
    projectDate: '',
    locations: [], // Array de objetos {id, setName, basecampLink, distanceLocBase}
    crew: [], // Array de objetos {id, startDate, endDate, weeklyRate, carAllowance, boxRental}
    vendors: []
  })
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCrew, setAvailableCrew] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])
  const [isQuickSaving, setIsQuickSaving] = useState(false)

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
        assistantLocationManager: response.data.assistantLocationManager || '',
        basecampManager: response.data.basecampManager || '',
        projectDate: response.data.projectDate ? response.data.projectDate.slice(0, 10) : '',
        locations: response.data.Locations?.map(l => ({
          id: l.id.toString(),
          setName: l.ProyectoLocation?.setName || '',
          basecampLink: l.ProyectoLocation?.basecampLink || '',
          distanceLocBase: l.ProyectoLocation?.distanceLocBase || ''
        })) || [],
        crew: response.data.Crews?.map(c => ({
          id: c.id.toString(),
          startDate: c.ProyectoCrew?.startDate ? c.ProyectoCrew.startDate.slice(0, 10) : '',
          endDate: c.ProyectoCrew?.endDate ? c.ProyectoCrew.endDate.slice(0, 10) : '',
          weeklyRate: c.ProyectoCrew?.weeklyRate || '',
          carAllowance: c.ProyectoCrew?.carAllowance === true,
          boxRental: c.ProyectoCrew?.boxRental === true
        })) || [],
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
      data.append('assistantLocationManager', formData.assistantLocationManager)
      data.append('basecampManager', formData.basecampManager)
      if (formData.projectDate) {
        data.append('projectDate', formData.projectDate)
      }
      if (formData.logo) {
        data.append('logo', formData.logo)
      }
      // Enviar locations como array de objetos con campos extra
      const locationsData = formData.locations.map(loc => ({
        id: parseInt(loc.id),
        setName: loc.setName || '',
        basecampLink: loc.basecampLink || '',
        distanceLocBase: loc.distanceLocBase || ''
      }))
      data.append('locations', JSON.stringify(locationsData))
      // Enviar crew como array de objetos con campos extra
      const crewData = formData.crew.map(c => ({
        id: parseInt(c.id),
        startDate: c.startDate || '',
        endDate: c.endDate || '',
        weeklyRate: c.weeklyRate || '',
        carAllowance: !!c.carAllowance,
        boxRental: !!c.boxRental
      }))
      data.append('crew', JSON.stringify(crewData))
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

  // Guardado rápido de locations/crew/vendors desde la vista del proyecto
  const handleQuickSaveProjectRelations = async () => {
    if (!proyecto) return
    setIsQuickSaving(true)

    try {
      const data = new FormData()

      // Usamos los datos actuales del proyecto para no obligar a abrir el modal
      data.append('nombre', proyecto.nombre || '')
      data.append('descripcion', proyecto.descripcion || '')
      data.append('company', proyecto.company || '')
      data.append('cif', proyecto.cif || '')
      data.append('address', proyecto.address || '')
      data.append('locationManager', proyecto.locationManager || '')
      data.append('locationCoordinator', proyecto.locationCoordinator || '')
      data.append('assistantLocationManager', proyecto.assistantLocationManager || '')
      data.append('basecampManager', proyecto.basecampManager || '')
      if (proyecto.projectDate) {
        // projectDate llega como ISO, la recortamos a YYYY-MM-DD si es necesario
        const dateValue =
          typeof proyecto.projectDate === 'string'
            ? proyecto.projectDate.slice(0, 10)
            : new Date(proyecto.projectDate).toISOString().slice(0, 10)
        data.append('projectDate', dateValue)
      }

      // NO enviamos logo aquí para no modificarlo

      // Locations con datos extra desde formData
      const locationsData = formData.locations.map((loc) => ({
        id: parseInt(loc.id),
        setName: loc.setName || '',
        basecampLink: loc.basecampLink || '',
        distanceLocBase: loc.distanceLocBase || ''
      }))
      data.append('locations', JSON.stringify(locationsData))

      // Crew con datos extra desde formData
      const crewData = formData.crew.map((c) => ({
        id: parseInt(c.id),
        startDate: c.startDate || '',
        endDate: c.endDate || '',
        weeklyRate: c.weeklyRate || '',
        carAllowance: !!c.carAllowance,
        boxRental: !!c.boxRental
      }))
      data.append('crew', JSON.stringify(crewData))

      // Vendors actuales desde formData (no se editan aquí, pero se preservan)
      data.append('vendors', JSON.stringify(formData.vendors || []))

      const response = await axios.put(`${API_URL}/proyectos/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        withCredentials: true
      })

      if (response.status === 200) {
        await loadProyecto()
        alert('Relaciones de locations y crew actualizadas')
      }
    } catch (error) {
      console.error('Error en guardado rápido de proyecto:', error)
      alert(
        `Error: ${
          error.response?.data?.error ||
          error.message ||
          'Error al actualizar las relaciones del proyecto'
        }`
      )
    } finally {
      setIsQuickSaving(false)
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

        {(proyecto.company || proyecto.cif || proyecto.address || proyecto.locationManager || proyecto.locationCoordinator || proyecto.assistantLocationManager || proyecto.basecampManager) && (
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
              {proyecto.assistantLocationManager && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assistant Location Manager</p>
                  <p className="text-gray-800">{proyecto.assistantLocationManager}</p>
                </div>
              )}
              {proyecto.basecampManager && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Basecamp Manager</p>
                  <p className="text-gray-800">{proyecto.basecampManager}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Locations Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Locations ({proyecto.Locations?.length || 0})
            </h3>
          </div>

          {/* Selector moderno con checkboxes y edición inline */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Seleccionar locations para este proyecto
              </h4>
              <span className="text-xs text-gray-500">
                {formData.locations.length} seleccionadas
              </span>
            </div>

            {availableLocations.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay locations disponibles para asignar.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {availableLocations.map((loc) => {
                  const existing = formData.locations.find(
                    (l) => l.id.toString() === loc.id.toString()
                  )
                  const isSelected = !!existing

                  return (
                    <div
                      key={loc.id}
                      className="bg-white rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-dark-blue focus:ring-dark-blue"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked
                              if (checked) {
                                // Añadir manteniendo datos si existían
                                const current = formData.locations
                                const already = current.find(
                                  (l) => l.id.toString() === loc.id.toString()
                                )
                                const updated = already
                                  ? current
                                  : [
                                      ...current,
                                      {
                                        id: loc.id.toString(),
                                        setName: '',
                                        basecampLink: '',
                                        distanceLocBase: ''
                                      }
                                    ]
                                setFormData({
                                  ...formData,
                                  locations: updated
                                })
                              } else {
                                // Quitar
                                setFormData({
                                  ...formData,
                                  locations: formData.locations.filter(
                                    (l) => l.id.toString() !== loc.id.toString()
                                  )
                                })
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-gray-800">
                            {loc.nombre}
                          </span>
                        </label>
                        {loc.direccion && (
                          <span className="hidden md:block text-xs text-gray-500 truncate max-w-[220px]">
                            {loc.direccion}
                          </span>
                        )}
                      </div>

                      {/* Campos extra solo cuando está seleccionada */}
                      {isSelected && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              SET NAME
                            </label>
                            <input
                              type="text"
                              value={existing?.setName || ''}
                              onChange={(e) => {
                                const updated = formData.locations.map((l) =>
                                  l.id.toString() === loc.id.toString()
                                    ? { ...l, setName: e.target.value }
                                    : l
                                )
                                setFormData({ ...formData, locations: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="Nombre del set"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Google Link de BASECAMP
                            </label>
                            <input
                              type="url"
                              value={existing?.basecampLink || ''}
                              onChange={(e) => {
                                const updated = formData.locations.map((l) =>
                                  l.id.toString() === loc.id.toString()
                                    ? { ...l, basecampLink: e.target.value }
                                    : l
                                )
                                setFormData({ ...formData, locations: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Distance LOC - BASE
                            </label>
                            <input
                              type="text"
                              value={existing?.distanceLocBase || ''}
                              onChange={(e) => {
                                const updated = formData.locations.map((l) =>
                                  l.id.toString() === loc.id.toString()
                                    ? { ...l, distanceLocBase: e.target.value }
                                    : l
                                )
                                setFormData({ ...formData, locations: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="Ej: 15 km"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleQuickSaveProjectRelations}
                disabled={isQuickSaving}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-dark-blue text-white hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isQuickSaving ? 'Guardando...' : 'Guardar locations y crew'}
              </button>
            </div>
          </div>

          {/* Resumen de locations asignadas (solo lectura) */}
          {proyecto.Locations && proyecto.Locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.Locations.map((loc) => {
                const proyectoLocation = loc.ProyectoLocation || {}
                return (
                  <div
                    key={loc.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4
                        className="font-semibold text-gray-800 cursor-pointer hover:text-dark-blue"
                        onClick={() => navigate(`/locations/${loc.id}`)}
                      >
                        {loc.nombre}
                      </h4>
                    </div>
                    {loc.direccion && (
                      <p className="text-sm text-gray-600 mb-1">📍 {loc.direccion}</p>
                    )}
                    {proyectoLocation.setName && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-semibold">SET NAME:</span>{' '}
                        {proyectoLocation.setName}
                      </p>
                    )}
                    {proyectoLocation.basecampLink && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-semibold">Basecamp:</span>{' '}
                        <a
                          href={proyectoLocation.basecampLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark-blue hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver en Basecamp
                        </a>
                      </p>
                    )}
                    {proyectoLocation.distanceLocBase && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-semibold">Distance LOC - BASE:</span>{' '}
                        {proyectoLocation.distanceLocBase}
                      </p>
                    )}
                    {loc.descripcion && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                        {loc.descripcion}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No hay locations asignadas a este proyecto
            </p>
          )}
        </div>

        {/* Crew Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Crew ({proyecto.Crews?.length || 0})
            </h3>
          </div>

          {/* Selector moderno de crew con checkboxes */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Seleccionar crew para este proyecto
              </h4>
              <span className="text-xs text-gray-500">
                {formData.crew.length} miembros seleccionados
              </span>
            </div>

            {availableCrew.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay miembros de crew disponibles para asignar.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {availableCrew.map((member) => {
                  const existing = formData.crew.find(
                    (c) => c.id.toString() === member.id.toString()
                  )
                  const isSelected = !!existing

                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-dark-blue focus:ring-dark-blue"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked
                              if (checked) {
                                const current = formData.crew
                                const already = current.find(
                                  (c) => c.id.toString() === member.id.toString()
                                )
                                const updated = already
                                  ? current
                                  : [
                                      ...current,
                                      {
                                        id: member.id.toString(),
                                        startDate: '',
                                        endDate: '',
                                        weeklyRate: '',
                                        carAllowance: false,
                                        boxRental: false
                                      }
                                    ]
                                setFormData({
                                  ...formData,
                                  crew: updated
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  crew: formData.crew.filter(
                                    (c) => c.id.toString() !== member.id.toString()
                                  )
                                })
                              }
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {member.nombre}
                            </p>
                            {member.rol && (
                              <p className="text-xs text-gray-500">{member.rol}</p>
                            )}
                          </div>
                        </label>
                        {member.email && (
                          <span className="hidden md:block text-xs text-gray-500 truncate max-w-[200px]">
                            {member.email}
                          </span>
                        )}
                      </div>

                      {/* Campos extra solo cuando está seleccionado */}
                      {isSelected && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Fecha de alta
                            </label>
                            <input
                              type="date"
                              value={existing?.startDate || ''}
                              onChange={(e) => {
                                const updated = formData.crew.map((c) =>
                                  c.id.toString() === member.id.toString()
                                    ? { ...c, startDate: e.target.value }
                                    : c
                                )
                                setFormData({ ...formData, crew: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Fecha de baja
                            </label>
                            <input
                              type="date"
                              value={existing?.endDate || ''}
                              onChange={(e) => {
                                const updated = formData.crew.map((c) =>
                                  c.id.toString() === member.id.toString()
                                    ? { ...c, endDate: e.target.value }
                                    : c
                                )
                                setFormData({ ...formData, crew: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Tarifa semanal
                            </label>
                            <input
                              type="text"
                              value={existing?.weeklyRate || ''}
                              onChange={(e) => {
                                const updated = formData.crew.map((c) =>
                                  c.id.toString() === member.id.toString()
                                    ? { ...c, weeklyRate: e.target.value }
                                    : c
                                )
                                setFormData({ ...formData, crew: updated })
                              }}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="Ej: 1.500 €"
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 text-[11px] text-gray-600">
                              <input
                                type="checkbox"
                                checked={!!existing?.carAllowance}
                                onChange={(e) => {
                                  const updated = formData.crew.map((c) =>
                                    c.id.toString() === member.id.toString()
                                      ? { ...c, carAllowance: e.target.checked }
                                      : c
                                  )
                                  setFormData({ ...formData, crew: updated })
                                }}
                              />
                              <span>Car Allowance</span>
                            </label>
                            <label className="flex items-center gap-2 text-[11px] text-gray-600">
                              <input
                                type="checkbox"
                                checked={!!existing?.boxRental}
                                onChange={(e) => {
                                  const updated = formData.crew.map((c) =>
                                    c.id.toString() === member.id.toString()
                                      ? { ...c, boxRental: e.target.checked }
                                      : c
                                  )
                                  setFormData({ ...formData, crew: updated })
                                }}
                              />
                              <span>Box Rental</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* El botón de guardado rápido ya está en la sección de locations y guarda también crew */}
          </div>

          {/* Resumen de crew asignado (solo lectura) */}
          {proyecto.Crews && proyecto.Crews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.Crews.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {member.nombre}
                  </h4>
                  {member.rol && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-500">Rol:</span> {member.rol}
                    </p>
                  )}
                  {member.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-500">Email:</span> {member.email}
                    </p>
                  )}
                  {member.telefono && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-500">Teléfono:</span>{' '}
                      {member.telefono}
                    </p>
                  )}
                  {member.notas && (
                    <p className="text-sm text-gray-500 mt-2">{member.notas}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No hay miembros del crew asignados a este proyecto
            </p>
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
                <label className="block text-gray-700 mb-2">Assistant Location Manager</label>
                <input
                  type="text"
                  value={formData.assistantLocationManager}
                  onChange={(e) => setFormData({ ...formData, assistantLocationManager: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Basecamp Manager</label>
                <input
                  type="text"
                  value={formData.basecampManager}
                  onChange={(e) => setFormData({ ...formData, basecampManager: e.target.value })}
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
                  value={formData.locations.map(l => l.id)}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value)
                    const currentLocations = formData.locations
                    const newLocations = selectedIds.map(id => {
                      // Asegurar que ambos sean strings para la comparación
                      const existing = currentLocations.find(l => l.id.toString() === id.toString())
                      if (existing) {
                        // Preservar los datos existentes
                        return existing
                      }
                      // Nueva localización sin datos
                      return { id: id.toString(), setName: '', basecampLink: '', distanceLocBase: '' }
                    })
                    setFormData({
                      ...formData,
                      locations: newLocations
                    })
                  }}
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                >
                  {availableLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.nombre}</option>
                  ))}
                </select>
                
                {/* Campos extra para cada location seleccionada */}
                {formData.locations.length > 0 && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Información adicional por location:</p>
                    {formData.locations.map((loc, index) => {
                      const locationName = availableLocations.find(l => l.id.toString() === loc.id)?.nombre || `Location ${loc.id}`
                      return (
                        <div key={loc.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <h4 className="font-semibold text-gray-800 mb-3">{locationName}</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">SET NAME</label>
                              <input
                                type="text"
                                value={loc.setName || ''}
                                onChange={(e) => {
                                  const updatedLocations = [...formData.locations]
                                  updatedLocations[index] = { ...updatedLocations[index], setName: e.target.value }
                                  setFormData({ ...formData, locations: updatedLocations })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="Nombre del set"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Google Link de BASECAMP</label>
                              <input
                                type="url"
                                value={loc.basecampLink || ''}
                                onChange={(e) => {
                                  const updatedLocations = [...formData.locations]
                                  updatedLocations[index] = { ...updatedLocations[index], basecampLink: e.target.value }
                                  setFormData({ ...formData, locations: updatedLocations })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="https://..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Distance LOC - BASE</label>
                              <input
                                type="text"
                                value={loc.distanceLocBase || ''}
                                onChange={(e) => {
                                  const updatedLocations = [...formData.locations]
                                  updatedLocations[index] = { ...updatedLocations[index], distanceLocBase: e.target.value }
                                  setFormData({ ...formData, locations: updatedLocations })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="Ej: 15 km"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Crew</label>
                <select
                  multiple
                  value={formData.crew.map(c => c.id)}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value)
                    const currentCrew = formData.crew
                    const newCrew = selectedIds.map(id => {
                      const existing = currentCrew.find(c => c.id.toString() === id.toString())
                      if (existing) {
                        return existing
                      }
                      return {
                        id: id.toString(),
                        startDate: '',
                        endDate: '',
                        weeklyRate: '',
                        carAllowance: false,
                        boxRental: false
                      }
                    })
                    setFormData({
                      ...formData,
                      crew: newCrew
                    })
                  }}
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                >
                  {availableCrew.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>

                {/* Campos extra para cada miembro de crew seleccionado */}
                {formData.crew.length > 0 && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Información adicional por miembro de crew:</p>
                    {formData.crew.map((member, index) => {
                      const crewName = availableCrew.find(c => c.id.toString() === member.id)?.nombre || `Crew ${member.id}`
                      const crewRole = availableCrew.find(c => c.id.toString() === member.id)?.rol || ''
                      return (
                        <div key={member.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800">{crewName}</h4>
                            {crewRole && (
                              <span className="text-xs text-gray-500">{crewRole}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fecha de alta</label>
                              <input
                                type="date"
                                value={member.startDate || ''}
                                onChange={(e) => {
                                  const updatedCrew = [...formData.crew]
                                  updatedCrew[index] = { ...updatedCrew[index], startDate: e.target.value }
                                  setFormData({ ...formData, crew: updatedCrew })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fecha de baja</label>
                              <input
                                type="date"
                                value={member.endDate || ''}
                                onChange={(e) => {
                                  const updatedCrew = [...formData.crew]
                                  updatedCrew[index] = { ...updatedCrew[index], endDate: e.target.value }
                                  setFormData({ ...formData, crew: updatedCrew })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Tarifa semanal</label>
                              <input
                                type="text"
                                value={member.weeklyRate || ''}
                                onChange={(e) => {
                                  const updatedCrew = [...formData.crew]
                                  updatedCrew[index] = { ...updatedCrew[index], weeklyRate: e.target.value }
                                  setFormData({ ...formData, crew: updatedCrew })
                                }}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="Ej: 1.500 €"
                              />
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={!!member.carAllowance}
                                  onChange={(e) => {
                                    const updatedCrew = [...formData.crew]
                                    updatedCrew[index] = { ...updatedCrew[index], carAllowance: e.target.checked }
                                    setFormData({ ...formData, crew: updatedCrew })
                                  }}
                                />
                                <span>Car Allowance</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={!!member.boxRental}
                                  onChange={(e) => {
                                    const updatedCrew = [...formData.crew]
                                    updatedCrew[index] = { ...updatedCrew[index], boxRental: e.target.checked }
                                    setFormData({ ...formData, crew: updatedCrew })
                                  }}
                                />
                                <span>Box Rental</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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

