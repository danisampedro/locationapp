import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://locationapp-backend.onrender.com/api'

export default function LocationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocation()
  }, [id])

  const loadLocation = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations/${id}`)
      const loc = {
        ...response.data,
        imagenes: Array.isArray(response.data.imagenes) 
          ? response.data.imagenes 
          : typeof response.data.imagenes === 'string' 
            ? JSON.parse(response.data.imagenes) 
            : []
      }
      setLocation(loc)
      setLoading(false)
    } catch (error) {
      console.error('Error cargando location:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando...</div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Location no encontrada</div>
      </div>
    )
  }

  const imagenes = Array.isArray(location.imagenes) 
    ? location.imagenes 
    : typeof location.imagenes === 'string' 
      ? JSON.parse(location.imagenes) 
      : []

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/locations')}
          className="text-gray-600 hover:text-gray-800 text-xl"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{location.nombre}</h1>
      </div>

      {imagenes.length > 0 && (
        <div className="mb-6">
          {imagenes.length >= 2 ? (
            <div className="grid grid-cols-2 gap-4">
              {imagenes.slice(0, 2).map((img, idx) => (
                <div key={idx} className="w-full aspect-video rounded-lg overflow-hidden">
                  <img
                    src={img}
                    alt={`${location.nombre} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg overflow-hidden">
              <img
                src={imagenes[0]}
                alt={location.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Dirección</h3>
          <p className="text-lg text-gray-800">{location.direccion}</p>
        </div>
        {location.descripcion && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Descripción</h3>
            <p className="text-gray-700 leading-relaxed">{location.descripcion}</p>
          </div>
        )}
      </div>
    </div>
  )
}
