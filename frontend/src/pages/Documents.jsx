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
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth() // 210mm
      const pageHeight = doc.internal.pageSize.getHeight() // 297mm
      
      // Márgenes según especificación
      const marginTop = 25
      const marginBottom = 20
      const marginSides = 20
      const usableWidth = pageWidth - (2 * marginSides)
      const usableHeight = pageHeight - marginTop - marginBottom
      
      let yPosition = marginTop

      // ===== CABECERA (HEADER) MODERNA =====
      // Banda superior de color con logo + productora a la izquierda
      // y nombre de proyecto + tipo de documento a la derecha
      const headerHeight = 22
      const headerY = 0
      const logoMaxWidth = 28
      const logoMaxHeight = 14
      const secondaryLogoMaxWidth = 22
      const secondaryLogoMaxHeight = 12
      const secondaryLogoMaxWidth = 22
      const secondaryLogoMaxHeight = 12

      // Banda superior sólida (color corporativo oscuro)
      doc.setFillColor(10, 25, 47)
      doc.rect(0, headerY, pageWidth, headerHeight, 'F')

      // Logo a la izquierda
      let logoBlockWidth = 0
      if (proyecto.logoUrl) {
        try {
          const logoImg = await loadImage(proyecto.logoUrl)
          const aspect = logoImg.width / logoImg.height
          let w = logoMaxWidth
          let h = logoMaxHeight

          if (aspect > (logoMaxWidth / logoMaxHeight)) {
            h = w / aspect
          } else {
            w = h * aspect
          }

          const logoX = marginSides
          const logoY = headerY + (headerHeight - h) / 2
          doc.addImage(logoImg, 'PNG', logoX, logoY, w, h)
          logoBlockWidth = w + 4
        } catch (e) {
          console.error('Error cargando logo:', e)
        }
      }

      // Segundo logo a la derecha (por ahora reutilizamos el mismo logo del proyecto)
      if (proyecto.logoUrl) {
        try {
          const logoImgRight = await loadImage(proyecto.logoUrl)
          const aspectRight = logoImgRight.width / logoImgRight.height
          let wRight = secondaryLogoMaxWidth
          let hRight = secondaryLogoMaxHeight

          if (aspectRight > (secondaryLogoMaxWidth / secondaryLogoMaxHeight)) {
            hRight = wRight / aspectRight
          } else {
            wRight = hRight * aspectRight
          }

          const logoRightX = pageWidth - marginSides - wRight
          const logoRightY = headerY + (headerHeight - hRight) / 2
          doc.addImage(logoImgRight, 'PNG', logoRightX, logoRightY, wRight, hRight)
        } catch (e) {
          console.error('Error cargando segundo logo:', e)
        }
      }

      // Nombre de la productora cerca del logo
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(230, 236, 245)
      const companyText = proyecto.company || 'Productions'
      doc.text(
        companyText,
        marginSides + logoBlockWidth,
        headerY + headerHeight / 2 + 2
      )

      // Proyecto + tipo de documento a la derecha
      const docTypeText = 'LOCATION LIST'
      const projectName = (proyecto.nombre || '').toUpperCase()

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)

      const projectNameWidth = doc.getTextWidth(projectName)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(185, 193, 210)
      const docTypeWidth = doc.getTextWidth(docTypeText)

      const rightPadding = marginSides + secondaryLogoMaxWidth + 4
      const textRightX = pageWidth - rightPadding

      // Tipo de documento (arriba, pequeño, gris claro)
      doc.text(
        docTypeText,
        textRightX - docTypeWidth,
        headerY + 7
      )

      // Nombre de proyecto (debajo, grande, blanco)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(
        projectName,
        textRightX - projectNameWidth,
        headerY + 7 + 6
      )

      // Línea inferior suave para separar encabezado del contenido
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.line(marginSides, headerY + headerHeight + 1, pageWidth - marginSides, headerY + headerHeight + 1)

      // Comenzar el contenido un poco por debajo del header
      yPosition = headerY + headerHeight + 10

      // ===== BLOQUE: INFORMACIÓN DEL PROYECTO =====
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      // Calcular el ancho máximo de las etiquetas para alinear mejor
      const labels = [
        'PRODUCTION COMPANY: ',
        'ADDRESS: ',
        'CIF: ',
        'LOCATION MANAGER: ',
        'LOCATION COORDINATOR: ',
        'ASSISTANT LOCATION MANAGER: ',
        'BASECAMP MANAGER: '
      ]
      doc.setFont('helvetica', 'bold')
      const maxLabelWidth = Math.max(...labels.map(l => doc.getTextWidth(l)))
      const labelX = marginSides
      const valueX = marginSides + maxLabelWidth + 2
      
      // Production Company
      if (proyecto.company) {
        doc.setFont('helvetica', 'bold')
        doc.text('PRODUCTION COMPANY: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.company, valueX, yPosition)
        yPosition += 6
      }

      // Dirección de la compañía
      if (proyecto.address) {
        doc.setFont('helvetica', 'bold')
        doc.text('ADDRESS: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.address, valueX, yPosition)
        yPosition += 6
      }

      // CIF de la compañía
      if (proyecto.cif) {
        doc.setFont('helvetica', 'bold')
        doc.text('CIF: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.cif, valueX, yPosition)
        yPosition += 6
      }

      // Location Manager
      if (proyecto.locationManager) {
        doc.setFont('helvetica', 'bold')
        doc.text('LOCATION MANAGER: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.locationManager, valueX, yPosition)
        yPosition += 6
      }

      // Location Coordinator
      if (proyecto.locationCoordinator) {
        doc.setFont('helvetica', 'bold')
        doc.text('LOCATION COORDINATOR: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.locationCoordinator, valueX, yPosition)
        yPosition += 6
      }

      // Assistant Location Manager
      if (proyecto.assistantLocationManager) {
        doc.setFont('helvetica', 'bold')
        doc.text('ASSISTANT LOCATION MANAGER: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.assistantLocationManager, valueX, yPosition)
        yPosition += 6
      }

      // Basecamp Manager
      if (proyecto.basecampManager) {
        doc.setFont('helvetica', 'bold')
        doc.text('BASECAMP MANAGER: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(proyecto.basecampManager, valueX, yPosition)
        yPosition += 6
      }

      // Espaciado antes de las localizaciones
      yPosition += 10

      // ===== BLOQUES DE LOCALIZACIÓN =====
      for (let i = 0; i < proyecto.Locations.length; i++) {
        const location = proyecto.Locations[i]

        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - marginBottom - 80) {
          doc.addPage()
          yPosition = marginTop
        }

        // Estructura del bloque: Foto 16:9 a la izquierda, datos a la derecha
        const blockStartY = yPosition
        
        // Foto 16:9 (45-48% del ancho útil)
        const imageWidth = usableWidth * 0.46 // ~46% del ancho útil
        const imageHeight = imageWidth * (9 / 16) // Mantener ratio 16:9
        const imageX = marginSides
        const imageY = blockStartY

        // Dibujar foto o placeholder
        if (location.imagenes && location.imagenes.length > 0) {
          try {
            const firstImage = Array.isArray(location.imagenes) 
              ? location.imagenes[0] 
              : typeof location.imagenes === 'string' 
                ? JSON.parse(location.imagenes)[0] 
                : location.imagenes
            
            if (firstImage) {
              const locationImg = await loadImage(firstImage)
              // Forzar siempre formato 16:9 exacto (recortar/centrar si es necesario)
              doc.addImage(locationImg, 'JPEG', imageX, imageY, imageWidth, imageHeight)
            }
          } catch (error) {
            console.error('Error cargando imagen de location:', error)
            doc.setFillColor(240, 240, 240)
            doc.rect(imageX, imageY, imageWidth, imageHeight, 'F')
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('Sin imagen', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' })
            doc.setTextColor(0, 0, 0)
          }
        } else {
          doc.setFillColor(240, 240, 240)
          doc.rect(imageX, imageY, imageWidth, imageHeight, 'F')
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('Sin imagen', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }

        // Información a la derecha de la foto
        const infoX = marginSides + imageWidth + 20 // Margen derecho de 20-25px
        const infoMaxWidth = pageWidth - infoX - marginSides
        let infoY = imageY

        // Título LOCATION (12pt, bold, mayúsculas) - más pequeño
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text('LOCATION', infoX, infoY)
        infoY += 5

        // Nombre de la location (9pt) - más pequeño
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(location.nombre, infoX, infoY)
        infoY += 5

        // Calcular ancho máximo de etiquetas para alinear (con fuente más pequeña)
        doc.setFontSize(8) // Fuente más pequeña para etiquetas
        const locationLabels = ['SET: ', 'ADDRESS: ', 'LINK: ', 'BASECAMP: ', 'BS TO SET: ']
        doc.setFont('helvetica', 'bold')
        const maxLocationLabelWidth = Math.max(...locationLabels.map(l => doc.getTextWidth(l)))
        const locationLabelX = infoX
        const locationValueX = infoX + maxLocationLabelWidth + 2

        // SET (si existe) - texto más pequeño
        const proyectoLocation = location.ProyectoLocation || {}
        if (proyectoLocation.setName) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('SET: ', locationLabelX, infoY)
          doc.setFont('helvetica', 'normal')
          doc.text(proyectoLocation.setName, locationValueX, infoY)
          infoY += 4
        }

        // ADDRESS (dirección completa: calle + CP + ciudad) - texto más pequeño
        if (location.direccion) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('ADDRESS: ', locationLabelX, infoY)
          doc.setFont('helvetica', 'normal')
          const addressLines = doc.splitTextToSize(location.direccion, infoMaxWidth - maxLocationLabelWidth - 2)
          doc.text(addressLines, locationValueX, infoY)
          infoY += addressLines.length * 3.5 + 1
        }

        // LINK (Google Maps Location) - texto más pequeño
        if (location.googleMapsLink) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('LINK: ', locationLabelX, infoY)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 255)
          const linkLines = doc.splitTextToSize(location.googleMapsLink, infoMaxWidth - maxLocationLabelWidth - 2)
          doc.text(linkLines, locationValueX, infoY)
          doc.setTextColor(0, 0, 0)
          infoY += linkLines.length * 3.5 + 1
        }

        // BASECAMP (Google Maps Basecamp) - texto más pequeño
        if (proyectoLocation.basecampLink) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('BASECAMP: ', locationLabelX, infoY)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 255)
          const basecampLines = doc.splitTextToSize(proyectoLocation.basecampLink, infoMaxWidth - maxLocationLabelWidth - 2)
          doc.text(basecampLines, locationValueX, infoY)
          doc.setTextColor(0, 0, 0)
          infoY += basecampLines.length * 3.5 + 1
        }

        // BS TO SET (distancia) - texto más pequeño
        if (proyectoLocation.distanceLocBase) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('BS TO SET: ', locationLabelX, infoY)
          doc.setFont('helvetica', 'normal')
          doc.text(proyectoLocation.distanceLocBase, locationValueX, infoY)
          infoY += 4
        }

        // Calcular altura total del bloque - limitar infoY al máximo de imageHeight
        const maxInfoY = imageY + imageHeight
        if (infoY > maxInfoY) {
          infoY = maxInfoY
        }
        const blockHeight = Math.max(imageHeight, infoY - imageY)
        yPosition = blockStartY + blockHeight + 15 // Menos espacio entre localizaciones: 15px

        // Línea divisoria sutil entre localizaciones (excepto la última)
        if (i < proyecto.Locations.length - 1) {
          doc.setDrawColor(229, 229, 229) // #e5e5e5
          doc.setLineWidth(0.3)
          doc.line(marginSides, yPosition - 12, pageWidth - marginSides, yPosition - 12)
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

  const generateCrewListPDF = async () => {
    if (!proyecto || !proyecto.Crews || proyecto.Crews.length === 0) {
      alert('Este proyecto no tiene crew asignado')
      return
    }

    setGenerating(true)

    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const marginTop = 25
      const marginBottom = 20
      const marginSides = 20

      let yPosition = marginTop

      // ===== CABECERA (mismo estilo moderno que Location List) =====
      const headerHeight = 22
      const headerY = 0
      const logoMaxWidth = 28
      const logoMaxHeight = 14

      // Banda superior sólida
      doc.setFillColor(10, 25, 47)
      doc.rect(0, headerY, pageWidth, headerHeight, 'F')

      // Logo a la izquierda
      let logoBlockWidth = 0
      if (proyecto.logoUrl) {
        try {
          const logoImg = await loadImage(proyecto.logoUrl)
          const aspect = logoImg.width / logoImg.height
          let w = logoMaxWidth
          let h = logoMaxHeight

          if (aspect > (logoMaxWidth / logoMaxHeight)) {
            h = w / aspect
          } else {
            w = h * aspect
          }

          const logoX = marginSides
          const logoY = headerY + (headerHeight - h) / 2
          doc.addImage(logoImg, 'PNG', logoX, logoY, w, h)
          logoBlockWidth = w + 4
        } catch (e) {
          console.error('Error cargando logo:', e)
        }
      }

      // Segundo logo a la derecha
      if (proyecto.logoUrl) {
        try {
          const logoImgRight = await loadImage(proyecto.logoUrl)
          const aspectRight = logoImgRight.width / logoImgRight.height
          let wRight = secondaryLogoMaxWidth
          let hRight = secondaryLogoMaxHeight

          if (aspectRight > (secondaryLogoMaxWidth / secondaryLogoMaxHeight)) {
            hRight = wRight / aspectRight
          } else {
            wRight = hRight * aspectRight
          }

          const logoRightX = pageWidth - marginSides - wRight
          const logoRightY = headerY + (headerHeight - hRight) / 2
          doc.addImage(logoImgRight, 'PNG', logoRightX, logoRightY, wRight, hRight)
        } catch (e) {
          console.error('Error cargando segundo logo:', e)
        }
      }

      // Nombre de la productora
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(230, 236, 245)
      const companyText = proyecto.company || 'Productions'
      doc.text(
        companyText,
        marginSides + logoBlockWidth,
        headerY + headerHeight / 2 + 2
      )

      // Proyecto + tipo de documento a la derecha
      const docTypeText = 'CREW LIST'
      const projectName = (proyecto.nombre || '').toUpperCase()

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)

      const projectNameWidth = doc.getTextWidth(projectName)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(185, 193, 210)
      const docTypeWidth = doc.getTextWidth(docTypeText)

      const rightPadding = marginSides + secondaryLogoMaxWidth + 4
      const textRightX = pageWidth - rightPadding

      // Tipo de documento
      doc.text(
        docTypeText,
        textRightX - docTypeWidth,
        headerY + 7
      )

      // Nombre de proyecto
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(
        projectName,
        textRightX - projectNameWidth,
        headerY + 7 + 6
      )

      // Línea inferior suave
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.line(marginSides, headerY + headerHeight + 1, pageWidth - marginSides, headerY + headerHeight + 1)

      yPosition = headerY + headerHeight + 12

      // ===== TÍTULO DE LISTA =====
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text('Crew List', marginSides, yPosition)
      yPosition += 8

      // ===== BLOQUES DE CREW =====
      const rowHeight = 20
      const usableWidth = pageWidth - (2 * marginSides)

      proyecto.Crews.forEach((member, index) => {
        if (yPosition > pageHeight - marginBottom - rowHeight) {
          doc.addPage()
          yPosition = marginTop
        }

        const startY = yPosition

        // Foto pequeña del crew (si existe)
        const photoSize = 16
        if (member.fotoUrl) {
          // Nota: para simplificar y evitar problemas CORS extra, podríamos omitir foto
          // o reutilizar loadImage si las URLs son accesibles. Por ahora, usaremos un placeholder simple.
        }

        // Nombre + rol
        const textX = marginSides
        let textY = yPosition + 4

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(member.nombre || 'Sin nombre', textX, textY)
        textY += 5

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        if (member.rol) {
          doc.text(member.rol, textX, textY)
          textY += 4
        }

        if (member.email) {
          doc.text(member.email, textX, textY)
          textY += 4
        }
        if (member.telefono) {
          doc.text(member.telefono, textX, textY)
          textY += 4
        }

        // Datos extra del proyecto (ProyectoCrew)
        const pc = member.ProyectoCrew || {}
        const rightX = marginSides + usableWidth * 0.45
        let rightY = startY + 4

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)

        const formatDate = (d) => {
          if (!d) return ''
          const dateObj = typeof d === 'string' ? new Date(d) : d
          if (Number.isNaN(dateObj.getTime())) return ''
          return dateObj.toLocaleDateString('es-ES')
        }

        doc.text('START DATE:', rightX, rightY)
        doc.setFont('helvetica', 'normal')
        doc.text(formatDate(pc.startDate) || '-', rightX + 25, rightY)
        rightY += 4

        doc.setFont('helvetica', 'bold')
        doc.text('END DATE:', rightX, rightY)
        doc.setFont('helvetica', 'normal')
        doc.text(formatDate(pc.endDate) || '-', rightX + 25, rightY)
        rightY += 4

        doc.setFont('helvetica', 'bold')
        doc.text('WEEKLY RATE:', rightX, rightY)
        doc.setFont('helvetica', 'normal')
        doc.text((pc.weeklyRate && pc.weeklyRate.toString().trim() !== '') ? pc.weeklyRate.toString() : '-', rightX + 30, rightY)
        rightY += 4

        doc.setFont('helvetica', 'bold')
        doc.text('CAR ALLOWANCE:', rightX, rightY)
        doc.setFont('helvetica', 'normal')
        doc.text(pc.carAllowance ? 'Sí' : 'No', rightX + 35, rightY)
        rightY += 4

        doc.setFont('helvetica', 'bold')
        doc.text('BOX RENTAL:', rightX, rightY)
        doc.setFont('helvetica', 'normal')
        doc.text(pc.boxRental ? 'Sí' : 'No', rightX + 30, rightY)
        rightY += 4

        // Caja visual para cada fila de crew
        const blockHeight = Math.max(rowHeight, rightY - startY + 2)
        doc.setDrawColor(230, 230, 230)
        doc.setLineWidth(0.3)
        doc.rect(marginSides, startY, usableWidth, blockHeight, 'S')

        yPosition = startY + blockHeight + 4
      })

      const fileName = `Crew_List_${proyecto.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf`
      doc.save(fileName)

      setGenerating(false)
      alert('PDF de Crew generado exitosamente')
    } catch (error) {
      console.error('Error generando Crew PDF:', error)
      setGenerating(false)
      alert('Error al generar el PDF de Crew. Por favor, intenta de nuevo.')
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

          {/* Plantilla Crew List */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87M12 7a4 4 0 110-8 4 4 0 010 8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8a4 4 0 100-8 4 4 0 000 8zm12 0a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Crew List</h3>
                <p className="text-xs text-gray-500">Listado de crew</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Exporta el listado de crew del proyecto con las fechas, tarifas y condiciones específicas de este proyecto.
            </p>
            <button
              onClick={generateCrewListPDF}
              disabled={generating || !proyecto.Crews || proyecto.Crews.length === 0}
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
            {(!proyecto.Crews || proyecto.Crews.length === 0) && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Este proyecto no tiene crew asignado
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

