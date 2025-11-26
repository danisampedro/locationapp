import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import sequelize from './config/database.js'
import { User } from './models/index.js'
import './models/index.js' // Inicializar modelos y relaciones
import proyectoRoutes from './routes/proyectos.js'
import locationRoutes from './routes/locations.js'
import crewRoutes from './routes/crew.js'
import vendorRoutes from './routes/vendors.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import { authMiddleware } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://thelocationapp.eu',
    'https://www.thelocationapp.eu'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Rutas públicas de autenticación
app.use('/api/auth', authRoutes)

// Rutas protegidas
app.use('/api/proyectos', authMiddleware, proyectoRoutes)
app.use('/api/locations', authMiddleware, locationRoutes)
app.use('/api/crew', authMiddleware, crewRoutes)
app.use('/api/vendors', authMiddleware, vendorRoutes)
app.use('/api/users', userRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Crear usuario admin inicial si no existe
const seedAdminUser = async () => {
  const adminUsername = process.env.INIT_ADMIN_USERNAME || 'danisampedro'
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || '76499486'

  const existing = await User.findOne({ where: { username: adminUsername } })
  if (existing) {
    return
  }

  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.default.hash(adminPassword, 10)

  await User.create({
    username: adminUsername,
    passwordHash,
    role: 'admin'
  })

  console.log(`✅ Usuario admin inicial creado: ${adminUsername}`)
}

// Connect to MySQL
const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to MySQL database')
    
    // Sync models (crea las tablas si no existen)
    await sequelize.sync({ alter: false })
    await seedAdminUser()
    console.log('✅ Database models synchronized')
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Error connecting to database:', error)
    process.exit(1)
  }
}

connectDB()

export default app

