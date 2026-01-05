import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', 'config.env') })

import sequelize from '../config/database.js'
import Capa from '../models/Capa.js'

const NOMBRE_GRUPO = 'Linea de deslinde de Dominio Publico mMartimo Terrestre'
const NOMBRE_NUEVA_CAPA = 'Línea de Deslinde de Dominio Público Marítimo Terrestre (Consolidada)'
const ELIMINAR_ORIGINALES = true // Cambiar a false si no quieres eliminar las capas originales

async function consolidarGrupo() {
  try {
    console.log(`📦 Consolidando capas del grupo: "${NOMBRE_GRUPO}"...`)
    
    // Obtener todas las capas del grupo
    const capas = await Capa.findAll({
      where: { grupo: NOMBRE_GRUPO }
    })

    if (capas.length === 0) {
      console.log(`❌ No se encontraron capas en el grupo "${NOMBRE_GRUPO}"`)
      return
    }

    console.log(`✅ Encontradas ${capas.length} capas en el grupo`)
    capas.forEach((capa, index) => {
      console.log(`  ${index + 1}. ${capa.nombre} (ID: ${capa.id})`)
    })

    // Combinar todas las features en una sola FeatureCollection
    const todasLasFeatures = []
    
    for (const capa of capas) {
      let geometria = capa.geometria
      
      // Parsear geometría si es string
      if (typeof geometria === 'string') {
        try {
          geometria = JSON.parse(geometria)
        } catch (e) {
          console.warn(`⚠️ Error parseando geometría de capa ${capa.id} (${capa.nombre}):`, e)
          continue
        }
      }

      // Extraer features según el tipo de geometría
      if (geometria.type === 'FeatureCollection' && geometria.features) {
        todasLasFeatures.push(...geometria.features)
        console.log(`  ✓ Capa "${capa.nombre}": ${geometria.features.length} features añadidas`)
      } else if (geometria.type === 'Feature') {
        todasLasFeatures.push(geometria)
        console.log(`  ✓ Capa "${capa.nombre}": 1 feature añadida`)
      } else if (geometria.type) {
        // Si es una geometría directa, convertirla a Feature
        todasLasFeatures.push({
          type: 'Feature',
          geometry: geometria,
          properties: {}
        })
        console.log(`  ✓ Capa "${capa.nombre}": 1 geometría convertida a feature`)
      }
    }

    console.log(`\n✅ Total de features combinadas: ${todasLasFeatures.length}`)

    // Usar valores de la primera capa como defaults
    const primeraCapa = capas[0]

    // Crear la nueva capa consolidada
    const capaConsolidada = await Capa.create({
      nombre: NOMBRE_NUEVA_CAPA,
      tipo: primeraCapa.tipo || 'personalizada',
      fuente: primeraCapa.fuente || '',
      fechaDatos: primeraCapa.fechaDatos || null,
      normativa: primeraCapa.normativa || '',
      tipoPermiso: primeraCapa.tipoPermiso || 'permitido',
      observaciones: `Consolidada de ${capas.length} capas del grupo "${NOMBRE_GRUPO}": ${capas.map(c => c.nombre).join(', ')}`,
      geometria: {
        type: 'FeatureCollection',
        features: todasLasFeatures
      },
      color: primeraCapa.color || '#3b82f6',
      opacidad: primeraCapa.opacidad || 0.5,
      grupo: NOMBRE_GRUPO, // Mantener el mismo grupo
      informacionExtra: '',
      activa: true
    })

    console.log(`\n✅ Capa consolidada creada exitosamente!`)
    console.log(`   ID: ${capaConsolidada.id}`)
    console.log(`   Nombre: ${capaConsolidada.nombre}`)
    console.log(`   Features: ${todasLasFeatures.length}`)

    // Eliminar capas originales si se solicita
    if (ELIMINAR_ORIGINALES) {
      const idsAEliminar = capas.map(c => c.id)
      const eliminadas = await Capa.destroy({
        where: { id: idsAEliminar }
      })
      console.log(`\n🗑️ ${eliminadas} capas originales eliminadas`)
    } else {
      console.log(`\nℹ️  Las capas originales se mantienen (ELIMINAR_ORIGINALES = false)`)
    }

    console.log(`\n🎉 ¡Consolidación completada exitosamente!`)
    
  } catch (error) {
    console.error('❌ Error consolidando capas:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// Ejecutar el script
consolidarGrupo()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error)
    process.exit(1)
  })

