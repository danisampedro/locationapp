import express from 'express'
import ContractDocument from '../models/ContractDocument.js'

const router = express.Router()

// GET all contract documents for a project
router.get('/project/:proyectoId', async (req, res) => {
  try {
    const { proyectoId } = req.params
    const documents = await ContractDocument.findAll({
      where: { proyectoId },
      order: [['createdAt', 'DESC']]
    })
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single contract document
router.get('/:id', async (req, res) => {
  try {
    const document = await ContractDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento de contrato no encontrado' })
    }
    res.json(document)
  } catch (error) {
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

    if (!proyectoId || !nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El proyecto y el nombre son obligatorios' })
    }

    const document = await ContractDocument.create({
      proyectoId: parseInt(proyectoId),
      nombre: nombre.trim(),
      textoEspanol: textoEspanol || '',
      textoIngles: textoIngles || ''
    })
    res.status(201).json(document)
  } catch (error) {
    console.error('Error creando documento de contrato:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update contract document
router.put('/:id', async (req, res) => {
  try {
    const document = await ContractDocument.findByPk(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Documento de contrato no encontrado' })
    }

    const {
      nombre,
      textoEspanol,
      textoIngles
    } = req.body

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    await document.update({
      nombre: nombre.trim(),
      textoEspanol: textoEspanol || '',
      textoIngles: textoIngles || ''
    })
    res.json(document)
  } catch (error) {
    console.error('Error actualizando documento de contrato:', error)
    res.status(500).json({ error: error.message })
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

