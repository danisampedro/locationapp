import express from 'express'
import { Capa } from '../models/index.js'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Configurar multer para archivos GeoJSON, KML, Shapefile
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

// GET /api/visor/capas - Obtener todas las capas activas (público)
router.get('/capas', async (req, res) => {
  try {
    const capas = await Capa.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'tipo', 'fuente', 'fechaDatos', 'normativa', 'tipoPermiso', 'observaciones', 'geometria', 'color', 'opacidad']
    })
    res.json(capas)
  } catch (error) {
    console.error('Error obteniendo capas:', error)
    res.status(500).json({ error: 'Error al obtener las capas' })
  }
})

// GET /api/visor/consulta - Consultar zonas que contienen un punto
router.get('/consulta', async (req, res) => {
  try {
    const { lat, lng } = req.query
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Se requieren las coordenadas lat y lng' })
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: 'Las coordenadas deben ser números válidos' })
    }

    // Obtener todas las capas activas
    const capas = await Capa.findAll({
      where: { activa: true },
      attributes: ['id', 'nombre', 'tipo', 'fuente', 'normativa', 'tipoPermiso', 'observaciones', 'geometria']
    })

    // Filtrar capas que contienen el punto
    // Nota: La verificación exacta se hace en el frontend con Leaflet
    // Aquí devolvemos todas las capas y el frontend verificará cuáles contienen el punto
    const resultado = {
      coordenadas: { lat: latNum, lng: lngNum },
      capas: capas.map(capa => ({
        id: capa.id,
        nombre: capa.nombre,
        tipo: capa.tipo,
        fuente: capa.fuente,
        normativa: capa.normativa,
        tipoPermiso: capa.tipoPermiso,
        observaciones: capa.observaciones,
        geometria: capa.geometria
      }))
    }

    res.json(resultado)
  } catch (error) {
    console.error('Error en consulta:', error)
    res.status(500).json({ error: 'Error al realizar la consulta' })
  }
})

// ========== RUTAS DE ADMINISTRACIÓN (solo admin) ==========

// GET /api/visor/admin/capas - Obtener todas las capas (admin)
router.get('/admin/capas', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }

    const capas = await Capa.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(capas)
  } catch (error) {
    console.error('Error obteniendo capas (admin):', error)
    res.status(500).json({ error: 'Error al obtener las capas' })
  }
})

// POST /api/visor/admin/upload - Subir una nueva capa (admin)
router.post('/admin/upload', authMiddleware, upload.single('archivo'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }

    const { nombre, tipo, fuente, fechaDatos, normativa, tipoPermiso, observaciones, color, opacidad, geometria } = req.body

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la capa es requerido' })
    }

    let geometriaData = null

    // Si se subió un archivo, procesarlo
    if (req.file) {
      const fs = await import('fs')
      const path = await import('path')
      
      try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8')
        const ext = path.extname(req.file.originalname).toLowerCase()

        if (ext === '.geojson' || ext === '.json') {
          geometriaData = JSON.parse(fileContent)
        } else if (ext === '.kml') {
          // Para KML necesitaríamos una librería como @mapbox/togeojson
          // Por ahora, requerimos que se pase la geometría directamente
          return res.status(400).json({ error: 'Formato KML no soportado aún. Por favor, convierte a GeoJSON.' })
        } else {
          return res.status(400).json({ error: 'Formato de archivo no soportado. Use GeoJSON (.geojson, .json)' })
        }

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path)
      } catch (error) {
        console.error('Error procesando archivo:', error)
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(400).json({ error: 'Error al procesar el archivo. Asegúrate de que sea un GeoJSON válido.' })
      }
    } else if (geometria) {
      // Si se pasó la geometría directamente en el body
      try {
        geometriaData = typeof geometria === 'string' ? JSON.parse(geometria) : geometria
      } catch (error) {
        return res.status(400).json({ error: 'Error al parsear la geometría. Debe ser un GeoJSON válido.' })
      }
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo GeoJSON o geometría en el body' })
    }

    // Validar que sea un GeoJSON válido
    if (!geometriaData || !geometriaData.type) {
      return res.status(400).json({ error: 'La geometría debe ser un GeoJSON válido' })
    }

    const capa = await Capa.create({
      nombre,
      tipo: tipo || 'personalizada',
      fuente: fuente || '',
      fechaDatos: fechaDatos ? new Date(fechaDatos) : null,
      normativa: normativa || '',
      tipoPermiso: tipoPermiso || 'permitido',
      observaciones: observaciones || '',
      geometria: geometriaData,
      color: color || '#3b82f6',
      opacidad: opacidad ? parseFloat(opacidad) : 0.5,
      activa: true
    })

    res.status(201).json(capa)
  } catch (error) {
    console.error('Error creando capa:', error)
    res.status(500).json({ error: 'Error al crear la capa' })
  }
})

// PUT /api/visor/admin/capas/:id - Actualizar una capa (admin)
router.put('/admin/capas/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }

    const capa = await Capa.findByPk(req.params.id)
    if (!capa) {
      return res.status(404).json({ error: 'Capa no encontrada' })
    }

    const { nombre, tipo, fuente, fechaDatos, normativa, tipoPermiso, observaciones, color, opacidad, activa, geometria } = req.body

    const updateData = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (tipo !== undefined) updateData.tipo = tipo
    if (fuente !== undefined) updateData.fuente = fuente
    if (fechaDatos !== undefined) updateData.fechaDatos = fechaDatos ? new Date(fechaDatos) : null
    if (normativa !== undefined) updateData.normativa = normativa
    if (tipoPermiso !== undefined) updateData.tipoPermiso = tipoPermiso
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (color !== undefined) updateData.color = color
    if (opacidad !== undefined) updateData.opacidad = parseFloat(opacidad)
    if (activa !== undefined) updateData.activa = activa === true || activa === 'true'
    if (geometria !== undefined) {
      try {
        updateData.geometria = typeof geometria === 'string' ? JSON.parse(geometria) : geometria
      } catch (error) {
        return res.status(400).json({ error: 'Error al parsear la geometría' })
      }
    }

    await capa.update(updateData)
    res.json(capa)
  } catch (error) {
    console.error('Error actualizando capa:', error)
    res.status(500).json({ error: 'Error al actualizar la capa' })
  }
})

// DELETE /api/visor/admin/capas/:id - Eliminar una capa (admin)
router.delete('/admin/capas/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }

    const capa = await Capa.findByPk(req.params.id)
    if (!capa) {
      return res.status(404).json({ error: 'Capa no encontrada' })
    }

    await capa.destroy()
    res.json({ message: 'Capa eliminada correctamente' })
  } catch (error) {
    console.error('Error eliminando capa:', error)
    res.status(500).json({ error: 'Error al eliminar la capa' })
  }
})

export default router

