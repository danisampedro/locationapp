import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import sequelize from './config/database.js'
import { User } from './models/index.js'
import './models/index.js' // Inicializar modelos y relaciones
import ProyectoLocation from './models/ProyectoLocation.js' // Importar modelo para migración
import proyectoRoutes from './routes/proyectos.js'
import locationRoutes from './routes/locations.js'
import crewRoutes from './routes/crew.js'
import vendorRoutes from './routes/vendors.js'
import permitRoutes from './routes/permits.js'
import recceDocumentRoutes from './routes/recceDocuments.js'
import contractDocumentRoutes from './routes/contractDocuments.js'
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
app.use('/api/permits', authMiddleware, permitRoutes)
app.use('/api/recce-documents', authMiddleware, recceDocumentRoutes)
app.use('/api/contract-documents', authMiddleware, contractDocumentRoutes)
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
      mail: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      tipo: { type: 'VARCHAR(50)', allowNull: true, defaultValue: 'private' }
    }

    for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla locations...`)
        await queryInterface.addColumn('locations', columnName, {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: columnName === 'tipo' ? 'private' : ''
        })
        console.log(`✅ Columna ${columnName} añadida exitosamente`)
        
        // Si es la columna tipo, actualizar todas las locations existentes
        if (columnName === 'tipo') {
          console.log(`🔄 Actualizando locations existentes con tipo 'private'...`)
          await sequelize.query(`UPDATE locations SET tipo = 'private' WHERE tipo IS NULL OR tipo = ''`)
          console.log(`✅ Locations existentes actualizadas`)
        }
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

// Migración: Crear o actualizar tabla ProyectoLocations
const migrateProyectoLocationsTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    
    // Verificar si la tabla existe
    const tableExists = await queryInterface.tableExists('ProyectoLocations')
    
    if (tableExists) {
      // Si existe, verificar y añadir columnas si no existen
      const tableDescription = await queryInterface.describeTable('ProyectoLocations')
      
      const newColumns = {
        setName: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
        basecampLink: { type: 'VARCHAR(500)', allowNull: true, defaultValue: '' },
        distanceLocBase: { type: 'VARCHAR(50)', allowNull: true, defaultValue: '' }
      }

      for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
        if (!tableDescription[columnName]) {
          console.log(`🔄 Añadiendo columna ${columnName} a la tabla ProyectoLocations...`)
          await queryInterface.addColumn('ProyectoLocations', columnName, {
            type: sequelize.Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
          })
          console.log(`✅ Columna ${columnName} añadida exitosamente`)
        } else {
          console.log(`ℹ️  Columna ${columnName} ya existe`)
        }
      }
    } else {
      // Si no existe, se creará con sync
      console.log('ℹ️  Tabla ProyectoLocations no existe aún, se creará con sync')
    }
  } catch (error) {
    console.error('⚠️  Error en migración de ProyectoLocations:', error.message)
  }
}

// Migración: Añadir columnas nuevas a la tabla ProyectoCrew
const migrateProyectoCrewTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()

    const tableExists = await queryInterface.tableExists('ProyectoCrew')
    if (!tableExists) {
      console.log('ℹ️  Tabla ProyectoCrew no existe aún, se creará con sync')
      return
    }

    const tableDescription = await queryInterface.describeTable('ProyectoCrew')

    const newColumns = {
      startDate: { type: 'DATE', allowNull: true, defaultValue: null },
      endDate: { type: 'DATE', allowNull: true, defaultValue: null },
      weeklyRate: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      carAllowance: { type: 'BOOLEAN', allowNull: true, defaultValue: false },
      boxRental: { type: 'BOOLEAN', allowNull: true, defaultValue: false }
    }

    for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla ProyectoCrew...`)

        if (columnName === 'startDate' || columnName === 'endDate') {
          await queryInterface.addColumn('ProyectoCrew', columnName, {
            type: sequelize.Sequelize.DATE,
            allowNull: true,
            defaultValue: null
          })
        } else if (columnName === 'carAllowance' || columnName === 'boxRental') {
          await queryInterface.addColumn('ProyectoCrew', columnName, {
            type: sequelize.Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
          })
        } else {
          await queryInterface.addColumn('ProyectoCrew', columnName, {
            type: sequelize.Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
          })
        }

        console.log(`✅ Columna ${columnName} añadida exitosamente`)
      } else {
        console.log(`ℹ️  Columna ${columnName} ya existe en ProyectoCrew`)
      }
    }
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.log('ℹ️  Tabla ProyectoCrew no existe aún, se creará con sync')
    } else {
      console.error('⚠️  Error en migración de ProyectoCrew:', error.message)
    }
  }
}

// Migración: Añadir columnas nuevas a la tabla proyectos
const migrateProyectoTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable('proyectos')
    
    const newColumns = {
      assistantLocationManager: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      basecampManager: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      secondaryLogoUrl: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' }
    }

    for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla proyectos...`)
        await queryInterface.addColumn('proyectos', columnName, {
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
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.log('ℹ️  Tabla proyectos no existe aún, se creará con sync')
    } else {
      console.error('⚠️  Error en migración de proyectos:', error.message)
    }
  }
}

// Migración: Crear tabla permits si no existe
const migratePermitsTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableExists = await queryInterface.tableExists('permits')

    if (!tableExists) {
      console.log('ℹ️  Tabla permits no existe, creando...')
      await queryInterface.createTable('permits', {
        id: {
          type: sequelize.Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        administracion: {
          type: sequelize.Sequelize.STRING,
          allowNull: false
        },
        area: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        contacto: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        telefono: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        correo: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        notas: {
          type: sequelize.Sequelize.TEXT,
          allowNull: true
        },
        categoria: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        createdAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      })
      console.log('✅ Tabla permits creada')
    } else {
      console.log('ℹ️  Tabla permits ya existe')
    }
  } catch (error) {
    console.error('⚠️  Error en migración de permits:', error.message)
  }
}

// Migración: Crear tabla recce_documents si no existe
const migrateRecceDocumentsTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableExists = await queryInterface.tableExists('recce_documents')

    if (!tableExists) {
      console.log('ℹ️  Tabla recce_documents no existe, creando...')
      await queryInterface.createTable('recce_documents', {
        id: {
          type: sequelize.Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        proyectoId: {
          type: sequelize.Sequelize.INTEGER,
          allowNull: false
        },
        nombre: {
          type: sequelize.Sequelize.STRING,
          allowNull: false
        },
        documentTitle: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: 'LOCATION RECCE'
        },
        recceSchedule: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        meetingPoint: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        meetingPointLink: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        locationManagerName: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        locationManagerPhone: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        locationManagerEmail: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        sunriseTime: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        sunsetTime: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        weatherForecast: {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        },
        attendants: {
          type: sequelize.Sequelize.JSON,
          allowNull: true
        },
        legs: {
          type: sequelize.Sequelize.JSON,
          allowNull: true
        },
        freeEntries: {
          type: sequelize.Sequelize.JSON,
          allowNull: true
        },
        createdAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      })
      console.log('✅ Tabla recce_documents creada')
    } else {
      console.log('ℹ️  Tabla recce_documents ya existe')
    }
  } catch (error) {
    console.error('⚠️  Error en migración de recce_documents:', error.message)
  }
}

// Migración: Añadir columnas nuevas a la tabla crew
const migrateCrewTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable('crew')
    
    const newColumns = {
      fotoUrl: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      dni: { type: 'VARCHAR(50)', allowNull: true, defaultValue: '' },
      fechaNacimiento: { type: 'DATE', allowNull: true, defaultValue: null },
      carnetConducir: { type: 'BOOLEAN', allowNull: true, defaultValue: false }
    }

    for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla crew...`)
        
        if (columnName === 'fechaNacimiento') {
          await queryInterface.addColumn('crew', columnName, {
            type: sequelize.Sequelize.DATE,
            allowNull: true,
            defaultValue: null
          })
        } else if (columnName === 'carnetConducir') {
          await queryInterface.addColumn('crew', columnName, {
            type: sequelize.Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
          })
        } else {
          await queryInterface.addColumn('crew', columnName, {
            type: sequelize.Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
          })
        }
        
        console.log(`✅ Columna ${columnName} añadida exitosamente`)
      } else {
        console.log(`ℹ️  Columna ${columnName} ya existe`)
      }
    }
  } catch (error) {
    // Si la tabla no existe, se creará con sync
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.log('ℹ️  Tabla crew no existe aún, se creará con sync')
    } else {
      console.error('⚠️  Error en migración de crew:', error.message)
    }
  }
}

// Migración: Añadir columnas nuevas a la tabla vendors
const migrateVendorTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable('vendors')

    const newColumns = {
      logoUrl: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      cif: { type: 'VARCHAR(100)', allowNull: true, defaultValue: '' },
      direccion: { type: 'VARCHAR(255)', allowNull: true, defaultValue: '' },
      telefonoFijo: { type: 'VARCHAR(50)', allowNull: true, defaultValue: '' },
      telefonoMovil: { type: 'VARCHAR(50)', allowNull: true, defaultValue: '' }
    }

    for (const [columnName] of Object.entries(newColumns)) {
      if (!tableDescription[columnName]) {
        console.log(`🔄 Añadiendo columna ${columnName} a la tabla vendors...`)
        await queryInterface.addColumn('vendors', columnName, {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: ''
        })
        console.log(`✅ Columna ${columnName} añadida exitosamente`)
      } else {
        console.log(`ℹ️  Columna ${columnName} ya existe en vendors`)
      }
    }
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.log('ℹ️  Tabla vendors no existe aún, se creará con sync')
    } else {
      console.error('⚠️  Error en migración de vendors:', error.message)
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
    await migrateCrewTable()
    await migrateProyectoLocationsTable()
    await migrateProyectoTable()
    await migrateProyectoCrewTable()
    await migrateVendorTable()
    await migratePermitsTable()
    await migrateRecceDocumentsTable()
    await migrateContractDocumentsTable()
    
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

