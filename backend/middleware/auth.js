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
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findByPk(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    }

    next()
  } catch (error) {
    console.error('Error en authMiddleware:', error)
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' })
  }
  next()
}


