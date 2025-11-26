import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Proyecto from '../models/Proyecto.js'
import Location from '../models/Location.js'
import Crew from '../models/Crew.js'
import Vendor from '../models/Vendor.js'

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
    const proyectos = await Proyecto.findAll({
      include: [
        { model: Location, as: 'Locations' },
        { model: Crew, as: 'Crews' },
        { model: Vendor, as: 'Vendors' }
      ]
    })
    res.json(proyectos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single proyecto
router.get('/:id', async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id, {
      include: [
        { model: Location, as: 'Locations' },
        { model: Crew, as: 'Crews' },
        { model: Vendor, as: 'Vendors' }
      ]
    })
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }
    res.json(proyecto)
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
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, locations, crew, vendors } = req.body
    
    const proyectoData = {
      nombre,
      descripcion: descripcion || '',
      company: company || '',
      cif: cif || '',
      address: address || '',
      locationManager: locationManager || '',
      locationCoordinator: locationCoordinator || ''
    }

    if (req.file) {
      proyectoData.logoUrl = req.file.path
    }

    const proyecto = await Proyecto.create(proyectoData)

    // Asociar locations, crew y vendors si se proporcionan
    if (locations) {
      const locationIds = JSON.parse(locations)
      const locationInstances = await Location.findAll({
        where: { id: locationIds }
      })
      await proyecto.setLocations(locationInstances)
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

    // Recargar con relaciones
    await proyecto.reload({
      include: [
        { model: Location, as: 'Locations' },
        { model: Crew, as: 'Crews' },
        { model: Vendor, as: 'Vendors' }
      ]
    })
    
    res.status(201).json(proyecto)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update proyecto
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { nombre, descripcion, company, cif, address, locationManager, locationCoordinator, locations, crew, vendors } = req.body
    
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
    if (req.file) updateData.logoUrl = req.file.path

    await proyecto.update(updateData)

    // Actualizar relaciones si se proporcionan
    if (locations) {
      const locationIds = JSON.parse(locations)
      const locationInstances = await Location.findAll({
        where: { id: locationIds }
      })
      await proyecto.setLocations(locationInstances)
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

    // Recargar con relaciones
    await proyecto.reload({
      include: [
        { model: Location, as: 'Locations' },
        { model: Crew, as: 'Crews' },
        { model: Vendor, as: 'Vendors' }
      ]
    })

    res.json(proyecto)
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
