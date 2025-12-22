import express from 'express'
import Sheet from '../models/Sheet.js'

const router = express.Router()

// GET all sheets for a project (debe ir ANTES de /:id para evitar conflictos)
router.get('/project/:proyectoId', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const sheets = await Sheet.findAll({
      where: { proyectoId: parseInt(proyectoId) },
      order: [['createdAt', 'DESC']]
    })
    res.json(sheets)
  } catch (error) {
    console.error('Error obteniendo sheets del proyecto:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single sheet (debe ir DESPUÉS de rutas más específicas)
router.get('/:id', async (req, res) => {
  try {
    const sheet = await Sheet.findByPk(parseInt(req.params.id))
    if (!sheet) {
      return res.status(404).json({ error: 'Sheet no encontrado' })
    }
    res.json(sheet)
  } catch (error) {
    console.error('Error obteniendo sheet:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create sheet
router.post('/', async (req, res) => {
  try {
    const {
      proyectoId,
      nombre,
      columnas,
      filas
    } = req.body

    console.log('POST /sheets - Body recibido:', { proyectoId, nombre, columnasCount: columnas?.length })

    if (!proyectoId) {
      return res.status(400).json({ error: 'El proyecto es obligatorio' })
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del sheet es obligatorio' })
    }

    // Validar y parsear columnas y filas si vienen como strings
    let parsedColumnas = columnas
    let parsedFilas = filas

    if (typeof columnas === 'string') {
      try {
        parsedColumnas = JSON.parse(columnas)
      } catch (e) {
        parsedColumnas = []
      }
    }

    if (typeof filas === 'string') {
      try {
        parsedFilas = JSON.parse(filas)
      } catch (e) {
        parsedFilas = []
      }
    }

    if (!Array.isArray(parsedColumnas)) {
      parsedColumnas = []
    }

    if (!Array.isArray(parsedFilas)) {
      parsedFilas = []
    }

    const sheet = await Sheet.create({
      proyectoId: parseInt(proyectoId),
      nombre: nombre.trim(),
      columnas: parsedColumnas,
      filas: parsedFilas
    })
    
    console.log('Sheet creado exitosamente:', sheet.id)
    res.status(201).json(sheet)
  } catch (error) {
    console.error('Error creando sheet:', error)
    res.status(500).json({ error: error.message || 'Error al crear el sheet' })
  }
})

// PUT update sheet
router.put('/:id', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id)
    const sheet = await Sheet.findByPk(sheetId)
    
    if (!sheet) {
      return res.status(404).json({ error: 'Sheet no encontrado' })
    }

    const {
      nombre,
      columnas,
      filas
    } = req.body

    console.log('PUT /sheets/:id - Actualizando sheet:', sheetId)

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del sheet es obligatorio' })
    }

    // Validar y parsear columnas y filas si vienen como strings
    let parsedColumnas = columnas
    let parsedFilas = filas

    if (typeof columnas === 'string') {
      try {
        parsedColumnas = columnas.trim() ? JSON.parse(columnas) : []
      } catch (e) {
        parsedColumnas = sheet.columnas || []
      }
    }

    if (typeof filas === 'string') {
      try {
        parsedFilas = filas.trim() ? JSON.parse(filas) : []
      } catch (e) {
        parsedFilas = sheet.filas || []
      }
    }

    if (!Array.isArray(parsedColumnas)) {
      parsedColumnas = sheet.columnas || []
    }

    if (!Array.isArray(parsedFilas)) {
      parsedFilas = sheet.filas || []
    }

    await sheet.update({
      nombre: nombre.trim(),
      columnas: parsedColumnas,
      filas: parsedFilas
    })
    
    console.log('Sheet actualizado exitosamente:', sheetId)
    res.json(sheet)
  } catch (error) {
    console.error('Error actualizando sheet:', error)
    res.status(500).json({ error: error.message || 'Error al actualizar el sheet' })
  }
})

// DELETE sheet
router.delete('/:id', async (req, res) => {
  try {
    const sheet = await Sheet.findByPk(req.params.id)
    if (!sheet) {
      return res.status(404).json({ error: 'Sheet no encontrado' })
    }
    await sheet.destroy()
    res.json({ message: 'Sheet eliminado' })
  } catch (error) {
    console.error('Error eliminando sheet:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
