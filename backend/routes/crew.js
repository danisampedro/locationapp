import express from 'express'
import Crew from '../models/Crew.js'

const router = express.Router()

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
router.post('/', async (req, res) => {
  try {
    console.log('Creating crew member...')
    console.log('Body:', req.body)
    const member = await Crew.create(req.body)
    console.log('Crew member creado exitosamente:', member.id)
    res.status(201).json(member)
  } catch (error) {
    console.error('Error creando crew member:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update crew member
router.put('/:id', async (req, res) => {
  try {
    const member = await Crew.findByPk(req.params.id)
    if (!member) {
      return res.status(404).json({ error: 'Miembro del crew no encontrado' })
    }
    await member.update(req.body)
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
