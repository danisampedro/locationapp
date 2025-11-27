import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Proyecto from '../models/Proyecto.js'
import Location from '../models/Location.js'
import Crew from '../models/Crew.js'
import Vendor from '../models/Vendor.js'
import ProyectoLocation from '../models/ProyectoLocation.js'

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'locationapp/proyectos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
})

const upload = multer({ storage })

// GET all proyectos
router.get('/', async (req, res) => {
  try {
    // Cargar proyectos sin el through model primero para evitar errores
    const proyectos = await Proyecto.findAll({
      include: [
        { model: Location, as: 'Locations', required: false },
        { model: Crew, as: 'Crews', required: false },
        { model: Vendor, as: 'Vendors', required: false }
      ]
    })
    
    // Ahora cargar los datos de ProyectoLocation por separado si es necesario
    const proyectoIds = proyectos.map(p => p.id)
    let proyectoLocationsMap = {}
    
    if (proyectoIds.length > 0) {
      try {
        const proyectoLocations = await ProyectoLocation.findAll({
          where: {
            proyectoId: proyectoIds
          }
        })
        
        // Crear un mapa para acceso rápido: proyectoId_locationId -> datos
        proyectoLocations.forEach(pl => {
          const key = `${pl.proyectoId}_${pl.locationId}`
          proyectoLocationsMap[key] = {
            setName: pl.setName || '',
            basecampLink: pl.basecampLink || '',
            distanceLocBase: pl.distanceLocBase || ''
          }
        })
      } catch (plError) {
        console.error('Error cargando ProyectoLocation (puede que la tabla no exista aún):', plError.message)
        // Si falla, simplemente usar valores vacíos
      }
    }
    
    // Formatear proyectos con datos extra de locations
    const formattedProyectos = proyectos.map((proyecto) => {
      try {
        const proyectoJson = proyecto.toJSON()
        
        // Acceder a ProyectoLocation desde el mapa que creamos
        const locations = (proyectoJson.Locations || []).map((loc) => {
          try {
            // Buscar en el mapa usando proyectoId_locationId
            const key = `${proyecto.id}_${loc.id}`
            const proyectoLocationData = proyectoLocationsMap[key] || null
            
            // Si no encontramos datos, usar valores por defecto
            return {
              ...loc,
              ProyectoLocation: proyectoLocationData || {
                setName: '',
                basecampLink: '',
                distanceLocBase: ''
              }
            }
          } catch (locError) {
            console.error('Error procesando location individual:', locError)
            // Si hay error con una location específica, devolverla sin ProyectoLocation
            return {
              ...loc,
              ProyectoLocation: {
                setName: '',
                basecampLink: '',
                distanceLocBase: ''
              }
            }
          }
        })
        
        return {
          ...proyectoJson,
          Locations: locations
        }
      } catch (error) {
        console.error('Error formateando proyecto completo:', error)
        console.error('Stack:', error.stack)
        // Si hay error, devolver el proyecto sin formatear
        try {
          const proyectoJson = proyecto.toJSON()
          return {
            ...proyectoJson,
            Locations: (proyectoJson.Locations || []).map(loc => ({
              ...loc,
              ProyectoLocation: {
                setName: '',
                basecampLink: '',
                distanceLocBase: ''
              }
            }))
          }
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError)
          return proyecto.toJSON()
        }
      }
    })
    
    res.json(formattedProyectos)
  } catch (error) {
    console.error('Error en GET /proyectos:', error)
    console.error('Stack completo:', error.stack)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// GET single proyecto
router.get('/:id', async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id, {
      include: [
        { model: Location, as: 'Locations', required: false },
        { model: Crew, as: 'Crews', required: false },
        { model: Vendor, as: 'Vendors', required: false }
      ]
    })
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }
    
    // Cargar datos de ProyectoLocation por separado
    let proyectoLocationsMap = {}
    try {
      const proyectoLocations = await ProyectoLocation.findAll({
        where: {
          proyectoId: proyecto.id
        }
      })
      
      proyectoLocations.forEach(pl => {
        const key = `${pl.proyectoId}_${pl.locationId}`
        proyectoLocationsMap[key] = {
          setName: pl.setName || '',
          basecampLink: pl.basecampLink || '',
          distanceLocBase: pl.distanceLocBase || ''
        }
      })
    } catch (plError) {
      console.error('Error cargando ProyectoLocation (puede que la tabla no exista aún):', plError.message)
    }
    
    // Formatear las locations con los datos extra
    try {
      const proyectoJson = proyecto.toJSON()
      const locations = (proyectoJson.Locations || []).map((loc) => {
        try {
          const key = `${proyecto.id}_${loc.id}`
          const proyectoLocationData = proyectoLocationsMap[key] || null
          
          return {
            ...loc,
            ProyectoLocation: proyectoLocationData || {
              setName: '',
              basecampLink: '',
              distanceLocBase: ''
            }
          }
        } catch (locError) {
          console.error('Error procesando location:', locError)
          return {
            ...loc,
            ProyectoLocation: {
              setName: '',
              basecampLink: '',
              distanceLocBase: ''
            }
          }
        }
      })
      
      const formattedProyecto = {
        ...proyectoJson,
        Locations: locations
      }
      
      res.json(formattedProyecto)
    } catch (error) {
      console.error('Error formateando proyecto:', error)
      // Si hay error, devolver el proyecto sin formatear
      res.json(proyecto.toJSON())
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create proyecto
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    console.log('Creating proyecto...')
    console.log('Body:', req.body)
    console.log('File:', req.file)
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, projectDate, locations, crew, vendors } = req.body
    
    const proyectoData = {
      nombre,
      descripcion: descripcion || '',
      company: company || '',
      cif: cif || '',
      address: address || '',
      locationManager: locationManager || '',
      locationCoordinator: locationCoordinator || '',
      projectDate: projectDate || null
    }

    if (req.file) {
      proyectoData.logoUrl = req.file.path
    }

    const proyecto = await Proyecto.create(proyectoData)

    // Asociar locations con datos extra
    if (locations) {
      const locationsData = JSON.parse(locations)
      // locationsData puede ser array de IDs o array de objetos con {id, setName, basecampLink, distanceLocBase}
      const locationIds = Array.isArray(locationsData) && locationsData.length > 0 && typeof locationsData[0] === 'object'
        ? locationsData.map(l => parseInt(l.id))
        : locationsData.map(id => parseInt(id))
      
      const locationInstances = await Location.findAll({
        where: { id: locationIds }
      })
      
      // Eliminar relaciones existentes
      await ProyectoLocation.destroy({
        where: { proyectoId: proyecto.id }
      })
      
      // Crear relaciones con datos extra
      for (const locInstance of locationInstances) {
        const locData = Array.isArray(locationsData) && locationsData.length > 0 && typeof locationsData[0] === 'object'
          ? locationsData.find(l => parseInt(l.id) === locInstance.id)
          : null
        
        await ProyectoLocation.create({
          proyectoId: proyecto.id,
          locationId: locInstance.id,
          setName: locData?.setName || '',
          basecampLink: locData?.basecampLink || '',
          distanceLocBase: locData?.distanceLocBase || ''
        })
      }
    }

    if (crew) {
      const crewIds = JSON.parse(crew)
      const crewInstances = await Crew.findAll({
        where: { id: crewIds }
      })
      await proyecto.setCrews(crewInstances)
    }

    if (vendors) {
      const vendorIds = JSON.parse(vendors)
      const vendorInstances = await Vendor.findAll({
        where: { id: vendorIds }
      })
      await proyecto.setVendors(vendorInstances)
    }

    // Recargar con relaciones (sin through para evitar errores SQL)
    await proyecto.reload({
      include: [
        { model: Location, as: 'Locations', required: false },
        { model: Crew, as: 'Crews', required: false },
        { model: Vendor, as: 'Vendors', required: false }
      ]
    })
    
    // Cargar datos de ProyectoLocation por separado
    let proyectoLocationsMap = {}
    try {
      const proyectoLocations = await ProyectoLocation.findAll({
        where: {
          proyectoId: proyecto.id
        }
      })
      
      proyectoLocations.forEach(pl => {
        const key = `${pl.proyectoId}_${pl.locationId}`
        proyectoLocationsMap[key] = {
          setName: pl.setName || '',
          basecampLink: pl.basecampLink || '',
          distanceLocBase: pl.distanceLocBase || ''
        }
      })
    } catch (plError) {
      console.error('Error cargando ProyectoLocation:', plError.message)
    }
    
    // Formatear respuesta con datos extra
    try {
      const proyectoJson = proyecto.toJSON()
      const locations = (proyectoJson.Locations || []).map(loc => {
        const key = `${proyecto.id}_${loc.id}`
        const proyectoLocationData = proyectoLocationsMap[key] || null
        
        return {
          ...loc,
          ProyectoLocation: proyectoLocationData || {
            setName: '',
            basecampLink: '',
            distanceLocBase: ''
          }
        }
      })
      
      const formattedProyecto = {
        ...proyectoJson,
        Locations: locations
      }
      
      res.status(201).json(formattedProyecto)
    } catch (error) {
      console.error('Error formateando proyecto:', error)
      // Si hay error, devolver el proyecto sin formatear
      res.status(201).json(proyecto.toJSON())
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update proyecto
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, projectDate, locations, crew, vendors } = req.body
    
    const proyecto = await Proyecto.findByPk(req.params.id)
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }

    const updateData = {}
    if (nombre) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (company !== undefined) updateData.company = company
    if (cif !== undefined) updateData.cif = cif
    if (address !== undefined) updateData.address = address
    if (locationManager !== undefined) updateData.locationManager = locationManager
    if (locationCoordinator !== undefined) updateData.locationCoordinator = locationCoordinator
    if (projectDate !== undefined) updateData.projectDate = projectDate || null
    if (req.file) updateData.logoUrl = req.file.path

    await proyecto.update(updateData)

    // Actualizar relaciones de locations con datos extra
    if (locations) {
      const locationsData = JSON.parse(locations)
      // locationsData puede ser array de IDs o array de objetos con {id, setName, basecampLink, distanceLocBase}
      const locationIds = Array.isArray(locationsData) && locationsData.length > 0 && typeof locationsData[0] === 'object'
        ? locationsData.map(l => parseInt(l.id))
        : locationsData.map(id => parseInt(id))
      
      const locationInstances = await Location.findAll({
        where: { id: locationIds }
      })
      
      // Eliminar relaciones existentes
      await ProyectoLocation.destroy({
        where: { proyectoId: proyecto.id }
      })
      
      // Crear relaciones con datos extra
      for (const locInstance of locationInstances) {
        const locData = Array.isArray(locationsData) && locationsData.length > 0 && typeof locationsData[0] === 'object'
          ? locationsData.find(l => parseInt(l.id) === locInstance.id)
          : null
        
        await ProyectoLocation.create({
          proyectoId: proyecto.id,
          locationId: locInstance.id,
          setName: locData?.setName || '',
          basecampLink: locData?.basecampLink || '',
          distanceLocBase: locData?.distanceLocBase || ''
        })
      }
    }

    if (crew) {
      const crewIds = JSON.parse(crew)
      const crewInstances = await Crew.findAll({
        where: { id: crewIds }
      })
      await proyecto.setCrews(crewInstances)
    }

    if (vendors) {
      const vendorIds = JSON.parse(vendors)
      const vendorInstances = await Vendor.findAll({
        where: { id: vendorIds }
      })
      await proyecto.setVendors(vendorInstances)
    }

    // Recargar con relaciones (sin through para evitar errores SQL)
    await proyecto.reload({
      include: [
        { model: Location, as: 'Locations', required: false },
        { model: Crew, as: 'Crews', required: false },
        { model: Vendor, as: 'Vendors', required: false }
      ]
    })

    // Cargar datos de ProyectoLocation por separado
    let proyectoLocationsMap = {}
    try {
      const proyectoLocations = await ProyectoLocation.findAll({
        where: {
          proyectoId: proyecto.id
        }
      })
      
      proyectoLocations.forEach(pl => {
        const key = `${pl.proyectoId}_${pl.locationId}`
        proyectoLocationsMap[key] = {
          setName: pl.setName || '',
          basecampLink: pl.basecampLink || '',
          distanceLocBase: pl.distanceLocBase || ''
        }
      })
    } catch (plError) {
      console.error('Error cargando ProyectoLocation:', plError.message)
    }

    // Formatear respuesta con datos extra
    try {
      const proyectoJson = proyecto.toJSON()
      const locations = (proyectoJson.Locations || []).map(loc => {
        const key = `${proyecto.id}_${loc.id}`
        const proyectoLocationData = proyectoLocationsMap[key] || null
        
        return {
          ...loc,
          ProyectoLocation: proyectoLocationData || {
            setName: '',
            basecampLink: '',
            distanceLocBase: ''
          }
        }
      })

      const formattedProyecto = {
        ...proyectoJson,
        Locations: locations
      }

      res.json(formattedProyecto)
    } catch (error) {
      console.error('Error formateando proyecto:', error)
      // Si hay error, devolver el proyecto sin formatear
      res.json(proyecto.toJSON())
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE proyecto
router.delete('/:id', async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id)
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }
    await proyecto.destroy()
    res.json({ message: 'Proyecto eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
