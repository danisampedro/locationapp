import express from 'express'
import RecceDocument from '../models/RecceDocument.js'

const router = express.Router()

// GET all recce documents for a project
router.get('/project/:proyectoId', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const documents = await RecceDocument.findAll({
      where: { proyectoId },
      order: [['createdAt', 'DESC']]
    })
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single recce document
router.get('/:id', async (req, res) => {
  try {
    const document = await RecceDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento Recce no encontrado' })
    }
    res.json(document)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create recce document
router.post('/', async (req, res) => {
  try {
    const {
      proyectoId,
      nombre,
      documentTitle,
      recceSchedule,
      meetingPoint,
      meetingPointLink,
      locationManagerName,
      locationManagerPhone,
      locationManagerEmail,
      sunriseTime,
      sunsetTime,
      weatherForecast,
      attendants,
      legs,
      freeEntries
    } = req.body

    if (!proyectoId || !nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El proyecto y el nombre son obligatorios' })
    }

    const document = await RecceDocument.create({
      proyectoId: parseInt(proyectoId),
      nombre: nombre.trim(),
      documentTitle: documentTitle || 'LOCATION RECCE',
      recceSchedule: recceSchedule || '',
      meetingPoint: meetingPoint || '',
      meetingPointLink: meetingPointLink || '',
      locationManagerName: locationManagerName || '',
      locationManagerPhone: locationManagerPhone || '',
      locationManagerEmail: locationManagerEmail || '',
      sunriseTime: sunriseTime || '',
      sunsetTime: sunsetTime || '',
      weatherForecast: weatherForecast || '',
      attendants: attendants || [],
      legs: legs || [],
      freeEntries: freeEntries || []
    })
    res.status(201).json(document)
  } catch (error) {
    console.error('Error creando documento Recce:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update recce document
router.put('/:id', async (req, res) => {
  try {
    const document = await RecceDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento Recce no encontrado' })
    }

    const {
      nombre,
      documentTitle,
      recceSchedule,
      meetingPoint,
      meetingPointLink,
      locationManagerName,
      locationManagerPhone,
      locationManagerEmail,
      sunriseTime,
      sunsetTime,
      weatherForecast,
      attendants,
      legs,
      freeEntries
    } = req.body

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    await document.update({
      nombre: nombre.trim(),
      documentTitle: documentTitle || 'LOCATION RECCE',
      recceSchedule: recceSchedule || '',
      meetingPoint: meetingPoint || '',
      meetingPointLink: meetingPointLink || '',
      locationManagerName: locationManagerName || '',
      locationManagerPhone: locationManagerPhone || '',
      locationManagerEmail: locationManagerEmail || '',
      sunriseTime: sunriseTime || '',
      sunsetTime: sunsetTime || '',
      weatherForecast: weatherForecast || '',
      attendants: attendants || [],
      legs: legs || [],
      freeEntries: freeEntries || []
    })
    res.json(document)
  } catch (error) {
    console.error('Error actualizando documento Recce:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE recce document
router.delete('/:id', async (req, res) => {
  try {
    const document = await RecceDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento Recce no encontrado' })
    }
    await document.destroy()
    res.json({ message: 'Documento Recce eliminado' })
  } catch (error) {
    console.error('Error eliminando documento Recce:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router


