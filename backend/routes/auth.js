import express from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models/index.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
    }

    const user = await User.findOne({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = generateToken(user)

    // Cookie siempre preparada para uso cross-site (frontend en otro dominio)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,          // Render sirve siempre sobre HTTPS
      sameSite: 'none',      // Necesario para que viaje entre dominios distintos
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    })
  } catch (error) {
    console.error('Error en /auth/login:', error)
    res.status(500).json({ error: 'Error interno en el servidor' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })
  res.json({ message: 'Sesión cerrada' })
})

// Usuario actual
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user)
})

export default router


