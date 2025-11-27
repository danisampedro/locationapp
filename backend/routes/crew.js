import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import Crew from '../models/Crew.js'

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
    folder: 'locationapp/crew',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
})

const upload = multer({ storage })

// GET all crew
router.get('/', async (req, res) => {
  try {
    const crew = await Crew.findAll()
    res.json(crew)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single crew member
router.get('/:id', async (req, res) => {
  try {
    const member = await Crew.findByPk(req.params.id)
    if (!member) {
      return res.status(404).json({ error: 'Miembro del crew no encontrado' })
    }
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create crew member
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('Creating crew member...')
    console.log('Body:', req.body)
    console.log('File:', req.file)
    
    const { nombre, dni, fechaNacimiento, carnetConducir, rol, email, telefono, notas } = req.body
    
    const memberData = {
      nombre,
      dni: dni || '',
      fechaNacimiento: fechaNacimiento || null,
      carnetConducir: carnetConducir === 'true' || carnetConducir === true,
      rol: rol || '',
      email: email || '',
      telefono: telefono || '',
      notas: notas || ''
    }

    if (req.file) {
      memberData.fotoUrl = req.file.path
    }

    const member = await Crew.create(memberData)
    console.log('Crew member creado exitosamente:', member.id)
    res.status(201).json(member)
  } catch (error) {
    console.error('Error creando crew member:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update crew member
router.put('/:id', upload.single('foto'), async (req, res) => {
  try {
    const member = await Crew.findByPk(req.params.id)
    if (!member) {
      return res.status(404).json({ error: 'Miembro del crew no encontrado' })
    }

    const updateData = {}
    if (req.body.nombre) updateData.nombre = req.body.nombre
    if (req.body.dni !== undefined) updateData.dni = req.body.dni
    if (req.body.fechaNacimiento !== undefined) updateData.fechaNacimiento = req.body.fechaNacimiento || null
    if (req.body.carnetConducir !== undefined) updateData.carnetConducir = req.body.carnetConducir === 'true' || req.body.carnetConducir === true
    if (req.body.rol !== undefined) updateData.rol = req.body.rol
    if (req.body.email !== undefined) updateData.email = req.body.email
    if (req.body.telefono !== undefined) updateData.telefono = req.body.telefono
    if (req.body.notas !== undefined) updateData.notas = req.body.notas

    if (req.file) {
      updateData.fotoUrl = req.file.path
    }

    await member.update(updateData)
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE crew member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Crew.findByPk(req.params.id)
    if (!member) {
      return res.status(404).json({ error: 'Miembro del crew no encontrado' })
    }
    await member.destroy()
    res.json({ message: 'Miembro del crew eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
