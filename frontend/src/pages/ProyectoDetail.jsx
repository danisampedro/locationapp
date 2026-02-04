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
    secondaryLogo: null,
    company: '',
    cif: '',
    address: '',
    locationManager: '',
    locationManagerPhone: '',
    locationManagerEmail: '',
    locationCoordinator: '',
    locationCoordinatorPhone: '',
    locationCoordinatorEmail: '',
    assistantLocationManager: '',
    basecampManager: '',
    projectDate: '',
    fechaInicio: '',
    fechaFin: '',
    locations: [], // Array de objetos {id, setName, basecampLink, distanceLocBase}
    crew: [], // Array de objetos {id, startDate, endDate, weeklyRate, carAllowance, boxRental}
    vendors: []
  })
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCrew, setAvailableCrew] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])
  const [availablePermits, setAvailablePermits] = useState([])
  const [projectPermits, setProjectPermits] = useState([])
  const [loadingPermits, setLoadingPermits] = useState(true)
  const [newPermitSelection, setNewPermitSelection] = useState({
    permitId: '',
    locationId: ''
  })
  const [isCreatingPermit, setIsCreatingPermit] = useState(false)
  const [isQuickSaving, setIsQuickSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    loadProyecto()
    loadAvailableData()
    loadProjectPermits()
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
        secondaryLogo: null,
        company: response.data.company || '',
        cif: response.data.cif || '',
        address: response.data.address || '',
        locationManager: response.data.locationManager || '',
        locationManagerPhone: response.data.locationManagerPhone || '',
        locationManagerEmail: response.data.locationManagerEmail || '',
        locationCoordinator: response.data.locationCoordinator || '',
        locationCoordinatorPhone: response.data.locationCoordinatorPhone || '',
        locationCoordinatorEmail: response.data.locationCoordinatorEmail || '',
        assistantLocationManager: response.data.assistantLocationManager || '',
        basecampManager: response.data.basecampManager || '',
        projectDate: response.data.projectDate ? response.data.projectDate.slice(0, 10) : '',
        fechaInicio: response.data.fechaInicio ? response.data.fechaInicio.slice(0, 10) : '',
        fechaFin: response.data.fechaFin ? response.data.fechaFin.slice(0, 10) : '',
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
      const [locationsRes, crewRes, vendorsRes, permitsRes] = await Promise.all([
        axios.get(`${API_URL}/locations`, { withCredentials: true }),
        axios.get(`${API_URL}/crew`, { withCredentials: true }),
        axios.get(`${API_URL}/vendors`, { withCredentials: true }),
        axios.get(`${API_URL}/permits`, { withCredentials: true })
      ])
      setAvailableLocations(locationsRes.data)
      setAvailableCrew(crewRes.data)
      setAvailableVendors(vendorsRes.data)
      setAvailablePermits(permitsRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const loadProjectPermits = async () => {
    try {
      setLoadingPermits(true)
      const res = await axios.get(`${API_URL}/proyectos/${id}/permits`, {
        withCredentials: true
      })
      setProjectPermits(res.data || [])
    } catch (error) {
      console.error('Error cargando permits del proyecto:', error)
      setProjectPermits([])
    } finally {
      setLoadingPermits(false)
    }
  }

  const handleCreateProjectPermit = async () => {
    if (!newPermitSelection.permitId || !newPermitSelection.locationId) {
      alert('Selecciona un permit y una localización del proyecto')
      return
    }

    try {
      setIsCreatingPermit(true)
      const body = {
        permitId: parseInt(newPermitSelection.permitId),
        locationId: parseInt(newPermitSelection.locationId)
      }
      const res = await axios.post(`${API_URL}/proyectos/${id}/permits`, body, {
        withCredentials: true
      })
      setProjectPermits((prev) => [...prev, res.data])
      setNewPermitSelection({ permitId: '', locationId: '' })
    } catch (error) {
      console.error('Error creando permit del proyecto:', error)
      alert(
        error.response?.data?.error ||
          'Error al añadir el permit al proyecto'
      )
    } finally {
      setIsCreatingPermit(false)
    }
  }

  const handleTogglePermitStatus = async (assignmentId, field, value) => {
    try {
      setProjectPermits((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, [field]: value } : a
        )
      )

      await axios.put(
        `${API_URL}/proyectos/${id}/permits/${assignmentId}`,
        { [field]: value },
        { withCredentials: true }
      )
    } catch (error) {
      console.error('Error actualizando estado de permit:', error)
      alert(
        error.response?.data?.error ||
          'Error al actualizar el estado del permiso'
      )
      // Re-cargar desde servidor para no dejar el estado inconsistente
      await loadProjectPermits()
    }
  }

  const handleDeleteProjectPermit = async (assignmentId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta asignación de permit?')) return
    try {
      await axios.delete(`${API_URL}/proyectos/${id}/permits/${assignmentId}`, {
        withCredentials: true
      })
      setProjectPermits((prev) => prev.filter((a) => a.id !== assignmentId))
    } catch (error) {
      console.error('Error eliminando asignación de permit:', error)
      alert(
        error.response?.data?.error ||
          'Error al eliminar la asignación de permiso'
      )
    }
  }

  const onDropLogo = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData({ ...formData, logo: acceptedFiles[0] })
    }
  }

  const onDropSecondaryLogo = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData({ ...formData, secondaryLogo: acceptedFiles[0] })
    }
  }

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onDropLogo,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg']
    },
    maxFiles: 1
  })

  const {
    getRootProps: getSecondaryLogoRootProps,
    getInputProps: getSecondaryLogoInputProps,
    isDragActive: isSecondaryLogoDragActive
  } = useDropzone({
    onDrop: onDropSecondaryLogo,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg']
    },
    maxFiles: 1
  })

  const removeLogo = () => {
    setFormData({ ...formData, logo: null })
  }

  const removeSecondaryLogo = () => {
    setFormData({ ...formData, secondaryLogo: null })
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
      data.append('locationManagerPhone', formData.locationManagerPhone)
      data.append('locationManagerEmail', formData.locationManagerEmail)
      data.append('locationCoordinator', formData.locationCoordinator)
      data.append('locationCoordinatorPhone', formData.locationCoordinatorPhone)
      data.append('locationCoordinatorEmail', formData.locationCoordinatorEmail)
      data.append('assistantLocationManager', formData.assistantLocationManager)
      data.append('basecampManager', formData.basecampManager)
      if (formData.projectDate) {
        data.append('projectDate', formData.projectDate)
      }
      if (formData.fechaInicio) {
        data.append('fechaInicio', formData.fechaInicio)
      }
      if (formData.fechaFin) {
        data.append('fechaFin', formData.fechaFin)
      }
      if (formData.logo) {
        data.append('logo', formData.logo)
      }
      if (formData.secondaryLogo) {
        data.append('secondaryLogo', formData.secondaryLogo)
      }
      // No enviar locations, crew y vendors aquí - se editan en la página principal del proyecto

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
      data.append('locationManagerPhone', proyecto.locationManagerPhone || '')
      data.append('locationManagerEmail', proyecto.locationManagerEmail || '')
      data.append('locationCoordinator', proyecto.locationCoordinator || '')
      data.append('locationCoordinatorPhone', proyecto.locationCoordinatorPhone || '')
      data.append('locationCoordinatorEmail', proyecto.locationCoordinatorEmail || '')
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

      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'info'
                  ? 'border-dark-blue text-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('locations')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'locations'
                  ? 'border-dark-blue text-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Locations ({proyecto.Locations?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'crew'
                  ? 'border-dark-blue text-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Crew ({proyecto.Crews?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'vendors'
                  ? 'border-dark-blue text-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vendors ({proyecto.Vendors?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permits')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'permits'
                  ? 'border-dark-blue text-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permits
            </button>
          </nav>
        </div>

        <div className="space-y-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <>
              {proyecto.projectDate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Fecha del proyecto
                  </h3>
                  <p className="text-gray-800">
                    {new Date(proyecto.projectDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              {proyecto.descripcion && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Descripción
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{proyecto.descripcion}</p>
                </div>
              )}

              {(proyecto.company ||
                proyecto.cif ||
                proyecto.address ||
                proyecto.locationManager ||
                proyecto.locationCoordinator ||
                proyecto.assistantLocationManager ||
                proyecto.basecampManager) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                    Información de la Empresa
                  </h3>
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
            </>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Locations ({proyecto.Locations?.length || 0})
                </h3>
              </div>

              {/* Selector moderno con checkboxes y edición inline */}
              <div className="mb-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
          )}

          {/* Crew Tab */}
          {activeTab === 'crew' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Crew ({proyecto.Crews?.length || 0})
                </h3>
              </div>

              {/* Selector moderno de crew con checkboxes */}
              <div className="mb-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

                {/* El botón de guardado rápido ya está en la pestaña de locations y guarda también crew */}
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
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Vendors ({proyecto.Vendors?.length || 0})
                </h3>
              </div>
              {proyecto.Vendors && proyecto.Vendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proyecto.Vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {vendor.nombre}
                      </h4>
                      {vendor.tipo && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Tipo:</span> {vendor.tipo}
                        </p>
                      )}
                      {vendor.contacto && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Contacto:</span>{' '}
                          {vendor.contacto}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Email:</span> {vendor.email}
                        </p>
                      )}
                      {vendor.telefono && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Teléfono:</span>{' '}
                          {vendor.telefono}
                        </p>
                      )}
                      {vendor.notas && (
                        <p className="text-sm text-gray-500 mt-2">{vendor.notas}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No hay vendors asignados a este proyecto
                </p>
              )}
            </div>
          )}

          {/* Permits Tab */}
          {activeTab === 'permits' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Permits asignados al proyecto ({projectPermits.length})
                </h3>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Añadir permit a una localización del proyecto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Permit
                    </label>
                    <select
                      value={newPermitSelection.permitId}
                      onChange={(e) =>
                        setNewPermitSelection((prev) => ({
                          ...prev,
                          permitId: e.target.value
                        }))
                      }
                      className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
                    >
                      <option value="">Selecciona un permit</option>
                      {availablePermits.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.administracion}
                          {p.area ? ` - ${p.area}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Localización del proyecto
                    </label>
                    <select
                      value={newPermitSelection.locationId}
                      onChange={(e) =>
                        setNewPermitSelection((prev) => ({
                          ...prev,
                          locationId: e.target.value
                        }))
                      }
                      className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
                    >
                      <option value="">Selecciona una localización</option>
                      {proyecto.Locations?.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateProjectPermit}
                      disabled={isCreatingPermit}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-dark-blue text-white hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingPermit ? 'Añadiendo...' : 'Añadir permit'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Puedes añadir el mismo permit varias veces, asignándolo a diferentes localizaciones.
                </p>
              </div>

              {loadingPermits ? (
                <p className="text-gray-500 text-sm">Cargando permits del proyecto...</p>
              ) : projectPermits.length === 0 ? (
                <p className="text-gray-500 italic">
                  No hay permits asignados todavía a este proyecto.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectPermits.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {assignment.Permit?.administracion || 'Permit'}
                          </p>
                          {assignment.Permit?.categoria && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                              {assignment.Permit.categoria}
                            </span>
                          )}
                        </div>
                        {assignment.Permit?.area && (
                          <p className="text-xs text-gray-500 mb-1">
                            {assignment.Permit.area}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Localización:</span>{' '}
                          {assignment.Location?.nombre || '—'}
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-700">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!assignment.solicitado}
                              onChange={(e) =>
                                handleTogglePermitStatus(
                                  assignment.id,
                                  'solicitado',
                                  e.target.checked
                                )
                              }
                            />
                            <span>Solicitado</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!assignment.pendienteRespuesta}
                              onChange={(e) =>
                                handleTogglePermitStatus(
                                  assignment.id,
                                  'pendienteRespuesta',
                                  e.target.checked
                                )
                              }
                            />
                            <span>Pendiente respuesta</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!assignment.recibido}
                              onChange={(e) =>
                                handleTogglePermitStatus(
                                  assignment.id,
                                  'recibido',
                                  e.target.checked
                                )
                              }
                            />
                            <span>Recibido</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!assignment.pagado}
                              onChange={(e) =>
                                handleTogglePermitStatus(
                                  assignment.id,
                                  'pagado',
                                  e.target.checked
                                )
                              }
                            />
                            <span>Pagado</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!assignment.resuelto}
                              onChange={(e) =>
                                handleTogglePermitStatus(
                                  assignment.id,
                                  'resuelto',
                                  e.target.checked
                                )
                              }
                            />
                            <span>Resuelto</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProjectPermit(assignment.id)}
                          className="self-start md:self-auto px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <label className="block text-gray-700 mb-2">Segundo logo (header documentos)</label>
                {formData.secondaryLogo ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(formData.secondaryLogo)}
                      alt="Secondary logo preview"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={removeSecondaryLogo}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : proyecto.secondaryLogoUrl ? (
                  <div className="relative">
                    <img
                      src={proyecto.secondaryLogoUrl}
                      alt="Current secondary logo"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-500 mb-2">
                      Segundo logo actual (deja vacío para mantener)
                    </p>
                    <div
                      {...getSecondaryLogoRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isSecondaryLogoDragActive
                          ? 'border-accent-green bg-accent-green/10'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getSecondaryLogoInputProps()} />
                      {isSecondaryLogoDragActive ? (
                        <p className="text-accent-green text-sm">Suelta el segundo logo aquí...</p>
                      ) : (
                        <p className="text-gray-600 text-sm">
                          Arrastra nuevo segundo logo o haz clic para seleccionar
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    {...getSecondaryLogoRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isSecondaryLogoDragActive
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getSecondaryLogoInputProps()} />
                    {isSecondaryLogoDragActive ? (
                      <p className="text-accent-green">Suelta el segundo logo aquí...</p>
                    ) : (
                      <p className="text-gray-600">
                        Arrastra el segundo logo aquí o haz clic para seleccionar
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
                <label className="block text-gray-700 mb-2">Location Manager Teléfono</label>
                <input
                  type="text"
                  value={formData.locationManagerPhone}
                  onChange={(e) => setFormData({ ...formData, locationManagerPhone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location Manager Email</label>
                <input
                  type="email"
                  value={formData.locationManagerEmail}
                  onChange={(e) => setFormData({ ...formData, locationManagerEmail: e.target.value })}
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
                <label className="block text-gray-700 mb-2">Location Coordinator Teléfono</label>
                <input
                  type="text"
                  value={formData.locationCoordinatorPhone}
                  onChange={(e) => setFormData({ ...formData, locationCoordinatorPhone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location Coordinator Email</label>
                <input
                  type="email"
                  value={formData.locationCoordinatorEmail}
                  onChange={(e) => setFormData({ ...formData, locationCoordinatorEmail: e.target.value })}
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
                <label className="block text-gray-700 mb-2">Fecha de Inicio (Calendario)</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Se mostrará en el calendario si está definida</p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Fecha de Fin (Calendario)</label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  min={formData.fechaInicio}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Opcional: deja vacío para evento de un solo día</p>
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

