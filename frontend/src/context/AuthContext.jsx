import { createContext, useContext, useEffect, useState } from 'react'
import axios, { API_URL } from '../config/axios.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, { withCredentials: true })
        setUser(res.data)
      } catch {
        setUser(null)
        // Limpiar token si no es válido
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [])

  const login = async (username, password) => {
    const res = await axios.post(
      `${API_URL}/auth/login`,
      { username, password },
      { withCredentials: true }
    )
    // Guardar token en localStorage
    if (res.data.token) {
      localStorage.setItem('authToken', res.data.token)
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


