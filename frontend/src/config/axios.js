import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://locationapp-backend.onrender.com/api'

// Configurar axios por defecto
axios.defaults.withCredentials = true

// Interceptor de request para asegurar withCredentials en todas las peticiones
axios.interceptors.request.use(
  (config) => {
    // Asegurar que withCredentials siempre esté activo
    config.withCredentials = true
    
    // Si la URL no es absoluta, añadir el baseURL
    if (!config.url.startsWith('http')) {
      config.url = `${API_URL}${config.url.startsWith('/') ? '' : '/'}${config.url}`
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
    }
    return Promise.reject(error)
  }
)

export default axios
export { API_URL }

