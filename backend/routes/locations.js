import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Location from '../models/Location.js'
import Proyecto from '../models/Proyecto.js'

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
    folder: 'locationapp/locations',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
})

const upload = multer({ 
  storage,
  limits: { files: 2 }
})

// GET all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.findAll()
    res.json(locations)
  } catch (error) {
    console.error('Error getting locations:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single location
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id, {
      include: [
        { model: Proyecto, as: 'Proyectos' }
      ]
    })
    if (!location) {
      return res.status(404).json({ error: 'Location no encontrada' })
    }
    res.json(location)
  } catch (error) {
    console.error('Error getting location:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create location
router.post('/', upload.array('imagenes', 2), async (req, res) => {
  try {
    console.log('Creating location...')
    console.log('Body:', req.body)
    console.log('Files:', req.files)
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    })
    
    const { nombre, direccion, descripcion, googleMapsLink, contact, phoneNumber, mail } = req.body
    
    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' })
    }
    
    const imagenes = req.files ? req.files.map(file => file.path) : []
    console.log('Imágenes procesadas:', imagenes)
    
    const location = await Location.create({
      nombre,
      direccion,
      descripcion: descripcion || '',
      googleMapsLink: googleMapsLink || '',
      contact: contact || '',
      phoneNumber: phoneNumber || '',
      mail: mail || '',
      imagenes
    })
    
    console.log('Location creada exitosamente:', location.id)
    res.status(201).json(location)
  } catch (error) {
    console.error('Error creando location:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// PUT update location
router.put('/:id', upload.array('imagenes', 2), async (req, res) => {
  try {
    const { nombre, direccion, descripcion, googleMapsLink, contact, phoneNumber, mail } = req.body
    
    const location = await Location.findByPk(req.params.id)
    if (!location) {
      return res.status(404).json({ error: 'Location no encontrada' })
    }
    
    const updateData = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (direccion !== undefined) updateData.direccion = direccion
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (googleMapsLink !== undefined) updateData.googleMapsLink = googleMapsLink
    if (contact !== undefined) updateData.contact = contact
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (mail !== undefined) updateData.mail = mail
    
    if (req.files && req.files.length > 0) {
      updateData.imagenes = req.files.map(file => file.path)
    }

    await location.update(updateData)

    res.json(location)
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE location
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id)
    if (!location) {
      return res.status(404).json({ error: 'Location no encontrada' })
    }
    await location.destroy()
    res.json({ message: 'Location eliminada' })
  } catch (error) {
    console.error('Error deleting location:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
