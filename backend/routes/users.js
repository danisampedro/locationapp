import express from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models/index.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Obtener todos los usuarios (solo admin)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'createdAt', 'updatedAt']
    })
    res.json(users)
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    res.status(500).json({ error: 'Error interno en el servidor' })
  }
})

// Crear usuario (solo admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
    }

    const existing = await User.findOne({ where: { username } })
    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user'
    })

    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role
    })
  } catch (error) {
    console.error('Error creando usuario:', error)
    res.status(500).json({ error: 'Error interno en el servidor' })
  }
})

export default router


