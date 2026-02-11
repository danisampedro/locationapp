import express from 'express'
import Timesheet from '../models/Timesheet.js'

const router = express.Router()

// GET all timesheets for a project (optionally filter by crew)
router.get('/project/:proyectoId', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const { crewId } = req.query

    const where = { proyectoId: parseInt(proyectoId) }
    if (crewId) {
      where.crewId = parseInt(crewId)
    }

    const timesheets = await Timesheet.findAll({
      where,
      order: [
        ['year', 'DESC'],
        ['weekNumber', 'DESC'],
        ['createdAt', 'DESC']
      ]
    })
    res.json(timesheets)
  } catch (error) {
    console.error('Error obteniendo timesheets del proyecto:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single timesheet
router.get('/:id', async (req, res) => {
  try {
    const timesheet = await Timesheet.findByPk(parseInt(req.params.id))
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet no encontrado' })
    }
    res.json(timesheet)
  } catch (error) {
    console.error('Error obteniendo timesheet:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create or update timesheet for same project/crew/week
router.post('/', async (req, res) => {
  try {
    const {
      proyectoId,
      crewId,
      year,
      weekNumber,
      weekStartDate,
      projectTitle,
      projectCompany,
      department,
      workerName,
      workerRole,
      days,
      totalHoras,
      totalHorasExtra
    } = req.body

    if (!proyectoId || !crewId) {
      return res.status(400).json({ error: 'Proyecto y trabajador son obligatorios' })
    }
    if (!year || !weekNumber) {
      return res.status(400).json({ error: 'Año y número de semana son obligatorios' })
    }

    const parsedProyectoId = parseInt(proyectoId)
    const parsedCrewId = parseInt(crewId)

    let existing = await Timesheet.findOne({
      where: {
        proyectoId: parsedProyectoId,
        crewId: parsedCrewId,
        year: parseInt(year),
        weekNumber: parseInt(weekNumber)
      }
    })

    const payload = {
      proyectoId: parsedProyectoId,
      crewId: parsedCrewId,
      year: parseInt(year),
      weekNumber: parseInt(weekNumber),
      weekStartDate: weekStartDate || null,
      projectTitle: projectTitle || '',
      projectCompany: projectCompany || '',
      department: department || '',
      workerName: workerName || '',
      workerRole: workerRole || '',
      days: Array.isArray(days) ? days : [],
      totalHoras: typeof totalHoras === 'number' ? totalHoras : 0,
      totalHorasExtra: typeof totalHorasExtra === 'number' ? totalHorasExtra : 0
    }

    if (existing) {
      await existing.update(payload)
      return res.json(existing)
    }

    const created = await Timesheet.create(payload)
    return res.status(201).json(created)
  } catch (error) {
    console.error('Error guardando timesheet:', error)
    res.status(500).json({ error: error.message || 'Error al guardar el timesheet' })
  }
})

// DELETE timesheet
router.delete('/:id', async (req, res) => {
  try {
    const timesheet = await Timesheet.findByPk(parseInt(req.params.id))
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet no encontrado' })
    }
    await timesheet.destroy()
    res.json({ message: 'Timesheet eliminado' })
  } catch (error) {
    console.error('Error eliminando timesheet:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

