import express from 'express'
import Evento from '../models/Evento.js'

const router = express.Router()

// GET all events
router.get('/', async (req, res) => {
  try {
    const eventos = await Evento.findAll({
      order: [['fechaInicio', 'ASC']]
    })
    res.json(eventos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id)
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }
    res.json(evento)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create event
router.post('/', async (req, res) => {
  try {
    const { titulo, fechaInicio, fechaFin, color } = req.body

    if (!titulo || !fechaInicio) {
      return res.status(400).json({ error: 'Título y fecha de inicio son campos obligatorios' })
    }

    const evento = await Evento.create({
      titulo,
      fechaInicio,
      fechaFin: fechaFin || null,
      color: color || '#3b82f6'
    })

    res.status(201).json(evento)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id)
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }

    const updateData = {}
    const { titulo, fechaInicio, fechaFin, color } = req.body

    if (titulo !== undefined) updateData.titulo = titulo
    if (fechaInicio !== undefined) updateData.fechaInicio = fechaInicio
    if (fechaFin !== undefined) updateData.fechaFin = fechaFin
    if (color !== undefined) updateData.color = color

    await evento.update(updateData)
    res.json(evento)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id)
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }

    await evento.destroy()
    res.json({ message: 'Evento eliminado exitosamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

