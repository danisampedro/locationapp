import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_env'

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const authMiddleware = async (req, res, next) => {
  try {
    // Permitir peticiones OPTIONS (preflight de CORS) sin autenticación
    if (req.method === 'OPTIONS') {
      return next()
    }

    // Logging detallado para diagnóstico
    console.log('🔐 authMiddleware - Método:', req.method)
    console.log('🔐 authMiddleware - Ruta:', req.path)
    console.log('🔐 authMiddleware - URL completa:', req.url)
    console.log('🔐 authMiddleware - Cookies recibidas:', JSON.stringify(req.cookies))
    console.log('🔐 authMiddleware - Headers cookie:', req.headers.cookie)
    console.log('🔐 authMiddleware - Headers authorization:', req.headers.authorization)
    console.log('🔐 authMiddleware - Origin:', req.headers.origin)
    console.log('🔐 authMiddleware - Referer:', req.headers.referer)

    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.log('❌ authMiddleware - No se encontró token')
      console.log('❌ authMiddleware - req.cookies:', req.cookies)
      console.log('❌ authMiddleware - req.headers.cookie:', req.headers.cookie)
      return res.status(401).json({ error: 'No autorizado' })
    }

    console.log('✅ authMiddleware - Token encontrado:', token.substring(0, 20) + '...')

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findByPk(decoded.id)

    if (!user) {
      console.log('❌ authMiddleware - Usuario no encontrado en BD')
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    console.log('✅ authMiddleware - Usuario autenticado:', user.username)

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    }

    next()
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error.message)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' })
  }
  next()
}


