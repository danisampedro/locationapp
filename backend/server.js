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
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    version: 'v2.0-token-in-body',
    timestamp: new Date().toISOString()
  })
})

// Migración: Añadir columnas nuevas a la tabla locations
const migrateLocationTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable('locations')
    
    const newColumns = {
      googleMapsLink: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      contact: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      phoneNumber: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      mail: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' }
    }

    for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla locations...`)
        await queryInterface.addColumn('locations', columnName, {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        })
        console.log(`✅ Columna ${columnName} añadida exitosamente`)
      } else {
        console.log(`ℹ️  Columna ${columnName} ya existe`)
      }
    }
  } catch (error) {
    // Si la tabla no existe, se creará con sync
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.log('ℹ️  Tabla locations no existe aún, se creará con sync')
    } else {
      console.error('⚠️  Error en migración de locations:', error.message)
    }
  }
}

// Crear o actualizar usuario admin inicial
const seedAdminUser = async () => {
  const adminUsername = process.env.INIT_ADMIN_USERNAME || 'danisampedro'
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || '76499486'

  console.log(`🔧 Verificando/creando usuario admin:`)
  console.log(`   Username: ${adminUsername}`)
  console.log(`   Password: ${adminPassword} (${process.env.INIT_ADMIN_PASSWORD ? 'desde ENV' : 'por defecto'})`)
  
  const existing = await User.findOne({ where: { username: adminUsername } })
  
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.default.hash(adminPassword, 10)

  if (existing) {
    // Si existe, actualizar la contraseña para asegurar que es la correcta
    console.log(`🔄 Usuario ${adminUsername} ya existe, actualizando contraseña...`)
    await existing.update({
      passwordHash,
      role: 'admin' // Asegurar que es admin
    })
    console.log(`✅ Usuario admin actualizado: ${adminUsername} con contraseña: ${adminPassword}`)
  } else {
    // Si no existe, crearlo
    await User.create({
      username: adminUsername,
      passwordHash,
      role: 'admin'
    })
    console.log(`✅ Usuario admin inicial creado: ${adminUsername} con contraseña: ${adminPassword}`)
  }
}

// Connect to MySQL
const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to MySQL database')
    
    // Sync models (crea las tablas si no existen)
    await sequelize.sync({ alter: false })
    
    // Ejecutar migraciones para añadir columnas nuevas
    await migrateLocationTable()
    
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

