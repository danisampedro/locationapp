import { createContext, useContext, useEffect, useState } from 'react'
import axios, { API_URL } from '../config/axios.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('authToken')
        console.log('🔍 AuthContext - Verificando sesión, token en localStorage:', token ? 'Sí' : 'No')
        
        if (!token) {
          console.log('⚠️ AuthContext - No hay token, saltando verificación')
          setUser(null)
          setLoading(false)
          return
        }

        console.log('✅ AuthContext - Token encontrado, verificando con backend...')
        const res = await axios.get(`${API_URL}/auth/me`, { 
          withCredentials: true,
          timeout: 10000 // 10 segundos de timeout
        })
        console.log('✅ AuthContext - Sesión válida:', res.data)
        setUser(res.data)
      } catch (error) {
        console.log('❌ AuthContext - Sesión inválida o expirada:', error.response?.status || error.message)
        setUser(null)
        // Limpiar token si no es válido
        localStorage.removeItem('authToken')
      } finally {
        // Asegurar que siempre se establezca loading a false, incluso si hay un error
        console.log('✅ AuthContext - Finalizando verificación de sesión')
        setLoading(false)
      }
    }

    // Ejecutar inmediatamente
    fetchMe()
  }, [])

  const login = async (username, password) => {
    console.log('🔑 AuthContext - Iniciando login...')
    const res = await axios.post(
      `${API_URL}/auth/login`,
      { username, password },
      { withCredentials: true }
    )
    console.log('🔑 AuthContext - Respuesta del login:', res.data)
    
    // Guardar token en localStorage
    if (res.data.token) {
      localStorage.setItem('authToken', res.data.token)
      console.log('✅ AuthContext - Token guardado en localStorage')
    } else {
      console.error('❌ AuthContext - No se recibió token en la respuesta del login')
    }
    setUser({ id: res.data.id, username: res.data.username, role: res.data.role })
  }

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true })
    } finally {
      setUser(null)
      localStorage.removeItem('authToken')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)


