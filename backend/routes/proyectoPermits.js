import express from 'express'
import ProyectoPermit from '../models/ProyectoPermit.js'
import Proyecto from '../models/Proyecto.js'
import Permit from '../models/Permit.js'
import Location from '../models/Location.js'

const router = express.Router()

// Listar todos los permits asignados a un proyecto, con info de permit y location
router.get('/proyectos/:proyectoId/permits', async (req, res) => {
  try {
    const { proyectoId } = req.params

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findByPk(proyectoId)
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }

    const asignaciones = await ProyectoPermit.findAll({
      where: { proyectoId },
      include: [
        { model: Permit, as: 'Permit' },
        { model: Location, as: 'Location' }
      ],
      order: [['createdAt', 'ASC']]
    })

    res.json(asignaciones)
  } catch (error) {
    console.error('Error listando proyecto permits:', error)
    res.status(500).json({ error: error.message || 'Error al obtener los permits del proyecto' })
  }
})

// Crear una nueva asignación de permit a proyecto + localización
router.post('/proyectos/:proyectoId/permits', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const {
      permitId,
      locationId,
      solicitado = false,
      pendienteRespuesta = false,
      recibido = false,
      pagado = false,
      resuelto = false
    } = req.body

    if (!permitId || !locationId) {
      return res.status(400).json({ error: 'permitId y locationId son obligatorios' })
    }

    // Verificar que el proyecto, permit y location existen
    const [proyecto, permit, location] = await Promise.all([
      Proyecto.findByPk(proyectoId),
      Permit.findByPk(permitId),
      Location.findByPk(locationId)
    ])

    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }
    if (!permit) {
      return res.status(404).json({ error: 'Permiso no encontrado' })
    }
    if (!location) {
      return res.status(404).json({ error: 'Localización no encontrada' })
    }

    const asignacion = await ProyectoPermit.create({
      proyectoId,
      permitId,
      locationId,
      solicitado: !!solicitado,
      pendienteRespuesta: !!pendienteRespuesta,
      recibido: !!recibido,
      pagado: !!pagado,
      resuelto: !!resuelto
    })

    const asignacionCompleta = await ProyectoPermit.findByPk(asignacion.id, {
      include: [
        { model: Permit, as: 'Permit' },
        { model: Location, as: 'Location' }
      ]
    })

    res.status(201).json(asignacionCompleta)
  } catch (error) {
    console.error('Error creando proyecto permit:', error)
    res.status(500).json({ error: error.message || 'Error al crear la asignación de permiso' })
  }
})

// Actualizar una asignación de permit (estados y/o localización)
router.put('/proyectos/:proyectoId/permits/:id', async (req, res) => {
  try {
    const { proyectoId, id } = req.params
    const {
      locationId,
      solicitado,
      pendienteRespuesta,
      recibido,
      pagado,
      resuelto
    } = req.body

    const asignacion = await ProyectoPermit.findOne({
      where: { id, proyectoId }
    })

    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación de permiso no encontrada' })
    }

    const updateData = {}

    if (locationId !== undefined) {
      const location = await Location.findByPk(locationId)
      if (!location) {
        return res.status(404).json({ error: 'Localización no encontrada' })
      }
      updateData.locationId = locationId
    }

    if (solicitado !== undefined) updateData.solicitado = !!solicitado
    if (pendienteRespuesta !== undefined) updateData.pendienteRespuesta = !!pendienteRespuesta
    if (recibido !== undefined) updateData.recibido = !!recibido
    if (pagado !== undefined) updateData.pagado = !!pagado
    if (resuelto !== undefined) updateData.resuelto = !!resuelto

    await asignacion.update(updateData)

    const asignacionActualizada = await ProyectoPermit.findByPk(asignacion.id, {
      include: [
        { model: Permit, as: 'Permit' },
        { model: Location, as: 'Location' }
      ]
    })

    res.json(asignacionActualizada)
  } catch (error) {
    console.error('Error actualizando proyecto permit:', error)
    res.status(500).json({ error: error.message || 'Error al actualizar la asignación de permiso' })
  }
})

// Eliminar una asignación de permit del proyecto
router.delete('/proyectos/:proyectoId/permits/:id', async (req, res) => {
  try {
    const { proyectoId, id } = req.params

    const asignacion = await ProyectoPermit.findOne({
      where: { id, proyectoId }
    })

    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación de permiso no encontrada' })
    }

    await asignacion.destroy()
    res.json({ message: 'Asignación de permiso eliminada correctamente' })
  } catch (error) {
    console.error('Error eliminando proyecto permit:', error)
    res.status(500).json({ error: error.message || 'Error al eliminar la asignación de permiso' })
  }
})

export default router

