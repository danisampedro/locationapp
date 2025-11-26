import express from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models/index.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 POST /auth/login - Iniciando login')
    console.log('🔑 Body recibido:', { username: req.body.username, password: '***' })
    console.log('🔑 Origin:', req.headers.origin)
    console.log('🔑 Referer:', req.headers.referer)
    
    const { username, password } = req.body

    if (!username || !password) {
      console.log('❌ Login fallido - Faltan credenciales')
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
    }

    console.log('🔍 Buscando usuario en BD:', username)
    const user = await User.findOne({ where: { username } })
    
    if (!user) {
      console.log('❌ Login fallido - Usuario no encontrado:', username)
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    console.log('✅ Usuario encontrado, verificando contraseña...')
    const isValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValid) {
      console.log('❌ Login fallido - Contraseña incorrecta para:', username)
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    console.log('✅ Contraseña correcta, generando token...')
    const token = generateToken(user)
    console.log('✅ Token generado exitosamente')

    // Intentar establecer cookie (por si funciona)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // También devolver el token en el body para que el frontend lo guarde en localStorage
    const responseData = {
      id: user.id,
      username: user.username,
      role: user.role,
      token: token  // Enviar token en la respuesta para localStorage
    }
    console.log('✅ Login exitoso, enviando respuesta con token')
    res.json(responseData)
  } catch (error) {
    console.error('❌ Error en /auth/login:', error.message)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Error interno en el servidor',
      message: error.message
    })
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


