import axios from 'axios'

// URL del backend
// En desarrollo: usar variable de entorno o localhost
// En producción: usar URL hardcodeada para evitar problemas
const API_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : 'https://locationapp-backend.onrender.com/api'

// Log para debugging
console.log('🔧 API_URL configurada:', API_URL)
console.log('🔧 VITE_API_URL desde env:', import.meta.env.VITE_API_URL)
console.log('🔧 Modo:', import.meta.env.MODE)
console.log('🔧 Dev:', import.meta.env.DEV)
console.log('🔧 Production URL hardcoded:', !import.meta.env.DEV)

// Configurar axios por defecto - FORZAR withCredentials en TODAS las peticiones
axios.defaults.withCredentials = true

// Interceptor de request para añadir token en header Authorization
axios.interceptors.request.use(
  (config) => {
    // FORZAR withCredentials siempre (por si las cookies funcionan)
    config.withCredentials = true
    
    // Añadir token desde localStorage en el header Authorization
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Token añadido al header Authorization')
    } else {
      console.log('⚠️ No hay token en localStorage')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de response para logging de errores
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Logging detallado de errores
    if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('❌ Error de conexión al backend')
      console.error('URL intentada:', error.config?.url)
      console.error('API_URL configurada:', API_URL)
      console.error('VITE_API_URL desde env:', import.meta.env.VITE_API_URL)
      console.error('💡 Solución: Verifica que la URL del backend en frontend/.env sea correcta')
      console.error('💡 Ve a Render Dashboard y copia la URL real de tu servicio')
    } else if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Cookie no enviada o token inválido')
      console.error('Request URL:', error.config?.url)
      console.error('withCredentials:', error.config?.withCredentials)
      console.error('Cookies disponibles:', document.cookie)
    } else if (error.response) {
      console.error('❌ Error del servidor:', error.response.status, error.response.data)
    } else {
      console.error('❌ Error de red:', error.message)
    }
    return Promise.reject(error)
  }
)

export default axios
export { API_URL }

