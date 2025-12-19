import express from 'express'
import { Map } from '../models/index.js'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

const router = express.Router()

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'locationapp/maps',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
})

const upload = multer({ storage })

// GET /api/maps - Obtener todos los mapas
router.get('/', async (req, res) => {
  try {
    const maps = await Map.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(maps)
  } catch (error) {
    console.error('Error obteniendo mapas:', error)
    res.status(500).json({ error: 'Error al obtener los mapas' })
  }
})

// GET /api/maps/:id - Obtener un mapa por ID
router.get('/:id', async (req, res) => {
  try {
    const map = await Map.findByPk(req.params.id)
    if (!map) {
      return res.status(404).json({ error: 'Mapa no encontrado' })
    }
    res.json(map)
  } catch (error) {
    console.error('Error obteniendo mapa:', error)
    res.status(500).json({ error: 'Error al obtener el mapa' })
  }
})

// POST /api/maps - Crear un nuevo mapa
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, imageWidth, imageHeight, scale, workArea, objects, objectLibrary } = req.body

    if (!nombre || !req.file) {
      return res.status(400).json({ error: 'Nombre e imagen son requeridos' })
    }

    const imagenUrl = req.file.path

    // Parsear JSON de forma segura
    let parsedWorkArea = null
    let parsedObjects = []
    let parsedObjectLibrary = []
    
    try {
      if (workArea && workArea.trim() !== '') {
        parsedWorkArea = JSON.parse(workArea)
      }
    } catch (e) {
      console.error('Error parseando workArea:', e)
    }
    
    try {
      if (objects && objects.trim() !== '') {
        parsedObjects = JSON.parse(objects)
      }
    } catch (e) {
      console.error('Error parseando objects:', e)
    }
    
    try {
      if (objectLibrary && objectLibrary.trim() !== '') {
        parsedObjectLibrary = JSON.parse(objectLibrary)
      }
    } catch (e) {
      console.error('Error parseando objectLibrary:', e)
    }

    const map = await Map.create({
      nombre,
      descripcion: descripcion || '',
      imagenUrl,
      imageWidth: parseInt(imageWidth) || 0,
      imageHeight: parseInt(imageHeight) || 0,
      scale: parseFloat(scale) || 0,
      workArea: parsedWorkArea,
      objects: Array.isArray(parsedObjects) ? parsedObjects : [],
      objectLibrary: Array.isArray(parsedObjectLibrary) ? parsedObjectLibrary : []
    })

    res.status(201).json(map)
  } catch (error) {
    console.error('Error creando mapa:', error)
    res.status(500).json({ error: 'Error al crear el mapa' })
  }
})

// PUT /api/maps/:id - Actualizar un mapa
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const map = await Map.findByPk(req.params.id)
    if (!map) {
      return res.status(404).json({ error: 'Mapa no encontrado' })
    }

    const { nombre, descripcion, imageWidth, imageHeight, scale, workArea, objects, objectLibrary } = req.body

    // Parsear JSON de forma segura
    let parsedWorkArea = map.workArea
    let parsedObjects = map.objects
    let parsedObjectLibrary = map.objectLibrary
    
    if (workArea !== undefined) {
      try {
        if (workArea && workArea.trim() !== '') {
          parsedWorkArea = JSON.parse(workArea)
        } else {
          parsedWorkArea = null
        }
      } catch (e) {
        console.error('Error parseando workArea:', e)
      }
    }
    
    if (objects !== undefined) {
      try {
        if (objects && objects.trim() !== '') {
          parsedObjects = JSON.parse(objects)
        } else {
          parsedObjects = []
        }
      } catch (e) {
        console.error('Error parseando objects:', e)
      }
    }
    
    if (objectLibrary !== undefined) {
      try {
        if (objectLibrary && objectLibrary.trim() !== '') {
          parsedObjectLibrary = JSON.parse(objectLibrary)
        } else {
          parsedObjectLibrary = []
        }
      } catch (e) {
        console.error('Error parseando objectLibrary:', e)
      }
    }

    const updateData = {
      nombre: nombre || map.nombre,
      descripcion: descripcion !== undefined ? descripcion : map.descripcion,
      imageWidth: imageWidth ? parseInt(imageWidth) : map.imageWidth,
      imageHeight: imageHeight ? parseInt(imageHeight) : map.imageHeight,
      scale: scale !== undefined ? parseFloat(scale) : map.scale,
      workArea: parsedWorkArea,
      objects: Array.isArray(parsedObjects) ? parsedObjects : [],
      objectLibrary: Array.isArray(parsedObjectLibrary) ? parsedObjectLibrary : []
    }

    if (req.file) {
      updateData.imagenUrl = req.file.path
    }

    await map.update(updateData)
    res.json(map)
  } catch (error) {
    console.error('Error actualizando mapa:', error)
    res.status(500).json({ error: 'Error al actualizar el mapa' })
  }
})

// DELETE /api/maps/:id - Eliminar un mapa
router.delete('/:id', async (req, res) => {
  try {
    const map = await Map.findByPk(req.params.id)
    if (!map) {
      return res.status(404).json({ error: 'Mapa no encontrado' })
    }

    // Eliminar imagen de Cloudinary si existe
    if (map.imagenUrl) {
      try {
        const publicId = map.imagenUrl.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '')
        await cloudinary.uploader.destroy(publicId)
      } catch (cloudinaryError) {
        console.error('Error eliminando imagen de Cloudinary:', cloudinaryError)
      }
    }

    await map.destroy()
    res.json({ message: 'Mapa eliminado correctamente' })
  } catch (error) {
    console.error('Error eliminando mapa:', error)
    res.status(500).json({ error: 'Error al eliminar el mapa' })
  }
})

export default router

