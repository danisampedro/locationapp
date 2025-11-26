import express from 'express'
import Vendor from '../models/Vendor.js'

const router = express.Router()

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.findAll()
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
router.post('/', async (req, res) => {
  try {
    console.log('Creating vendor...')
    console.log('Body:', req.body)
    const vendor = await Vendor.create(req.body)
    console.log('Vendor creado exitosamente:', vendor.id)
    res.status(201).json(vendor)
  } catch (error) {
    console.error('Error creando vendor:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update vendor
router.put('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor no encontrado' })
    }
    await vendor.update(req.body)
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
