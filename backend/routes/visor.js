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

// Bounding box de Mallorca (aproximado, incluyendo ARTA)
// Latitud: 39.2 a 40.0
// Longitud: 2.3 a 3.4 (ampliado para incluir ARTA en el noreste)
const MALLORCA_BBOX = {
  minLat: 39.2,
  maxLat: 40.0,
  minLng: 2.3,
  maxLng: 3.4
}

// Función para verificar si un punto está dentro del bounding box de Mallorca
const pointInMallorcaBBOX = (lng, lat) => {
  return lat >= MALLORCA_BBOX.minLat && 
         lat <= MALLORCA_BBOX.maxLat && 
         lng >= MALLORCA_BBOX.minLng && 
         lng <= MALLORCA_BBOX.maxLng
}

// Función para calcular el centroide de una geometría
const calculateCentroid = (geometry) => {
  if (!geometry || !geometry.coordinates) return null

  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates

    case 'Polygon':
      // Calcular centroide del polígono (promedio de coordenadas del anillo exterior)
      const coords = geometry.coordinates[0]
      let sumLng = 0
      let sumLat = 0
      let count = 0
      
      for (const coord of coords) {
        sumLng += coord[0]
        sumLat += coord[1]
        count++
      }
      
      return count > 0 ? [sumLng / count, sumLat / count] : null

    case 'MultiPolygon':
      // Calcular centroide del primer polígono (más representativo)
      if (geometry.coordinates[0] && geometry.coordinates[0][0]) {
        const coords = geometry.coordinates[0][0]
        let sumLng = 0
        let sumLat = 0
        let count = 0
        
        for (const coord of coords) {
          sumLng += coord[0]
          sumLat += coord[1]
          count++
        }
        
        return count > 0 ? [sumLng / count, sumLat / count] : null
      }
      return null

    case 'LineString':
      // Calcular centroide de la línea (promedio de puntos)
      let sumLng2 = 0
      let sumLat2 = 0
      let count2 = 0
      for (const coord of geometry.coordinates) {
        sumLng2 += coord[0]
        sumLat2 += coord[1]
        count2++
      }
      return count2 > 0 ? [sumLng2 / count2, sumLat2 / count2] : null

    default:
      return null
  }
}

// Función mejorada para verificar si una geometría está realmente en Mallorca
// Verifica el centroide en lugar de solo si algún punto está dentro
const geometryInMallorca = (geometry) => {
  if (!geometry || !geometry.type) return false

  // Calcular centroide
  const centroid = calculateCentroid(geometry)
  if (!centroid) {
    // Si no podemos calcular centroide, usar el método anterior como fallback
    return geometryIntersectsMallorca(geometry)
  }

  const [lng, lat] = centroid
  return pointInMallorcaBBOX(lng, lat)
}

// Función para verificar si una geometría intersecta con el bounding box de Mallorca (método anterior, usado como fallback)
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
      return geometryInMallorca(feature.geometry)
    })

    console.log(`📊 Filtrado GeoJSON: ${originalCount} features originales → ${filteredFeatures.length} features de Mallorca`)

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    }
  }

  // Si es un Feature, verificar si está en Mallorca
  if (geojson.type === 'Feature') {
    if (!geometryInMallorca(geojson.geometry)) {
      throw new Error('La feature no está dentro del área de Mallorca')
    }
    return geojson
  }

  // Si es una Geometry directa, verificar
  if (geometryInMallorca(geojson)) {
    return geojson
  }

  throw new Error('La geometría no está dentro del área de Mallorca')
}

// Función para procesar GeoJSON de forma más eficiente para archivos grandes
// Procesa features una por una para minimizar uso de memoria intermedia
const processGeoJSONStream = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const fileSizeMB = Buffer.byteLength(fileContent, 'utf8') / 1024 / 1024
      console.log(`📤 Archivo leído: ${fileSizeMB.toFixed(2)}MB, ahora parseando y filtrando...`)
      
      // Parsear JSON (esto aún requiere memoria, pero es necesario para validar estructura)
      const geojson = JSON.parse(fileContent)
      
      if (!geojson || geojson.type !== 'FeatureCollection') {
        reject(new Error('El archivo debe ser un FeatureCollection válido'))
        return
      }
      
      const originalCount = geojson.features?.length || 0
      console.log(`📤 Procesando ${originalCount} features...`)
      
      // Filtrar features una por una para minimizar uso de memoria intermedia
      const filteredFeatures = []
      for (let i = 0; i < geojson.features.length; i++) {
        const feature = geojson.features[i]
        if (feature && feature.geometry) {
          if (geometryInMallorca(feature.geometry)) {
            filteredFeatures.push(feature)
          }
        }
        // Log de progreso cada 1000 features
        if ((i + 1) % 1000 === 0) {
          console.log(`📊 Procesadas ${i + 1}/${originalCount} features... (${filteredFeatures.length} de Mallorca hasta ahora)`)
        }
      }
      
      console.log(`✅ Filtrado completado: ${originalCount} features originales → ${filteredFeatures.length} features de Mallorca`)
      
      resolve({
        type: 'FeatureCollection',
        features: filteredFeatures
      })
    } catch (error) {
      reject(new Error(`Error procesando GeoJSON: ${error.message}`))
    }
  })
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
      order: [['grupo', 'ASC'], ['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'tipo', 'fuente', 'fechaDatos', 'normativa', 'tipoPermiso', 'observaciones', 'geometria', 'color', 'opacidad', 'grupo', 'informacionExtra']
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
          order: [['grupo', 'ASC'], ['nombre', 'ASC']]
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
      const ext = path.extname(req.file.originalname).toLowerCase()
      console.log('📤 Leyendo archivo:', req.file.path)
      console.log('📤 Tamaño del archivo en disco:', req.file.size, 'bytes')
      console.log('📤 Extensión del archivo:', ext)

      if (ext !== '.geojson' && ext !== '.json') {
        if (ext === '.kml') {
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
      }

      try {
        const fileSizeMB = req.file.size / 1024 / 1024
        const useStreaming = fileSizeMB > 100 // Usar streaming para archivos mayores a 100MB

        if (useStreaming) {
          console.log(`📤 Procesando archivo grande (${fileSizeMB.toFixed(2)}MB) usando streaming...`)
          const startProcess = Date.now()
          
          geometriaData = await processGeoJSONStream(req.file.path)
          
          const processTime = Date.now() - startProcess
          console.log(`✅ GeoJSON procesado en streaming en ${processTime}ms`)
        } else {
          console.log(`📤 Procesando archivo (${fileSizeMB.toFixed(2)}MB) en memoria...`)
          const startParse = Date.now()
          
          const fileContent = fs.readFileSync(req.file.path, 'utf8')
          geometriaData = JSON.parse(fileContent)
          
          const parseTime = Date.now() - startParse
          console.log(`✅ GeoJSON parseado correctamente en ${parseTime}ms, tipo:`, geometriaData.type)
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

    // Si el archivo ya fue procesado en streaming, ya está filtrado
    // Si no, filtrarlo ahora
    if (!req.file || (req.file.size / 1024 / 1024) <= 100) {
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
    } else {
      console.log('✅ GeoJSON ya filtrado durante el procesamiento en streaming')
    }

    console.log('📤 Creando capa(s) en la base de datos...')
    console.log('📤 Geometría preparada (filtrada para Mallorca), tipo:', geometriaData?.type)
    
    try {
      const startCreate = Date.now()
      
      // Si es un FeatureCollection con múltiples features, crear una capa por feature
      if (geometriaData.type === 'FeatureCollection' && geometriaData.features && geometriaData.features.length > 1) {
        console.log(`📤 Detectado FeatureCollection con ${geometriaData.features.length} features. Creando capas independientes...`)
        
        const capasCreadas = []
        
        // Usar el nombre base como grupo para todas las capas relacionadas
        const grupoNombre = nombre
        
        for (let i = 0; i < geometriaData.features.length; i++) {
          const feature = geometriaData.features[i]
          
          // Obtener nombre del municipio de las properties
          const nombreMunicipio = feature.properties?.nombre || 
                                 feature.properties?.name || 
                                 feature.properties?.NOMBRE || 
                                 feature.properties?.NAME ||
                                 feature.properties?.NOM || 
                                 feature.properties?.NOMBRE_ACT ||
                                 `Municipio ${i + 1}`
          
          const nombreCapa = `${nombre} - ${nombreMunicipio}`
          
          try {
            const capa = await Capa.create({
              nombre: nombreCapa,
              tipo: tipo || 'municipio',
              fuente: fuente || '',
              fechaDatos: fechaDatos ? new Date(fechaDatos) : null,
              normativa: normativa || '',
              tipoPermiso: tipoPermiso || 'permitido',
              observaciones: observaciones || '',
              geometria: {
                type: 'FeatureCollection',
                features: [feature]
              },
              color: color || '#3b82f6',
              opacidad: opacidad ? parseFloat(opacidad) : 0.5,
              grupo: grupoNombre, // Agrupar todas las capas relacionadas
              informacionExtra: '',
              activa: true
            })
            
            capasCreadas.push(capa)
            console.log(`✅ Capa ${i + 1}/${geometriaData.features.length} creada: ${nombreCapa} (ID: ${capa.id})`)
          } catch (error) {
            console.error(`❌ Error creando capa para ${nombreMunicipio}:`, error)
          }
        }
        
        const createTime = Date.now() - startCreate
        console.log(`✅ Total de ${capasCreadas.length} capas creadas en ${createTime}ms`)
        
        return res.status(201).json({ 
          message: `Se crearon ${capasCreadas.length} capas independientes`,
          capas: capasCreadas,
          total: capasCreadas.length
        })
      }
      
      // Si no es un FeatureCollection con múltiples features, crear una sola capa como antes
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

    const { nombre, tipo, fuente, fechaDatos, normativa, tipoPermiso, observaciones, color, opacidad, activa, geometria, grupo, informacionExtra } = req.body

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
    if (grupo !== undefined) updateData.grupo = grupo || null
    if (informacionExtra !== undefined) updateData.informacionExtra = informacionExtra || ''
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

