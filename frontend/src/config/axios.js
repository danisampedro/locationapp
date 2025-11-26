import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://locationapp-backend.onrender.com/api'

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
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Cookie no enviada o token inválido')
      console.error('Request URL:', error.config?.url)
      console.error('withCredentials:', error.config?.withCredentials)
      console.error('Cookies disponibles:', document.cookie)
    }
    return Promise.reject(error)
  }
)

export default axios
export { API_URL }

