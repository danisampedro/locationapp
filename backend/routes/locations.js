import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Location from '../models/Location.js'

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
    res.status(500).json({ error: error.message })
  }
})

// GET single location
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id)
    if (!location) {
      return res.status(404).json({ error: 'Location no encontrada' })
    }
    res.json(location)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create location
router.post('/', upload.array('imagenes', 2), async (req, res) => {
  try {
    const { nombre, direccion, descripcion } = req.body
    
    const imagenes = req.files ? req.files.map(file => file.path) : []
    
    const location = await Location.create({
      nombre,
      direccion,
      descripcion: descripcion || '',
      imagenes
    })
    
    res.status(201).json(location)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update location
router.put('/:id', upload.array('imagenes', 2), async (req, res) => {
  try {
    const { nombre, direccion, descripcion } = req.body
    
    const location = await Location.findByPk(req.params.id)
    if (!location) {
      return res.status(404).json({ error: 'Location no encontrada' })
    }
    
    const updateData = {}
    if (nombre) updateData.nombre = nombre
    if (direccion) updateData.direccion = direccion
    if (descripcion !== undefined) updateData.descripcion = descripcion
    
    if (req.files && req.files.length > 0) {
      updateData.imagenes = req.files.map(file => file.path)
    }

    await location.update(updateData)

    res.json(location)
  } catch (error) {
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
    res.status(500).json({ error: error.message })
  }
})

export default router
