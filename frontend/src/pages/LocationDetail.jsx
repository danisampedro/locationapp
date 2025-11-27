import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { API_URL } from '../config/axios.js'

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
      const response = await axios.get(`${API_URL}/locations/${id}`, { withCredentials: true })
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
        
        {/* Sección de Proyectos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Proyectos ({location.Proyectos?.length || 0})</h3>
          </div>
          {location.Proyectos && location.Proyectos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {location.Proyectos.map((proyecto) => (
                <div 
                  key={proyecto.id} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {proyecto.logoUrl && (
                      <img
                        src={proyecto.logoUrl}
                        alt={proyecto.nombre}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    )}
                    <h4 className="font-semibold text-gray-800">{proyecto.nombre}</h4>
                  </div>
                  {proyecto.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-2">{proyecto.descripcion}</p>
                  )}
                  {proyecto.projectDate && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(proyecto.projectDate).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Esta localización no está asignada a ningún proyecto</p>
          )}
        </div>

        {(location.googleMapsLink || location.contact || location.phoneNumber || location.mail) && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información de contacto</h3>
            {location.googleMapsLink && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Google Maps</p>
                  <a
                    href={location.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark-blue hover:text-dark-blue-light underline"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            )}
            {location.contact && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Contacto</p>
                  <p className="text-gray-800">{location.contact}</p>
                </div>
              </div>
            )}
            {location.phoneNumber && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</p>
                  <a href={`tel:${location.phoneNumber}`} className="text-gray-800 hover:text-dark-blue">
                    {location.phoneNumber}
                  </a>
                </div>
              </div>
            )}
            {location.mail && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                  <a href={`mailto:${location.mail}`} className="text-gray-800 hover:text-dark-blue">
                    {location.mail}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
