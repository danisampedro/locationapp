import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://locationapp-backend.onrender.com/api'

const categories = ['Waterfalls', 'Mountains', 'Rocks', 'Wildlife', 'Beaches', 'Forests']

export default function Home() {
  const [locations, setLocations] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Waterfalls')
  const navigate = useNavigate()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations`)
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

  const handleLocationClick = (location) => {
    navigate(`/location/${location.id}`)
  }

  // Filtrar locations por categoría (por ahora mostramos todas)
  const filteredLocations = locations

  return (
    <div className="bg-white min-h-full pb-20">
      {/* Categories Section */}
      <div className="px-6 py-4 bg-white">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-dark-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Top Categories Section */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Top categories</h2>
          <button className="text-dark-blue font-medium text-sm">See all &gt;&gt;</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filteredLocations.slice(0, 5).map((location) => (
            <div
              key={location.id}
              onClick={() => handleLocationClick(location)}
              className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {location.imagenes && location.imagenes.length > 0 && (
                <div className="relative h-40">
                  <img
                    src={location.imagenes[0]}
                    alt={location.nombre}
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <span className="text-lg">🔖</span>
                  </button>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{location.nombre}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm text-gray-600">4.5</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{location.direccion}</p>
                <p className="text-dark-blue font-semibold">N200</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Categories Section */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Popular categories</h2>
          <button className="text-dark-blue font-medium text-sm">See all &gt;&gt;</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filteredLocations.slice(0, 5).map((location) => (
            <div
              key={location.id}
              onClick={() => handleLocationClick(location)}
              className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {location.imagenes && location.imagenes.length > 0 && (
                <div className="relative h-40">
                  <img
                    src={location.imagenes[0]}
                    alt={location.nombre}
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <span className="text-lg">🔖</span>
                  </button>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{location.nombre}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm text-gray-600">4.5</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{location.direccion}</p>
                <p className="text-dark-blue font-semibold">N200</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

