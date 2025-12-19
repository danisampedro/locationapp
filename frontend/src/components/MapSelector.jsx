import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import html2canvas from 'html2canvas'

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Componente para actualizar el centro del mapa
function MapUpdater({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function MapSelector({ onMapCapture, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [center, setCenter] = useState([40.4168, -3.7038]) // Madrid por defecto
  const [zoom, setZoom] = useState(15)
  const [mapSize, setMapSize] = useState({ width: 1200, height: 800 })
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Buscar ubicación usando Nominatim (OpenStreetMap geocoding, gratuito)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'LocationApp/1.0'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        setCenter([parseFloat(result.lat), parseFloat(result.lon)])
        setZoom(16)
      } else {
        alert('Ubicación no encontrada')
      }
    } catch (error) {
      console.error('Error buscando ubicación:', error)
      alert('Error al buscar la ubicación')
    }
  }

  // Capturar el mapa como imagen
  const handleCaptureMap = async () => {
    if (!mapReady || !mapRef.current) {
      alert('Espera a que el mapa termine de cargar')
      return
    }

    const mapElement = mapContainerRef.current
    if (!mapElement) return

    // Esperar a que el mapa termine de cargar los tiles
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const leafletContainer = mapElement.querySelector('.leaflet-container')
      if (!leafletContainer) {
        alert('Error: No se pudo encontrar el contenedor del mapa')
        return
      }

      // Ajustar tamaño del contenedor temporalmente para la captura
      const originalWidth = leafletContainer.style.width
      const originalHeight = leafletContainer.style.height
      leafletContainer.style.width = `${mapSize.width}px`
      leafletContainer.style.height = `${mapSize.height}px`
      
      if (mapRef.current) {
        mapRef.current.invalidateSize()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const canvas = await html2canvas(leafletContainer, {
        useCORS: true,
        allowTaint: false,
        width: mapSize.width,
        height: mapSize.height,
        scale: 1,
        logging: false,
        backgroundColor: '#f5f5f5',
      })

      // Restaurar tamaño original
      leafletContainer.style.width = originalWidth
      leafletContainer.style.height = originalHeight
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }

      // Convertir canvas a imagen
      const img = new window.Image()
      img.src = canvas.toDataURL('image/png')
      img.onload = () => {
        onMapCapture(img, {
          width: canvas.width,
          height: canvas.height,
          center: center,
          zoom: zoom
        })
        onClose()
      }
    } catch (error) {
      console.error('Error capturando mapa:', error)
      alert('Error al capturar el mapa. Intenta de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Cargar Mapa desde OpenStreetMap</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Búsqueda */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar ubicación (ej: Madrid, España)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
          />
          <button
            onClick={handleSearch}
            className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Controles de tamaño */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancho (px)
            </label>
            <input
              type="number"
              value={mapSize.width}
              onChange={(e) => setMapSize({ ...mapSize, width: parseInt(e.target.value) || 1200 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
              min="400"
              max="4000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alto (px)
            </label>
            <input
              type="number"
              value={mapSize.height}
              onChange={(e) => setMapSize({ ...mapSize, height: parseInt(e.target.value) || 800 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
              min="400"
              max="4000"
            />
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 border rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance
                setMapReady(true)
              }}
              scrollWheelZoom={true}
            >
              <MapUpdater center={center} zoom={zoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </MapContainer>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCaptureMap}
            disabled={!mapReady}
            className={`flex-1 px-6 py-2 rounded-lg transition-colors ${
              mapReady
                ? 'bg-accent-green text-white hover:bg-accent-green-dark'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {mapReady ? 'Usar este Mapa' : 'Cargando mapa...'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
