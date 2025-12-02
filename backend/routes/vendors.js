import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
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
    folder: 'locationapp/vendors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'svg']
  }
})

const upload = multer({ storage })

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      order: [['nombre', 'ASC']]
    })
    res.json(vendors)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single vendor
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor no encontrado' })
    }
    res.json(vendor)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create vendor
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    console.log('Creating vendor...')
    console.log('Body:', req.body)
    console.log('File:', req.file)

    const {
      nombre,
      tipo,
      contacto,
      email,
      telefonoFijo,
      telefonoMovil,
      cif,
      direccion,
      notas
    } = req.body

    const vendorData = {
      nombre,
      tipo: tipo || '',
      contacto: contacto || '',
      email: email || '',
      telefono: telefonoFijo || '',
      telefonoFijo: telefonoFijo || '',
      telefonoMovil: telefonoMovil || '',
      cif: cif || '',
      direccion: direccion || '',
      notas: notas || ''
    }

    if (req.file) {
      vendorData.logoUrl = req.file.path
    }

    const vendor = await Vendor.create(vendorData)
    console.log('Vendor creado exitosamente:', vendor.id)
    res.status(201).json(vendor)
  } catch (error) {
    console.error('Error creando vendor:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update vendor
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor no encontrado' })
    }

    const updateData = {}
    const {
      nombre,
      tipo,
      contacto,
      email,
      telefonoFijo,
      telefonoMovil,
      cif,
      direccion,
      notas
    } = req.body

    if (nombre !== undefined) updateData.nombre = nombre
    if (tipo !== undefined) updateData.tipo = tipo
    if (contacto !== undefined) updateData.contacto = contacto
    if (email !== undefined) updateData.email = email
    if (telefonoFijo !== undefined) {
      updateData.telefonoFijo = telefonoFijo
      updateData.telefono = telefonoFijo
    }
    if (telefonoMovil !== undefined) updateData.telefonoMovil = telefonoMovil
    if (cif !== undefined) updateData.cif = cif
    if (direccion !== undefined) updateData.direccion = direccion
    if (notas !== undefined) updateData.notas = notas

    if (req.file) {
      updateData.logoUrl = req.file.path
    }

    await vendor.update(updateData)
    res.json(vendor)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE vendor
router.delete('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor no encontrado' })
    }
    await vendor.destroy()
    res.json({ message: 'Vendor eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
