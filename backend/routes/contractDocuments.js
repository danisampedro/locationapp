import express from 'express'
import ContractDocument from '../models/ContractDocument.js'

const router = express.Router()

// GET all contract documents for a project (debe ir ANTES de /:id para evitar conflictos)
router.get('/project/:proyectoId', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const documents = await ContractDocument.findAll({
      where: { proyectoId: parseInt(proyectoId) },
      order: [['createdAt', 'DESC']]
    })
    res.json(documents)
  } catch (error) {
    console.error('Error obteniendo contratos del proyecto:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single contract document (debe ir DESPUÉS de rutas más específicas)
router.get('/:id', async (req, res) => {
  try {
    const document = await ContractDocument.findByPk(parseInt(req.params.id))
    if (!document) {
      return res.status(404).json({ error: 'Documento de contrato no encontrado' })
    }
    res.json(document)
  } catch (error) {
    console.error('Error obteniendo contrato:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create contract document
router.post('/', async (req, res) => {
  try {
    const {
      proyectoId,
      nombre,
      textoEspanol,
      textoIngles
    } = req.body

    console.log('POST /contract-documents - Body recibido:', { proyectoId, nombre, textoEspanol: textoEspanol?.substring(0, 50), textoIngles: textoIngles?.substring(0, 50) })

    if (!proyectoId) {
      return res.status(400).json({ error: 'El proyecto es obligatorio' })
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del contrato es obligatorio' })
    }

    const document = await ContractDocument.create({
      proyectoId: parseInt(proyectoId),
      nombre: nombre.trim(),
      textoEspanol: textoEspanol || '',
      textoIngles: textoIngles || ''
    })
    
    console.log('Contrato creado exitosamente:', document.id)
    res.status(201).json(document)
  } catch (error) {
    console.error('Error creando documento de contrato:', error)
    res.status(500).json({ error: error.message || 'Error al crear el contrato' })
  }
})

// PUT update contract document
router.put('/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id)
    const document = await ContractDocument.findByPk(documentId)
    
    if (!document) {
      return res.status(404).json({ error: 'Documento de contrato no encontrado' })
    }

    const {
      nombre,
      textoEspanol,
      textoIngles
    } = req.body

    console.log('PUT /contract-documents/:id - Actualizando contrato:', documentId)

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del contrato es obligatorio' })
    }

    await document.update({
      nombre: nombre.trim(),
      textoEspanol: textoEspanol || '',
      textoIngles: textoIngles || ''
    })
    
    console.log('Contrato actualizado exitosamente:', documentId)
    res.json(document)
  } catch (error) {
    console.error('Error actualizando documento de contrato:', error)
    res.status(500).json({ error: error.message || 'Error al actualizar el contrato' })
  }
})

// DELETE contract document
router.delete('/:id', async (req, res) => {
  try {
    const document = await ContractDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento de contrato no encontrado' })
    }
    await document.destroy()
    res.json({ message: 'Documento de contrato eliminado' })
  } catch (error) {
    console.error('Error eliminando documento de contrato:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

