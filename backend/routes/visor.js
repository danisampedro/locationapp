import express from 'express'
import { Capa } from '../models/index.js'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Nota: authMiddleware se aplica globalmente en server.js para todas las rutas /api/visor

const router = express.Router()

// Asegurar que el directorio uploads existe
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('✅ Directorio uploads creado:', uploadsDir)
}

// Configurar multer para archivos GeoJSON, KML, Shapefile
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 700 * 1024 * 1024 } // 700MB (para archivos grandes que se filtrarán)
})

// Bounding box de Mallorca (aproximado)
// Latitud: 39.2 a 40.0
// Longitud: 2.3 a 3.2
const MALLORCA_BBOX = {
  minLat: 39.2,
  maxLat: 40.0,
  minLng: 2.3,
  maxLng: 3.2
}

// Función para verificar si un punto está dentro del bounding box de Mallorca
const pointInMallorcaBBOX = (lng, lat) => {
  return lat >= MALLORCA_BBOX.minLat && 
         lat <= MALLORCA_BBOX.maxLat && 
         lng >= MALLORCA_BBOX.minLng && 
         lng <= MALLORCA_BBOX.maxLng
}

// Función para verificar si una geometría intersecta con el bounding box de Mallorca
const geometryIntersectsMallorca = (geometry) => {
  if (!geometry || !geometry.type) return false

  switch (geometry.type) {
    case 'Point':
      const [lng, lat] = geometry.coordinates
      return pointInMallorcaBBOX(lng, lat)

    case 'Polygon':
      // Verificar si alguno de los puntos del polígono está en Mallorca
      // coordinates[0] es el anillo exterior del polígono
      return geometry.coordinates[0].some(coord => {
        const [lng, lat] = coord
        return pointInMallorcaBBOX(lng, lat)
      })

    case 'MultiLineString':
      // Verificar si alguna de las líneas tiene puntos en Mallorca
      return geometry.coordinates.some(lineString => 
        lineString.some(coord => {
          const [lng, lat] = coord
          return pointInMallorcaBBOX(lng, lat)
        })
      )

    case 'MultiPolygon':
      return geometry.coordinates.some(polygon => 
        polygon[0].some(coord => {
          const [lng, lat] = coord
          return pointInMallorcaBBOX(lng, lat)
        })
      )

    case 'LineString':
      return geometry.coordinates.some(coord => {
        const [lng, lat] = coord
        return pointInMallorcaBBOX(lng, lat)
      })

    case 'GeometryCollection':
      return geometry.geometries.some(geom => geometryIntersectsMallorca(geom))

    default:
      // Para otros tipos, intentar verificar coordenadas si existen
      if (geometry.coordinates) {
        const coords = Array.isArray(geometry.coordinates[0]) 
          ? geometry.coordinates.flat(2)
          : geometry.coordinates
        if (coords.length >= 2) {
          const [lng, lat] = coords
          return pointInMallorcaBBOX(lng, lat)
        }
      }
      return false
  }
}

// Función para filtrar un GeoJSON y extraer solo las features dentro de Mallorca
const filterGeoJSONForMallorca = (geojson) => {
  if (!geojson || !geojson.type) {
    throw new Error('GeoJSON inválido')
  }

  // Si es un FeatureCollection, filtrar las features
  if (geojson.type === 'FeatureCollection') {
    const originalCount = geojson.features?.length || 0
    const filteredFeatures = geojson.features.filter(feature => {
      if (!feature.geometry) return false
      return geometryIntersectsMallorca(feature.geometry)
    })

    console.log(`📊 Filtrado GeoJSON: ${originalCount} features originales → ${filteredFeatures.length} features de Mallorca`)

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    }
  }

  // Si es un Feature, verificar si está en Mallorca
  if (geojson.type === 'Feature') {
    if (!geometryIntersectsMallorca(geojson.geometry)) {
      throw new Error('La feature no está dentro del área de Mallorca')
    }
    return geojson
  }

  // Si es una Geometry directa, verificar
  if (geometryIntersectsMallorca(geojson)) {
    return geojson
  }

  throw new Error('La geometría no está dentro del área de Mallorca')
}

// Logging de diagnóstico - verificar que el router se carga
console.log('✅ Router de visor cargado correctamente')
console.log('✅ Directorio de uploads:', uploadsDir)
console.log('✅ Bounding box de Mallorca configurado:', MALLORCA_BBOX)

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
// authMiddleware ya se aplica en server.js para todas las rutas /api/visor
router.get('/admin/capas', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
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
// authMiddleware ya se aplica en server.js para todas las rutas /api/visor
router.post('/admin/upload', upload.single('archivo'), async (req, res) => {
  console.log('📤 POST /api/visor/admin/upload - Petición recibida')
  console.log('📤 Usuario:', req.user ? req.user.username : 'No autenticado')
  console.log('📤 Body keys:', Object.keys(req.body))
  console.log('📤 File:', req.file ? { name: req.file.originalname, size: req.file.size, path: req.file.path } : 'No file')
  
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Acceso denegado - No es admin')
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }

    const { nombre, tipo, fuente, fechaDatos, normativa, tipoPermiso, observaciones, color, opacidad, geometria } = req.body

    if (!nombre) {
      console.log('❌ Nombre no proporcionado')
      return res.status(400).json({ error: 'El nombre de la capa es requerido' })
    }

    console.log('📤 Procesando capa:', { nombre, tipo, tieneArchivo: !!req.file, tieneGeometria: !!geometria })

    let geometriaData = null

    // Si se subió un archivo, procesarlo
    if (req.file) {
      
      try {
        console.log('📤 Leyendo archivo:', req.file.path)
        console.log('📤 Tamaño del archivo en disco:', req.file.size, 'bytes')
        
        const fileContent = fs.readFileSync(req.file.path, 'utf8')
        console.log('📤 Contenido leído, tamaño:', fileContent.length, 'caracteres')
        
        const ext = path.extname(req.file.originalname).toLowerCase()
        console.log('📤 Extensión del archivo:', ext)

        if (ext === '.geojson' || ext === '.json') {
          console.log('📤 Parseando GeoJSON (puede tardar con archivos grandes)...')
          const startParse = Date.now()
          geometriaData = JSON.parse(fileContent)
          const parseTime = Date.now() - startParse
          console.log(`✅ GeoJSON parseado correctamente en ${parseTime}ms, tipo:`, geometriaData.type)
        } else if (ext === '.kml') {
          // Para KML necesitaríamos una librería como @mapbox/togeojson
          // Por ahora, requerimos que se pase la geometría directamente
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
          }
          return res.status(400).json({ error: 'Formato KML no soportado aún. Por favor, convierte a GeoJSON.' })
        } else {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
          }
          return res.status(400).json({ error: 'Formato de archivo no soportado. Use GeoJSON (.geojson, .json)' })
        }

        // Eliminar archivo temporal
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
          console.log('✅ Archivo temporal eliminado')
        }
      } catch (error) {
        console.error('❌ Error procesando archivo:', error)
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(400).json({ error: 'Error al procesar el archivo. Asegúrate de que sea un GeoJSON válido: ' + error.message })
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

    // Filtrar GeoJSON para extraer solo Mallorca
    console.log('📤 Filtrando GeoJSON para extraer solo Mallorca...')
    const originalSize = JSON.stringify(geometriaData).length
    console.log(`📤 Tamaño original del GeoJSON: ${(originalSize / 1024 / 1024).toFixed(2)}MB`)
    
    try {
      geometriaData = filterGeoJSONForMallorca(geometriaData)
      const filteredSize = JSON.stringify(geometriaData).length
      const reduction = ((1 - filteredSize / originalSize) * 100).toFixed(1)
      console.log(`✅ GeoJSON filtrado: ${(filteredSize / 1024 / 1024).toFixed(2)}MB (reducción del ${reduction}%)`)
    } catch (filterError) {
      console.error('❌ Error filtrando GeoJSON:', filterError.message)
      return res.status(400).json({ 
        error: `Error al filtrar GeoJSON: ${filterError.message}. Asegúrate de que el archivo contenga datos de Mallorca.` 
      })
    }

    console.log('📤 Creando capa en la base de datos...')
    console.log('📤 Geometría preparada (filtrada para Mallorca), tipo:', geometriaData?.type)
    
    try {
      const startCreate = Date.now()
      const capa = await Capa.create({
        nombre,
        tipo: tipo || 'personalizada',
        fuente: fuente || '',
        fechaDatos: fechaDatos ? new Date(fechaDatos) : null,
        normativa: normativa || '',
        tipoPermiso: tipoPermiso || 'permitido',
        observaciones: observaciones || '',
        geometria: geometriaData, // El setter del modelo se encarga de convertir a JSON
        color: color || '#3b82f6',
        opacidad: opacidad ? parseFloat(opacidad) : 0.5,
        activa: true
      })
      const createTime = Date.now() - startCreate

      console.log(`✅ Capa creada exitosamente con ID: ${capa.id} en ${createTime}ms`)
      res.status(201).json(capa)
    } catch (dbError) {
      console.error('❌ Error al crear capa en BD:', dbError)
      console.error('❌ Error name:', dbError.name)
      console.error('❌ Error message:', dbError.message)
      console.error('❌ Error stack:', dbError.stack)
      
      // Si es un error de validación de Sequelize, devolver más detalles
      if (dbError.name === 'SequelizeValidationError' || dbError.name === 'SequelizeDatabaseError') {
        return res.status(400).json({ 
          error: 'Error de validación de base de datos', 
          details: dbError.message,
          name: dbError.name
        })
      }
      
      throw dbError // Re-lanzar para que lo capture el catch externo
    }
  } catch (error) {
    console.error('❌ Error general creando capa:', error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    // Asegurar que siempre respondemos con JSON
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error al crear la capa', 
        message: error.message,
        name: error.name,
        // Solo incluir stack en desarrollo
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      })
    }
  }
})

// PUT /api/visor/admin/capas/:id - Actualizar una capa (admin)
// authMiddleware ya se aplica en server.js para todas las rutas /api/visor
router.put('/admin/capas/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
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
// authMiddleware ya se aplica en server.js para todas las rutas /api/visor
router.delete('/admin/capas/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
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

