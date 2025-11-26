import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios, { API_URL } from '../config/axios.js'

export default function Locations() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    descripcion: '',
    googleMapsLink: '',
    contact: '',
    phoneNumber: '',
    mail: '',
    imagenes: []
  })
  const [editingLocation, setEditingLocation] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations`, { withCredentials: true })
      // Asegurar que imagenes sea siempre un array
      const locations = response.data.map(loc => ({
        ...loc,
        imagenes: Array.isArray(loc.imagenes) 
          ? loc.imagenes 
          : typeof loc.imagenes === 'string' 
            ? JSON.parse(loc.imagenes) 
            : []
      }))
      setLocations(locations)
    } catch (error) {
      console.error('Error cargando locations:', error)
    }
  }

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length + formData.imagenes.length <= 2) {
      setFormData({
        ...formData,
        imagenes: [...formData.imagenes, ...acceptedFiles]
      })
    } else {
      alert('Solo puedes subir máximo 2 imágenes')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 2
  })

  const removeImage = (index) => {
    setFormData({
      ...formData,
      imagenes: formData.imagenes.filter((_, i) => i !== index)
    })
  }

  const handleEdit = (location) => {
    const imagenes = Array.isArray(location.imagenes) 
      ? location.imagenes 
      : typeof location.imagenes === 'string' 
        ? JSON.parse(location.imagenes) 
        : []
    
    setEditingLocation(location)
    setFormData({
      nombre: location.nombre || '',
      direccion: location.direccion || '',
      descripcion: location.descripcion || '',
      googleMapsLink: location.googleMapsLink || '',
      contact: location.contact || '',
      phoneNumber: location.phoneNumber || '',
      mail: location.mail || '',
      imagenes: []
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('direccion', formData.direccion)
      data.append('descripcion', formData.descripcion)
      data.append('googleMapsLink', formData.googleMapsLink)
      data.append('contact', formData.contact)
      data.append('phoneNumber', formData.phoneNumber)
      data.append('mail', formData.mail)
      formData.imagenes.forEach((img) => {
        data.append('imagenes', img)
      })

      const response = await axios.put(
        `${API_URL}/locations/${editingLocation.id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          withCredentials: true
        }
      )

      if (response.status === 200) {
        setShowEditModal(false)
        setEditingLocation(null)
        setFormData({ nombre: '', direccion: '', descripcion: '', googleMapsLink: '', contact: '', phoneNumber: '', mail: '', imagenes: [] })
        await loadLocations()
      }
    } catch (error) {
      console.error('Error actualizando location:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al actualizar la location'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (locationId, locationName) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la location "${locationName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await axios.delete(`${API_URL}/locations/${locationId}`, { withCredentials: true })
      await loadLocations()
    } catch (error) {
      console.error('Error eliminando location:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al eliminar la location'}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('handleSubmit llamado', formData)
    
    setIsSubmitting(true)
    
    try {
      // Primero, intentar "despertar" el backend con una petición simple
      try {
        await axios.get(`${API_URL.replace('/api', '')}/api/health`, { timeout: 10000 })
      } catch (wakeError) {
        console.log('Backend puede estar durmiendo, continuando...')
      }

      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('direccion', formData.direccion)
      data.append('descripcion', formData.descripcion)
      data.append('googleMapsLink', formData.googleMapsLink)
      data.append('contact', formData.contact)
      data.append('phoneNumber', formData.phoneNumber)
      data.append('mail', formData.mail)
      formData.imagenes.forEach((img) => {
        data.append('imagenes', img)
      })

      console.log('Enviando petición a:', `${API_URL}/locations`)
      console.log('FormData:', {
        nombre: formData.nombre,
        direccion: formData.direccion,
        descripcion: formData.descripcion,
        imagenesCount: formData.imagenes.length
      })
      
      const response = await axios.post(
        `${API_URL}/locations`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000, // 120 segundos (2 minutos) para dar tiempo al backend de despertar y procesar
          withCredentials: true
        }
      )
      
      console.log('Respuesta recibida:', response)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      
      if (response.status === 201 || response.status === 200) {
        console.log('Location creada exitosamente:', response.data)
        setShowModal(false)
        setFormData({ nombre: '', direccion: '', descripcion: '', googleMapsLink: '', contact: '', phoneNumber: '', mail: '', imagenes: [] })
        await loadLocations()
        console.log('Locations recargadas')
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (error) {
      console.error('Error creando location:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      
      if (error.code === 'ECONNABORTED') {
        alert('Error: La petición tardó demasiado. El backend puede estar "durmiendo" (plan gratuito de Render). Por favor, espera unos segundos y vuelve a intentar. La primera petición puede tardar hasta 2 minutos.')
      } else if (error.response) {
        const errorMessage = error.response?.data?.error || error.message || 'Error al crear la location'
        alert(`Error: ${errorMessage}`)
      } else if (error.request) {
        alert('Error: No se recibió respuesta del servidor. El backend puede estar "durmiendo". Por favor, espera unos segundos y vuelve a intentar.')
      } else {
        alert(`Error: ${error.message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Locations</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona todas tus localizaciones de producción</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setFormData({ nombre: '', direccion: '', descripcion: '', googleMapsLink: '', contact: '', phoneNumber: '', mail: '', imagenes: [] })
          }}
          className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay locations aún</h3>
          <p className="text-gray-500 mb-6">Crea tu primera location para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Crear primera location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => {
            const imagenes = Array.isArray(location.imagenes) 
              ? location.imagenes 
              : typeof location.imagenes === 'string' 
                ? JSON.parse(location.imagenes) 
                : []
            
            return (
              <div 
                key={location.id} 
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-shadow border border-gray-100 hover:border-accent-green/40"
              >
                {imagenes.length > 0 && (
                  <div 
                    className="w-full aspect-video overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/locations/${location.id}`)}
                  >
                    <img
                      src={imagenes[0]}
                      alt={location.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 
                      className="text-lg font-semibold text-gray-900 truncate flex-1 cursor-pointer"
                      onClick={() => navigate(`/locations/${location.id}`)}
                    >
                      {location.nombre}
                    </h2>
                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-1.5 text-gray-600 hover:text-dark-blue hover:bg-gray-100 rounded transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(location.id, location.nombre)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {location.direccion && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-semibold text-gray-700">📍</span>
                      <span className="truncate">{location.direccion}</span>
                    </p>
                  )}
                  {location.contact && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">Contacto: </span>
                      {location.contact}
                    </p>
                  )}
                  {location.phoneNumber && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{location.phoneNumber}</span>
                    </p>
                  )}
                  {location.mail && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{location.mail}</span>
                    </p>
                  )}
                  {location.googleMapsLink && (
                    <a
                      href={location.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-dark-blue hover:text-dark-blue-light flex items-center gap-1 truncate"
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="truncate">Ver en Google Maps</span>
                    </a>
                  )}
                  {location.descripcion && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {location.descripcion}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Nueva Location</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Link Google Maps</label>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Contacto</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="+34 123 456 789"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.mail}
                  onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="contacto@ejemplo.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Imágenes (máximo 2)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p className="text-accent-green">Suelta las imágenes aquí...</p>
                  ) : (
                    <p className="text-gray-600">
                      Arrastra imágenes aquí o haz clic para seleccionar
                    </p>
                  )}
                </div>
                {formData.imagenes.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {formData.imagenes.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  onClick={(e) => {
                    console.log('Botón Crear clickeado')
                    e.preventDefault()
                    handleSubmit(e)
                  }}
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
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

      {showEditModal && editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowEditModal(false)
          setEditingLocation(null)
          setFormData({ nombre: '', direccion: '', descripcion: '', googleMapsLink: '', contact: '', phoneNumber: '', mail: '', imagenes: [] })
        }}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Editar Location</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Link Google Maps</label>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Contacto</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="+34 123 456 789"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.mail}
                  onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="contacto@ejemplo.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Imágenes (máximo 2)</label>
                <p className="text-xs text-gray-500 mb-2">Las imágenes actuales se mantendrán. Sube nuevas para reemplazarlas.</p>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p className="text-accent-green">Suelta las imágenes aquí...</p>
                  ) : (
                    <p className="text-gray-600">
                      Arrastra imágenes aquí o haz clic para seleccionar
                    </p>
                  )}
                </div>
                {formData.imagenes.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {formData.imagenes.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingLocation(null)
                    setFormData({ nombre: '', direccion: '', descripcion: '', googleMapsLink: '', contact: '', phoneNumber: '', mail: '', imagenes: [] })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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

