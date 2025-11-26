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
    imagenes: []
  })

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
        setFormData({ nombre: '', direccion: '', descripcion: '', imagenes: [] })
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Locations</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
        >
          + Nueva Location
        </button>
      </div>

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
              onClick={() => navigate(`/locations/${location.id}`)}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-shadow border border-gray-100 hover:border-accent-green/40 cursor-pointer"
            >
              {imagenes.length > 0 && (
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    src={imagenes[0]}
                    alt={location.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 space-y-2">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{location.nombre}</h2>
                {location.direccion && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="font-semibold text-gray-700">📍</span>
                    <span className="truncate">{location.direccion}</span>
                  </p>
                )}
                {location.descripcion && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {location.descripcion}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nueva Location</h2>
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
                <label className="block text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
    </div>
  )
}

