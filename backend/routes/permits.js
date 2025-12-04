import express from 'express'
import Permit from '../models/Permit.js'

const router = express.Router()

// GET all permits
router.get('/', async (req, res) => {
  try {
    const permits = await Permit.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(permits)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single permit
router.get('/:id', async (req, res) => {
  try {
    const permit = await Permit.findByPk(req.params.id)
    if (!permit) {
      return res.status(404).json({ error: 'Permiso no encontrado' })
    }
    res.json(permit)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create permit
router.post('/', async (req, res) => {
  try {
    const {
      administracion,
      area,
      contacto,
      telefono,
      correo,
      notas,
      categoria
    } = req.body

    if (!administracion) {
      return res.status(400).json({ error: 'Administración es un campo obligatorio' })
    }

    const permit = await Permit.create({
      administracion,
      area: area || '',
      contacto: contacto || '',
      telefono: telefono || '',
      correo: correo || '',
      notas: notas || '',
      categoria: categoria || ''
    })

    res.status(201).json(permit)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update permit
router.put('/:id', async (req, res) => {
  try {
    const permit = await Permit.findByPk(req.params.id)
    if (!permit) {
      return res.status(404).json({ error: 'Permiso no encontrado' })
    }

    const updateData = {}
    const {
      administracion,
      area,
      contacto,
      telefono,
      correo,
      notas,
      categoria
    } = req.body

    if (administracion !== undefined) updateData.administracion = administracion
    if (area !== undefined) updateData.area = area
    if (contacto !== undefined) updateData.contacto = contacto
    if (telefono !== undefined) updateData.telefono = telefono
    if (correo !== undefined) updateData.correo = correo
    if (notas !== undefined) updateData.notas = notas
    if (categoria !== undefined) updateData.categoria = categoria

    await permit.update(updateData)
    res.json(permit)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE permit
router.delete('/:id', async (req, res) => {
  try {
    const permit = await Permit.findByPk(req.params.id)
    if (!permit) {
      return res.status(404).json({ error: 'Permiso no encontrado' })
    }
    await permit.destroy()
    res.json({ message: 'Permiso eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router




