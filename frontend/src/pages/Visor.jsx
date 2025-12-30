import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMapEvents, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios, { API_URL } from '../config/axios.js'
import { useAuth } from '../context/AuthContext.jsx'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Coordenadas de Mallorca (centro)
const MALLORCA_CENTER = [39.5696, 2.6502]
const MALLORCA_ZOOM = 10

// Componente para detectar clicks en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng)
    }
  })
  return null
}

// Función para verificar si un punto está dentro de una geometría GeoJSON
const pointInGeometry = (point, geometry) => {
  if (!geometry || !geometry.type) return false

  const lat = point.lat
  const lng = point.lng

  if (geometry.type === 'Point') {
    const coords = geometry.coordinates
    return Math.abs(coords[1] - lat) < 0.0001 && Math.abs(coords[0] - lng) < 0.0001
  }

  if (geometry.type === 'Polygon') {
    return pointInPolygon([lng, lat], geometry.coordinates[0])
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(polygon => 
      pointInPolygon([lng, lat], polygon[0])
    )
  }

  if (geometry.type === 'FeatureCollection') {
    return geometry.features.some(feature => 
      pointInGeometry(point, feature.geometry)
    )
  }

  if (geometry.type === 'Feature') {
    return pointInGeometry(point, geometry.geometry)
  }

  return false
}

// Algoritmo ray casting para verificar si un punto está dentro de un polígono
const pointInPolygon = (point, polygon) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export default function Visor() {
  const { user } = useAuth()
  const [capas, setCapas] = useState([])
  const [capasActivas, setCapasActivas] = useState(new Set())
  const [consultaResultado, setConsultaResultado] = useState(null)
  const [puntoConsulta, setPuntoConsulta] = useState(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [nuevaCapa, setNuevaCapa] = useState({
    nombre: '',
    tipo: 'personalizada',
    fuente: '',
    fechaDatos: '',
    normativa: '',
    tipoPermiso: 'permitido',
    observaciones: '',
    color: '#3b82f6',
    opacidad: 0.5
  })
  const [archivoGeoJSON, setArchivoGeoJSON] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar capas al montar el componente
  useEffect(() => {
    loadCapas()
  }, [])

  const loadCapas = async () => {
    try {
      const response = await axios.get(`${API_URL}/visor/capas`, { withCredentials: true })
      setCapas(response.data)
      // Activar todas las capas por defecto
      setCapasActivas(new Set(response.data.map(c => c.id)))
    } catch (error) {
      console.error('Error cargando capas:', error)
      setError('Error al cargar las capas')
    }
  }

  const handleMapClick = async (latlng) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/visor/consulta`, {
        params: { lat: latlng.lat, lng: latlng.lng },
        withCredentials: true
      })

      // Filtrar capas que contienen el punto
      const capasContenedoras = response.data.capas.filter(capa => {
        if (!capa.geometria) return false
        return pointInGeometry(latlng, capa.geometria)
      })

      setPuntoConsulta(latlng)
      setConsultaResultado({
        coordenadas: latlng,
        capas: capasContenedoras
      })
    } catch (error) {
      console.error('Error en consulta:', error)
      setError('Error al realizar la consulta')
    } finally {
      setLoading(false)
    }
  }

  const toggleCapa = (capaId) => {
    const nuevas = new Set(capasActivas)
    if (nuevas.has(capaId)) {
      nuevas.delete(capaId)
    } else {
      nuevas.add(capaId)
    }
    setCapasActivas(nuevas)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setArchivoGeoJSON(file)
    }
  }

  const handleUploadCapa = async () => {
    if (!nuevaCapa.nombre || !archivoGeoJSON) {
      alert('Por favor completa el nombre y selecciona un archivo GeoJSON')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('archivo', archivoGeoJSON)
      formData.append('nombre', nuevaCapa.nombre)
      formData.append('tipo', nuevaCapa.tipo)
      formData.append('fuente', nuevaCapa.fuente)
      formData.append('fechaDatos', nuevaCapa.fechaDatos)
      formData.append('normativa', nuevaCapa.normativa)
      formData.append('tipoPermiso', nuevaCapa.tipoPermiso)
      formData.append('observaciones', nuevaCapa.observaciones)
      formData.append('color', nuevaCapa.color)
      formData.append('opacidad', nuevaCapa.opacidad.toString())

      console.log('Subiendo capa:', {
        nombre: nuevaCapa.nombre,
        archivo: archivoGeoJSON.name,
        tipo: archivoGeoJSON.type,
        size: archivoGeoJSON.size
      })

      const response = await axios.post(`${API_URL}/visor/admin/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        timeout: 120000 // 2 minutos para archivos grandes
      })

      console.log('Capa subida correctamente:', response.data)
      alert('Capa subida correctamente')
      setShowUploadModal(false)
      setNuevaCapa({
        nombre: '',
        tipo: 'personalizada',
        fuente: '',
        fechaDatos: '',
        normativa: '',
        tipoPermiso: 'permitido',
        observaciones: '',
        color: '#3b82f6',
        opacidad: 0.5
      })
      setArchivoGeoJSON(null)
      await loadCapas()
    } catch (error) {
      console.error('Error subiendo capa:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido al subir la capa'
      alert(`Error al subir la capa: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCapa = async (capaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta capa?')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/visor/admin/capas/${capaId}`, { withCredentials: true })
      alert('Capa eliminada correctamente')
      loadCapas()
    } catch (error) {
      console.error('Error eliminando capa:', error)
      alert('Error al eliminar la capa')
    }
  }

  const getPermisoColor = (tipoPermiso) => {
    switch (tipoPermiso) {
      case 'permitido':
        return '#10b981' // Verde
      case 'autorizacion_necesaria':
        return '#f59e0b' // Naranja
      case 'prohibido':
        return '#ef4444' // Rojo
      default:
        return '#3b82f6' // Azul
    }
  }

  const getPermisoLabel = (tipoPermiso) => {
    switch (tipoPermiso) {
      case 'permitido':
        return 'Permitido'
      case 'autorizacion_necesaria':
        return 'Autorización necesaria'
      case 'prohibido':
        return 'Prohibido'
      default:
        return 'Desconocido'
    }
  }

  // Renderizar capa GeoJSON
  const renderCapa = (capa) => {
    if (!capasActivas.has(capa.id) || !capa.geometria) return null

    const style = {
      fillColor: capa.color || '#3b82f6',
      fillOpacity: capa.opacidad || 0.5,
      color: capa.color || '#3b82f6',
      weight: 2,
      opacity: 0.8
    }

    const onEachFeature = (feature, layer) => {
      if (feature.properties) {
        const popupContent = `
          <div>
            <h3 class="font-bold">${capa.nombre}</h3>
            <p class="text-sm">Tipo: ${capa.tipo}</p>
            <p class="text-sm">Permiso: <span style="color: ${getPermisoColor(capa.tipoPermiso)}">${getPermisoLabel(capa.tipoPermiso)}</span></p>
            ${capa.normativa ? `<p class="text-sm">Normativa: ${capa.normativa}</p>` : ''}
          </div>
        `
        layer.bindPopup(popupContent)
      }
    }

    return (
      <GeoJSON
        key={capa.id}
        data={capa.geometria}
        style={style}
        onEachFeature={onEachFeature}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visor Cartográfico</h1>
          <p className="text-sm text-gray-500">Consulta de zonas y normativas en Mallorca</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            {showAdminPanel ? 'Ocultar Admin' : 'Panel Admin'}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel lateral izquierdo - Capas */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 mb-3">Capas Geográficas</h2>
            
            {capas.length === 0 ? (
              <p className="text-sm text-gray-500">No hay capas disponibles</p>
            ) : (
              <div className="space-y-2">
                {capas.map((capa) => (
                  <div
                    key={capa.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-accent-green transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={capasActivas.has(capa.id)}
                          onChange={() => toggleCapa(capa.id)}
                          className="w-4 h-4 text-dark-blue rounded focus:ring-dark-blue"
                        />
                        <span className="font-medium text-sm text-gray-800">{capa.nombre}</span>
                      </div>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteCapa(capa.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Eliminar capa"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Tipo: {capa.tipo}</div>
                      {capa.fuente && <div>Fuente: {capa.fuente}</div>}
                      <div>
                        Permiso:{' '}
                        <span style={{ color: getPermisoColor(capa.tipoPermiso) }}>
                          {getPermisoLabel(capa.tipoPermiso)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: capa.color || '#3b82f6', opacity: capa.opacidad || 0.5 }}
                      />
                      <span className="text-xs text-gray-500">Color de visualización</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Leyenda de Permisos</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                <span>Permitido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                <span>Autorización necesaria</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                <span>Prohibido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa central */}
        <div className="flex-1 relative" style={{ zIndex: 1 }}>
          <MapContainer
            center={MALLORCA_CENTER}
            zoom={MALLORCA_ZOOM}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Renderizar capas activas */}
            {capas.map(capa => renderCapa(capa))}

            {/* Marcador del punto de consulta */}
            {puntoConsulta && (
              <Marker position={[puntoConsulta.lat, puntoConsulta.lng]}>
                <Popup>
                  <div>
                    <strong>Coordenadas:</strong><br />
                    Lat: {puntoConsulta.lat.toFixed(6)}<br />
                    Lng: {puntoConsulta.lng.toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {loading && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm text-gray-600">Consultando...</p>
            </div>
          )}
        </div>

        {/* Panel lateral derecho - Resultados de consulta */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Consulta por Ubicación</h2>
            <p className="text-xs text-gray-500 mt-1">Haz clic en el mapa para consultar</p>
          </div>

          {consultaResultado ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Coordenadas</div>
                <div className="text-sm font-medium text-gray-800">
                  {consultaResultado.coordenadas.lat.toFixed(6)}, {consultaResultado.coordenadas.lng.toFixed(6)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">Zonas encontradas</div>
                {consultaResultado.capas.length === 0 ? (
                  <p className="text-sm text-gray-500">No se encontraron zonas en esta ubicación</p>
                ) : (
                  <div className="space-y-3">
                    {consultaResultado.capas.map((capa) => (
                      <div key={capa.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">{capa.nombre}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Tipo: {capa.tipo}</div>
                          {capa.fuente && <div>Fuente: {capa.fuente}</div>}
                          <div>
                            Permiso:{' '}
                            <span style={{ color: getPermisoColor(capa.tipoPermiso) }}>
                              {getPermisoLabel(capa.tipoPermiso)}
                            </span>
                          </div>
                          {capa.normativa && (
                            <div className="mt-2">
                              <div className="font-medium text-gray-700">Normativa:</div>
                              <div className="text-gray-600">{capa.normativa}</div>
                            </div>
                          )}
                          {capa.observaciones && (
                            <div className="mt-2">
                              <div className="font-medium text-gray-700">Observaciones:</div>
                              <div className="text-gray-600">{capa.observaciones}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 text-center">
                Haz clic en el mapa para consultar las zonas y normativas aplicables en esa ubicación.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Panel de administración */}
      {showAdminPanel && user?.role === 'admin' && (
        <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-96" style={{ zIndex: 1000 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Panel de Administración</h3>
            <button
              onClick={() => setShowAdminPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Subir Nueva Capa
          </button>
        </div>
      )}

      {/* Modal de subir capa */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
            <h3 className="text-xl font-bold mb-4">Subir Nueva Capa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la capa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nuevaCapa.nombre}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Ej: Municipios de Mallorca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de zona
                </label>
                <select
                  value={nuevaCapa.tipo}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, tipo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                >
                  <option value="municipio">Municipio</option>
                  <option value="zona_medioambiental">Zona Medioambiental</option>
                  <option value="zona_costera">Zona Costera</option>
                  <option value="personalizada">Personalizada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuente oficial
                </label>
                <input
                  type="text"
                  value={nuevaCapa.fuente}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, fuente: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Ej: IDEIB, IGN, Govern Balear"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de datos
                </label>
                <input
                  type="date"
                  value={nuevaCapa.fechaDatos}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, fechaDatos: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Normativa
                </label>
                <textarea
                  value={nuevaCapa.normativa}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, normativa: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="3"
                  placeholder="Normativa aplicable..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de permiso
                </label>
                <select
                  value={nuevaCapa.tipoPermiso}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, tipoPermiso: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                >
                  <option value="permitido">Permitido</option>
                  <option value="autorizacion_necesaria">Autorización necesaria</option>
                  <option value="prohibido">Prohibido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={nuevaCapa.observaciones}
                  onChange={(e) => setNuevaCapa({ ...nuevaCapa, observaciones: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="2"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={nuevaCapa.color}
                    onChange={(e) => setNuevaCapa({ ...nuevaCapa, color: e.target.value })}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opacidad
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={nuevaCapa.opacidad}
                    onChange={(e) => setNuevaCapa({ ...nuevaCapa, opacidad: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {Math.round(nuevaCapa.opacidad * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo GeoJSON <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileChange}
                  key={archivoGeoJSON ? 'file-selected' : 'no-file'}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                />
                {archivoGeoJSON && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Archivo seleccionado: {archivoGeoJSON.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Solo archivos GeoJSON (.geojson, .json)
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUploadCapa}
                disabled={loading}
                className="flex-1 bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Subiendo...' : 'Subir Capa'}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setNuevaCapa({
                    nombre: '',
                    tipo: 'personalizada',
                    fuente: '',
                    fechaDatos: '',
                    normativa: '',
                    tipoPermiso: 'permitido',
                    observaciones: '',
                    color: '#3b82f6',
                    opacidad: 0.5
                  })
                  setArchivoGeoJSON(null)
                }}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

