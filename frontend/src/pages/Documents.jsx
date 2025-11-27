import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import axios, { API_URL } from '../config/axios.js'

export default function Documents() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadProyecto()
  }, [id])

  const loadProyecto = async () => {
    try {
      const response = await axios.get(`${API_URL}/proyectos/${id}`, { withCredentials: true })
      setProyecto(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error cargando proyecto:', error)
      setLoading(false)
    }
  }

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (error) => {
        console.error('Error cargando imagen:', url, error)
        reject(error)
      }
      // Añadir parámetro para evitar problemas de caché
      img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
    })
  }

  const generateLocationListPDF = async () => {
    if (!proyecto || !proyecto.Locations || proyecto.Locations.length === 0) {
      alert('Este proyecto no tiene locations asignadas')
      return
    }

    setGenerating(true)

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPosition = margin

      // ===== ENCABEZADO =====
      // Logo del proyecto (si existe)
      if (proyecto.logoUrl) {
        try {
          const logoImg = await loadImage(proyecto.logoUrl)
          const logoWidth = 30
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth
          doc.addImage(logoImg, 'PNG', margin, yPosition, logoWidth, logoHeight)
          yPosition += logoHeight + 5
        } catch (error) {
          console.error('Error cargando logo:', error)
        }
      }

      // Nombre del proyecto
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(proyecto.nombre, margin, yPosition)
      yPosition += 10

      // Información del proyecto
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      if (proyecto.projectDate) {
        doc.text(`Fecha del proyecto: ${new Date(proyecto.projectDate).toLocaleDateString('es-ES')}`, margin, yPosition)
        yPosition += 6
      }

      if (proyecto.company) {
        doc.text(`Empresa: ${proyecto.company}`, margin, yPosition)
        yPosition += 6
      }

      if (proyecto.cif) {
        doc.text(`CIF: ${proyecto.cif}`, margin, yPosition)
        yPosition += 6
      }

      if (proyecto.address) {
        doc.text(`Dirección: ${proyecto.address}`, margin, yPosition)
        yPosition += 6
      }

      // Línea separadora
      yPosition += 5
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // ===== LOCATIONS =====
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Lista de Localizaciones', margin, yPosition)
      yPosition += 10

      for (let i = 0; i < proyecto.Locations.length; i++) {
        const location = proyecto.Locations[i]

        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 100) {
          doc.addPage()
          yPosition = margin
        }

        // Foto de la location (si existe)
        const imageX = margin
        const imageY = yPosition
        const imageWidth = 60
        const imageHeight = 60

        if (location.imagenes && location.imagenes.length > 0) {
          try {
            const firstImage = Array.isArray(location.imagenes) 
              ? location.imagenes[0] 
              : typeof location.imagenes === 'string' 
                ? JSON.parse(location.imagenes)[0] 
                : location.imagenes
            
            if (firstImage) {
              const locationImg = await loadImage(firstImage)
              doc.addImage(locationImg, 'JPEG', imageX, imageY, imageWidth, imageHeight)
            }
          } catch (error) {
            console.error('Error cargando imagen de location:', error)
            // Dibujar un rectángulo placeholder
            doc.setFillColor(240, 240, 240)
            doc.rect(imageX, imageY, imageWidth, imageHeight, 'F')
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('Sin imagen', imageX + 15, imageY + imageHeight / 2)
            doc.setTextColor(0, 0, 0)
          }
        } else {
          // Dibujar un rectángulo placeholder
          doc.setFillColor(240, 240, 240)
          doc.rect(imageX, imageY, imageWidth, imageHeight, 'F')
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('Sin imagen', imageX + 15, imageY + imageHeight / 2)
          doc.setTextColor(0, 0, 0)
        }

        // Información de la location (a la derecha de la foto)
        const infoX = margin + imageWidth + 10
        let infoY = imageY

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(location.nombre, infoX, infoY)
        infoY += 7

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        if (location.direccion) {
          doc.text(`📍 ${location.direccion}`, infoX, infoY)
          infoY += 6
        }

        if (location.descripcion) {
          const descLines = doc.splitTextToSize(location.descripcion, pageWidth - infoX - margin)
          doc.text(descLines, infoX, infoY)
          infoY += descLines.length * 5
        }

        // Información de contacto (solo si es Private)
        if (location.tipo === 'private' || !location.tipo) {
          if (location.contact) {
            doc.text(`Contacto: ${location.contact}`, infoX, infoY)
            infoY += 6
          }
          if (location.phoneNumber) {
            doc.text(`Teléfono: ${location.phoneNumber}`, infoX, infoY)
            infoY += 6
          }
          if (location.mail) {
            doc.text(`Email: ${location.mail}`, infoX, infoY)
            infoY += 6
          }
          if (location.googleMapsLink) {
            doc.setTextColor(0, 0, 255)
            doc.text('Google Maps', infoX, infoY)
            doc.setTextColor(0, 0, 0)
            infoY += 6
          }
        }

        // Espacio para la próxima location
        yPosition = Math.max(imageY + imageHeight, infoY) + 15

        // Línea separadora entre locations
        if (i < proyecto.Locations.length - 1) {
          doc.setDrawColor(220, 220, 220)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
        }
      }

      // Guardar PDF
      const fileName = `Location_List_${proyecto.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf`
      doc.save(fileName)
      
      setGenerating(false)
      alert('PDF generado exitosamente')
    } catch (error) {
      console.error('Error generando PDF:', error)
      setGenerating(false)
      alert('Error al generar el PDF. Por favor, intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando...</div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Proyecto no encontrado</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/proyectos/${id}`)}
          className="text-gray-600 hover:text-gray-800 text-xl"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Documentos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Plantillas de Documentos</h2>
          <p className="text-gray-600 text-sm">
            Genera documentos PDF basados en la información del proyecto: <strong>{proyecto.nombre}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Plantilla Location List */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Location List</h3>
                <p className="text-xs text-gray-500">Lista de localizaciones</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Exporta todas las localizaciones del proyecto en formato PDF con fotos e información detallada.
            </p>
            <button
              onClick={generateLocationListPDF}
              disabled={generating || !proyecto.Locations || proyecto.Locations.length === 0}
              className="w-full bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar PDF
                </>
              )}
            </button>
            {(!proyecto.Locations || proyecto.Locations.length === 0) && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Este proyecto no tiene locations asignadas
              </p>
            )}
          </div>

          {/* Espacio para futuras plantillas */}
          <div className="border border-gray-200 border-dashed rounded-lg p-6 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Más plantillas próximamente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

