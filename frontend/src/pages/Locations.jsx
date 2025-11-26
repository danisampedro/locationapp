import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [showModal, setShowModal] = useState(false)
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
      const response = await axios.get(`${API_URL}/locations`)
      setLocations(response.data)
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
    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('direccion', formData.direccion)
      data.append('descripcion', formData.descripcion)
      formData.imagenes.forEach((img) => {
        data.append('imagenes', img)
      })

      await axios.post(`${API_URL}/locations`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setShowModal(false)
      setFormData({ nombre: '', direccion: '', descripcion: '', imagenes: [] })
      loadLocations()
    } catch (error) {
      console.error('Error creando location:', error)
      alert('Error al crear la location')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Locations</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {location.imagenes && location.imagenes.length > 0 && (
              <div className="grid grid-cols-2 gap-1 h-48">
                {location.imagenes.slice(0, 2).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${location.nombre} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ))}
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{location.nombre}</h2>
              <p className="text-gray-600 mb-2">{location.direccion}</p>
              <p className="text-gray-500 text-sm">{location.descripcion}</p>
            </div>
          </div>
        ))}
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
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p className="text-blue-600">Suelta las imágenes aquí...</p>
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
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Crear
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

