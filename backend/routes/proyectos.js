import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Proyecto from '../models/Proyecto.js'
import Location from '../models/Location.js'
import Crew from '../models/Crew.js'
import Vendor from '../models/Vendor.js'
import ProyectoLocation from '../models/ProyectoLocation.js'
import ProyectoCrew from '../models/ProyectoCrew.js'
import sequelize from '../config/database.js'

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
    console.log('🔄 Iniciando GET /proyectos')
    
    // Cargar proyectos sin el through model primero para evitar errores
    let proyectos
    try {
      proyectos = await Proyecto.findAll({
        include: [
          { model: Location, as: 'Locations', required: false },
          { model: Crew, as: 'Crews', required: false },
          { model: Vendor, as: 'Vendors', required: false }
        ]
      })
      console.log(`✅ Proyectos cargados: ${proyectos.length}`)
    } catch (findError) {
      console.error('❌ Error en Proyecto.findAll:', findError)
      throw findError
    }
    
    // Ahora cargar los datos de ProyectoLocation por separado si es necesario
    const proyectoIds = proyectos.map(p => p && p.id).filter(id => id !== undefined && id !== null)
    let proyectoLocationsMap = {}
    let proyectoCrewMap = {}
    
    if (proyectoIds.length > 0) {
      try {
        // Intentar cargar ProyectoLocation, pero si falla, continuar sin ellos
        const proyectoLocations = await ProyectoLocation.findAll({
          where: {
            proyectoId: proyectoIds
          },
          attributes: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente
        })
        
        console.log(`✅ ProyectoLocations cargados: ${proyectoLocations.length}`)
        
        // Crear un mapa para acceso rápido: proyectoId_locationId -> datos
        proyectoLocations.forEach(pl => {
          if (pl && pl.proyectoId && pl.locationId) {
            const key = `${pl.proyectoId}_${pl.locationId}`
            proyectoLocationsMap[key] = {
              setName: pl.setName || '',
              basecampLink: pl.basecampLink || '',
              distanceLocBase: pl.distanceLocBase || ''
            }
          }
        })
      } catch (plError) {
        // Si la tabla no existe o hay algún error, simplemente continuar sin ProyectoLocation
        console.log('ℹ️  No se pudieron cargar ProyectoLocations (puede que la tabla no exista aún):', plError.message)
        // No es crítico, continuamos sin estos datos
      }

      // Cargar también datos de ProyectoCrew (relación proyecto-crew con info extra)
      try {
        const proyectoCrews = await ProyectoCrew.findAll({
          where: {
            proyectoId: proyectoIds
          },
          attributes: ['proyectoId', 'crewId', 'startDate', 'endDate', 'weeklyRate', 'carAllowance', 'boxRental']
        })

        proyectoCrews.forEach(pc => {
          if (pc && pc.proyectoId && pc.crewId) {
            const key = `${pc.proyectoId}_${pc.crewId}`
            proyectoCrewMap[key] = {
              startDate: pc.startDate || null,
              endDate: pc.endDate || null,
              weeklyRate: pc.weeklyRate || '',
              carAllowance: pc.carAllowance === true,
              boxRental: pc.boxRental === true
            }
          }
        })
      } catch (pcError) {
        console.log('ℹ️  No se pudieron cargar ProyectoCrew (puede que la tabla no exista aún):', pcError.message)
      }
    }
    
    // Formatear proyectos con datos extra de locations
    console.log('🔄 Formateando proyectos...')
    const formattedProyectos = proyectos.map((proyecto, index) => {
      try {
        if (!proyecto) {
          console.warn(`⚠️  Proyecto ${index} es null o undefined`)
          return null
        }
        
        const proyectoJson = proyecto.toJSON()
        if (!proyectoJson) {
          console.warn(`⚠️  Proyecto ${index} no se pudo convertir a JSON`)
          return null
        }
        
        // Acceder a ProyectoLocation desde el mapa que creamos
        const locations = (proyectoJson.Locations || []).map((loc, locIndex) => {
          try {
            // Validar que proyecto.id y loc.id existan
            if (!proyecto || !proyecto.id) {
              console.warn(`⚠️  Proyecto sin ID válido en location ${locIndex}`)
              return {
                ...loc,
                ProyectoLocation: {
                  setName: '',
                  basecampLink: '',
                  distanceLocBase: ''
                }
              }
            }
            
            if (!loc || !loc.id) {
              console.warn(`⚠️  Location ${locIndex} sin ID válido`)
              return {
                ...loc,
                ProyectoLocation: {
                  setName: '',
                  basecampLink: '',
                  distanceLocBase: ''
                }
              }
            }
            
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
            console.error(`❌ Error procesando location ${locIndex}:`, locError)
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
        
        // Añadir datos extra de crew desde ProyectoCrew
        const crews = (proyectoJson.Crews || []).map((c) => {
          const key = `${proyecto.id}_${c.id}`
          const pcData = proyectoCrewMap[key] || null
          return {
            ...c,
            ProyectoCrew: pcData || {
              startDate: null,
              endDate: null,
              weeklyRate: '',
              carAllowance: false,
              boxRental: false
            }
          }
        })

        return {
          ...proyectoJson,
          Locations: locations,
          Crews: crews
        }
      } catch (error) {
        console.error(`❌ Error formateando proyecto ${index}:`, error)
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
          console.error('❌ Error en fallback:', fallbackError)
          return proyecto.toJSON()
        }
      }
    }).filter(p => p !== null) // Filtrar proyectos nulos
    
    console.log(`✅ Proyectos formateados: ${formattedProyectos.length}`)
    res.json(formattedProyectos)
  } catch (error) {
    console.error('Error en GET /proyectos:', error)
    console.error('Error message:', error.message)
    console.error('Error name:', error.name)
    console.error('Stack completo:', error.stack)
    
    // Intentar devolver proyectos sin formateo si es posible
    try {
      const proyectos = await Proyecto.findAll({
        include: [
          { model: Location, as: 'Locations', required: false },
          { model: Crew, as: 'Crews', required: false },
          { model: Vendor, as: 'Vendors', required: false }
        ]
      })
      
      const proyectosSimples = proyectos.map(p => {
        const pJson = p.toJSON()
        return {
          ...pJson,
          Locations: (pJson.Locations || []).map(loc => ({
            ...loc,
            ProyectoLocation: {
              setName: '',
              basecampLink: '',
              distanceLocBase: ''
            }
          }))
        }
      })
      
      console.log('Devolviendo proyectos sin formateo completo debido a error')
      return res.json(proyectosSimples)
    } catch (fallbackError) {
      console.error('Error en fallback también:', fallbackError)
      res.status(500).json({ 
        error: error.message || 'Error desconocido',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
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
    
    // Cargar datos de ProyectoLocation y ProyectoCrew por separado
    let proyectoLocationsMap = {}
    let proyectoCrewMap = {}
    try {
      const proyectoLocations = await ProyectoLocation.findAll({
        where: {
          proyectoId: proyecto.id
        },
        attributes: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente
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

    // Cargar datos de ProyectoCrew (info extra por miembro de crew)
    try {
      const proyectoCrews = await ProyectoCrew.findAll({
        where: {
          proyectoId: proyecto.id
        },
        attributes: ['proyectoId', 'crewId', 'startDate', 'endDate', 'weeklyRate', 'carAllowance', 'boxRental']
      })

      proyectoCrews.forEach(pc => {
        const key = `${pc.proyectoId}_${pc.crewId}`
        proyectoCrewMap[key] = {
          startDate: pc.startDate || null,
          endDate: pc.endDate || null,
          weeklyRate: pc.weeklyRate || '',
          carAllowance: pc.carAllowance === true,
          boxRental: pc.boxRental === true
        }
      })
    } catch (pcError) {
      console.error('Error cargando ProyectoCrew (puede que la tabla no exista aún):', pcError.message)
    }
    
    // Formatear las locations y crew con los datos extra
    try {
      const proyectoJson = proyecto.toJSON()
      const locations = (proyectoJson.Locations || []).map((loc) => {
        try {
          const key = `${proyecto.id}_${loc.id}`
          const proyectoLocationData = proyectoLocationsMap[key] || null
          
          // Debug: verificar que los datos se cargan correctamente
          if (proyectoLocationData) {
            console.log(`✅ Datos encontrados para location ${loc.id}:`, proyectoLocationData)
          } else {
            console.log(`⚠️  No hay datos para location ${loc.id}, key: ${key}`)
            console.log(`   Mapa disponible:`, Object.keys(proyectoLocationsMap))
          }
          
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
      
      const crews = (proyectoJson.Crews || []).map((c) => {
        const key = `${proyecto.id}_${c.id}`
        const pcData = proyectoCrewMap[key] || null
        return {
          ...c,
          ProyectoCrew: pcData || {
            startDate: null,
            endDate: null,
            weeklyRate: '',
            carAllowance: false,
            boxRental: false
          }
        }
      })

      const formattedProyecto = {
        ...proyectoJson,
        Locations: locations,
        Crews: crews
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
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, assistantLocationManager, basecampManager, projectDate, locations, crew, vendors } = req.body
    
    const proyectoData = {
      nombre,
      descripcion: descripcion || '',
      company: company || '',
      cif: cif || '',
      address: address || '',
      locationManager: locationManager || '',
      locationCoordinator: locationCoordinator || '',
      assistantLocationManager: assistantLocationManager || '',
      basecampManager: basecampManager || '',
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
        }, {
          fields: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente para evitar error con 'id'
        })
      }
    }

    if (crew) {
      const crewData = JSON.parse(crew)
      // crewData puede ser array de IDs o array de objetos con {id, startDate, endDate, weeklyRate, carAllowance, boxRental}
      const crewIds = Array.isArray(crewData) && crewData.length > 0 && typeof crewData[0] === 'object'
        ? crewData.map(c => parseInt(c.id))
        : crewData.map(id => parseInt(id))

      const crewInstances = await Crew.findAll({
        where: { id: crewIds }
      })

      // Eliminar relaciones existentes en la tabla intermedia
      await ProyectoCrew.destroy({
        where: { proyectoId: proyecto.id }
      })

      // Crear relaciones con datos extra
      for (const crewInstance of crewInstances) {
        const cData = Array.isArray(crewData) && crewData.length > 0 && typeof crewData[0] === 'object'
          ? crewData.find(c => parseInt(c.id) === crewInstance.id)
          : null

        await ProyectoCrew.create({
          proyectoId: proyecto.id,
          crewId: crewInstance.id,
          startDate: cData?.startDate || null,
          endDate: cData?.endDate || null,
          weeklyRate: cData?.weeklyRate || '',
          carAllowance: cData?.carAllowance === true,
          boxRental: cData?.boxRental === true
        }, {
          fields: ['proyectoId', 'crewId', 'startDate', 'endDate', 'weeklyRate', 'carAllowance', 'boxRental']
        })
      }

      // Asegurar que la relación many-to-many de Sequelize también se actualiza
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
        },
        attributes: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente
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
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, assistantLocationManager, basecampManager, projectDate, locations, crew, vendors } = req.body
    
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
    if (assistantLocationManager !== undefined) updateData.assistantLocationManager = assistantLocationManager
    if (basecampManager !== undefined) updateData.basecampManager = basecampManager
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
      
      // CARGAR relaciones existentes ANTES de eliminarlas para preservar datos
      const existingProyectoLocations = await ProyectoLocation.findAll({
        where: { proyectoId: proyecto.id },
        attributes: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente
      })
      
      // Crear un mapa de datos existentes: locationId -> datos
      const existingDataMap = {}
      existingProyectoLocations.forEach(pl => {
        existingDataMap[pl.locationId] = {
          setName: pl.setName || '',
          basecampLink: pl.basecampLink || '',
          distanceLocBase: pl.distanceLocBase || ''
        }
      })
      
      // Eliminar relaciones existentes
      await ProyectoLocation.destroy({
        where: { proyectoId: proyecto.id }
      })
      
      // Crear relaciones con datos extra (preservar datos existentes si no hay nuevos)
      for (const locInstance of locationInstances) {
        const locData = Array.isArray(locationsData) && locationsData.length > 0 && typeof locationsData[0] === 'object'
          ? locationsData.find(l => parseInt(l.id) === locInstance.id)
          : null
        
        // Si hay datos en el formulario y no están vacíos, usarlos; si no, usar los datos existentes
        const existingData = existingDataMap[locInstance.id] || {}
        const finalData = {
          setName: (locData?.setName && locData.setName.trim() !== '') ? locData.setName : (existingData.setName || ''),
          basecampLink: (locData?.basecampLink && locData.basecampLink.trim() !== '') ? locData.basecampLink : (existingData.basecampLink || ''),
          distanceLocBase: (locData?.distanceLocBase && locData.distanceLocBase.trim() !== '') ? locData.distanceLocBase : (existingData.distanceLocBase || '')
        }
        
        await ProyectoLocation.create({
          proyectoId: proyecto.id,
          locationId: locInstance.id,
          setName: finalData.setName,
          basecampLink: finalData.basecampLink,
          distanceLocBase: finalData.distanceLocBase
        }, {
          fields: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente para evitar error con 'id'
        })
      }
    }

    if (crew) {
      const crewData = JSON.parse(crew)
      // crewData puede ser array de IDs o array de objetos con {id, startDate, endDate, weeklyRate, carAllowance, boxRental}
      const crewIds = Array.isArray(crewData) && crewData.length > 0 && typeof crewData[0] === 'object'
        ? crewData.map(c => parseInt(c.id))
        : crewData.map(id => parseInt(id))

      const crewInstances = await Crew.findAll({
        where: { id: crewIds }
      })

      // CARGAR relaciones existentes ANTES de eliminarlas para preservar datos
      const existingProyectoCrew = await ProyectoCrew.findAll({
        where: { proyectoId: proyecto.id },
        attributes: ['proyectoId', 'crewId', 'startDate', 'endDate', 'weeklyRate', 'carAllowance', 'boxRental']
      })

      const existingCrewDataMap = {}
      existingProyectoCrew.forEach(pc => {
        existingCrewDataMap[pc.crewId] = {
          startDate: pc.startDate || null,
          endDate: pc.endDate || null,
          weeklyRate: pc.weeklyRate || '',
          carAllowance: pc.carAllowance === true,
          boxRental: pc.boxRental === true
        }
      })

      // Eliminar relaciones existentes
      await ProyectoCrew.destroy({
        where: { proyectoId: proyecto.id }
      })

      // Crear relaciones con datos extra (preservar datos existentes si no hay nuevos)
      for (const crewInstance of crewInstances) {
        const cData = Array.isArray(crewData) && crewData.length > 0 && typeof crewData[0] === 'object'
          ? crewData.find(c => parseInt(c.id) === crewInstance.id)
          : null

        const existingData = existingCrewDataMap[crewInstance.id] || {}
        const finalCrewData = {
          startDate: cData?.startDate || existingData.startDate || null,
          endDate: cData?.endDate || existingData.endDate || null,
          weeklyRate: (cData?.weeklyRate && cData.weeklyRate.toString().trim() !== '') ? cData.weeklyRate : (existingData.weeklyRate || ''),
          carAllowance: cData?.carAllowance !== undefined ? cData.carAllowance === true : (existingData.carAllowance === true),
          boxRental: cData?.boxRental !== undefined ? cData.boxRental === true : (existingData.boxRental === true)
        }

        await ProyectoCrew.create({
          proyectoId: proyecto.id,
          crewId: crewInstance.id,
          startDate: finalCrewData.startDate,
          endDate: finalCrewData.endDate,
          weeklyRate: finalCrewData.weeklyRate,
          carAllowance: finalCrewData.carAllowance,
          boxRental: finalCrewData.boxRental
        }, {
          fields: ['proyectoId', 'crewId', 'startDate', 'endDate', 'weeklyRate', 'carAllowance', 'boxRental']
        })
      }

      // Asegurar que la relación many-to-many de Sequelize también se actualiza
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
        },
        attributes: ['proyectoId', 'locationId', 'setName', 'basecampLink', 'distanceLocBase'] // Especificar campos explícitamente
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
