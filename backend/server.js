import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sequelize from './config/database.js'
import './models/index.js' // Inicializar modelos y relaciones
import proyectoRoutes from './routes/proyectos.js'
import locationRoutes from './routes/locations.js'
import crewRoutes from './routes/crew.js'
import vendorRoutes from './routes/vendors.js'

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

// Routes
app.use('/api/proyectos', proyectoRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/crew', crewRoutes)
app.use('/api/vendors', vendorRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Connect to MySQL
const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to MySQL database')
    
    // Sync models (crea las tablas si no existen)
    await sequelize.sync({ alter: false })
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

