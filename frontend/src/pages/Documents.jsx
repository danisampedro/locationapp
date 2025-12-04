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
  const [showRecceModal, setShowRecceModal] = useState(false)
  const [recceConfig, setRecceConfig] = useState({
    documentTitle: 'LOCATION RECCE',
    recceSchedule: '',
    meetingPoint: '',
    locationManagerName: '',
    locationManagerPhone: '',
    locationManagerEmail: '',
    sunriseTime: '',
    sunsetTime: '',
    weatherForecast: '',
    attendants: [],
    legs: [],
    freeEntries: [] // { time: '08:00', text: 'Nota...' }
  })

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

  const parseTimeToMinutes = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return null
    const parts = timeString.split(':')
    if (parts.length !== 2) return null
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    return hours * 60 + minutes
  }

  const formatMinutesToTime = (minutesTotal) => {
    if (minutesTotal == null || Number.isNaN(minutesTotal)) return ''
    let mins = minutesTotal
    // Normalizar a rango 0-1439
    mins = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60)
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const computeRecceRows = (config, proyecto) => {
    const meetingPointName = config.meetingPoint || 'MEETING POINT'
    const rows = []
    if (!config.legs || config.legs.length === 0) return rows

    let currentFrom = meetingPointName
    let currentDepartMinutes = null

    const locationsById = {}
    if (proyecto?.Locations) {
      proyecto.Locations.forEach((loc) => {
        locationsById[loc.id?.toString()] = loc
      })
    }

    config.legs
      .filter((leg) => leg.include && leg.locationId)
      .forEach((leg, index) => {
        const loc = locationsById[leg.locationId?.toString()]
        const toName = loc?.nombre || `Location ${leg.locationId}`

        // Primer depart: el que indique el usuario
        if (index === 0) {
          currentDepartMinutes = parseTimeToMinutes(leg.departTime)
        }
        const departMinutes = currentDepartMinutes
        const travelMinutes = parseInt(leg.travelTimeMinutes || '0', 10) || 0
        const timeOnLocationMinutes = parseInt(leg.timeOnLocationMinutes || '0', 10) || 0

        const arrivalMinutes = departMinutes != null ? departMinutes + travelMinutes : null

        rows.push({
          from: currentFrom,
          to: toName,
          departTime: formatMinutesToTime(departMinutes),
          travelTime: `${travelMinutes} min`,
          arrivalTime: formatMinutesToTime(arrivalMinutes),
          timeOnLocation: `${timeOnLocationMinutes} min`,
          locationId: leg.locationId
        })

        // El siguiente from es el destino actual
        currentFrom = toName
        if (arrivalMinutes != null) {
          currentDepartMinutes = arrivalMinutes + timeOnLocationMinutes
        }
      })

    return rows
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

      // Segundo logo a la derecha (usar secondaryLogoUrl si existe, si no, logo principal)
      const rightLogoUrl = proyecto.secondaryLogoUrl || proyecto.logoUrl
      if (rightLogoUrl) {
        try {
          const logoImgRight = await loadImage(rightLogoUrl)
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

  const generateLocationReccePDF = async () => {
    if (!proyecto || !proyecto.Locations || proyecto.Locations.length === 0) {
      alert('Este proyecto no tiene locations asignadas')
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
      const usableWidth = pageWidth - marginSides * 2

      // ===== CABECERA NUEVA LOCATION RECCE =====
      const headerHeight = 24
      const headerY = 0
      const logoMaxWidth = 26
      const logoMaxHeight = 14
      const secondaryLogoMaxWidth = 22
      const secondaryLogoMaxHeight = 12

      // Banda superior
      doc.setFillColor(10, 25, 47)
      doc.rect(0, headerY, pageWidth, headerHeight, 'F')

      // Logo izquierdo
      if (proyecto.logoUrl) {
        try {
          const logoImg = await loadImage(proyecto.logoUrl)
          const aspect = logoImg.width / logoImg.height
          let w = logoMaxWidth
          let h = logoMaxHeight
          if (aspect > logoMaxWidth / logoMaxHeight) {
            h = w / aspect
          } else {
            w = h * aspect
          }
          const logoX = marginSides
          const logoY = headerY + (headerHeight - h) / 2
          doc.addImage(logoImg, 'PNG', logoX, logoY, w, h)
        } catch (e) {
          console.error('Error cargando logo principal en Location Recce:', e)
        }
      }

      // Logo derecho
      const rightLogoUrl = proyecto.secondaryLogoUrl || proyecto.logoUrl
      if (rightLogoUrl) {
        try {
          const logoImgRight = await loadImage(rightLogoUrl)
          const aspectRight = logoImgRight.width / logoImgRight.height
          let wRight = secondaryLogoMaxWidth
          let hRight = secondaryLogoMaxHeight
          if (aspectRight > secondaryLogoMaxWidth / secondaryLogoMaxHeight) {
            hRight = wRight / aspectRight
          } else {
            wRight = hRight * aspectRight
          }
          const logoRightX = pageWidth - marginSides - wRight
          const logoRightY = headerY + (headerHeight - hRight) / 2
          doc.addImage(logoImgRight, 'PNG', logoRightX, logoRightY, wRight, hRight)
        } catch (e) {
          console.error('Error cargando segundo logo en Location Recce:', e)
        }
      }

      // Títulos centrados
      const projectTitle = (proyecto.nombre || '').toUpperCase()
      const documentTitle = recceConfig.documentTitle || 'LOCATION RECCE'

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(projectTitle, pageWidth / 2, headerY + 9, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(200, 210, 225)
      doc.text(documentTitle, pageWidth / 2, headerY + 16, { align: 'center' })

      let y = marginTop

      // ===== SECCIÓN 2: TABLA DATOS GENERALES =====
      const rowHeight = 8
      const colWidth = usableWidth / 2
      const tableX = marginSides

      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')

      // Fila 1: RECCE SCHEDULE
      doc.rect(tableX, y, colWidth, rowHeight, 'S')
      doc.rect(tableX + colWidth, y, colWidth, rowHeight, 'S')
      doc.text('RECCE SCHEDULE', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(recceConfig.recceSchedule || '', tableX + colWidth + 2, y + 5)
      y += rowHeight

      // Fila 2: MEETING POINT
      doc.setFont('helvetica', 'bold')
      doc.rect(tableX, y, colWidth, rowHeight, 'S')
      doc.rect(tableX + colWidth, y, colWidth, rowHeight, 'S')
      doc.text('MEETING POINT', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(recceConfig.meetingPoint || '', tableX + colWidth + 2, y + 5)
      y += rowHeight

      // Fila 3: LOCATION MANAGER
      const lmText = [
        recceConfig.locationManagerName || proyecto.locationManager || '',
        recceConfig.locationManagerPhone || '',
        recceConfig.locationManagerEmail || ''
      ]
        .filter(Boolean)
        .join('  |  ')

      doc.setFont('helvetica', 'bold')
      doc.rect(tableX, y, colWidth, rowHeight, 'S')
      doc.rect(tableX + colWidth, y, colWidth, rowHeight, 'S')
      doc.text('LOCATION MANAGER', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(lmText || '', tableX + colWidth + 2, y + 5)
      y += rowHeight + 4

      // ===== MINI SECCIÓN 3: SOL / METEO =====
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)

      const miniText = [
        recceConfig.sunriseTime ? `Sunrise: ${recceConfig.sunriseTime}` : '',
        recceConfig.sunsetTime ? `Sunset: ${recceConfig.sunsetTime}` : '',
        recceConfig.weatherForecast
          ? `Weather: ${recceConfig.weatherForecast}`
          : ''
      ]
        .filter(Boolean)
        .join('   •   ')

      if (miniText) {
        doc.text(miniText, marginSides, y)
        y += 8
      }

      // ===== SECCIÓN 4: ATTENDANTS =====
      if (recceConfig.attendants && recceConfig.attendants.length > 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text('ATTENDANTS', marginSides, y)
        y += 4

        const colAttName = usableWidth * 0.3
        const colAttPos = usableWidth * 0.25
        const colAttPhone = usableWidth * 0.2
        const colAttMail = usableWidth * 0.25

        const headerY = y
        doc.setFontSize(8)
        doc.setTextColor(90, 90, 90)
        doc.text('Name', marginSides + 2, headerY + 4)
        doc.text('Position', marginSides + colAttName + 2, headerY + 4)
        doc.text('Phone', marginSides + colAttName + colAttPos + 2, headerY + 4)
        doc.text('Email', marginSides + colAttName + colAttPos + colAttPhone + 2, headerY + 4)

        doc.rect(marginSides, headerY, colAttName, rowHeight, 'S')
        doc.rect(marginSides + colAttName, headerY, colAttPos, rowHeight, 'S')
        doc.rect(
          marginSides + colAttName + colAttPos,
          headerY,
          colAttPhone,
          rowHeight,
          'S'
        )
        doc.rect(
          marginSides + colAttName + colAttPos + colAttPhone,
          headerY,
          colAttMail,
          rowHeight,
          'S'
        )

        y += rowHeight

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)

        recceConfig.attendants.forEach((att) => {
          if (y > pageHeight - marginBottom - 20) {
            doc.addPage()
            y = marginTop
          }
          doc.rect(marginSides, y, colAttName, rowHeight, 'S')
          doc.rect(marginSides + colAttName, y, colAttPos, rowHeight, 'S')
          doc.rect(
            marginSides + colAttName + colAttPos,
            y,
            colAttPhone,
            rowHeight,
            'S'
          )
          doc.rect(
            marginSides + colAttName + colAttPos + colAttPhone,
            y,
            colAttMail,
            rowHeight,
            'S'
          )

          doc.text(att.name || '', marginSides + 2, y + 5)
          doc.text(att.position || '', marginSides + colAttName + 2, y + 5)
          doc.text(att.phone || '', marginSides + colAttName + colAttPos + 2, y + 5)
          doc.text(
            att.email || '',
            marginSides + colAttName + colAttPos + colAttPhone + 2,
            y + 5
          )

          y += rowHeight
        })

        y += 8
      }

      // ===== SECCIÓN 5: RECCE TIMES =====
      const recceRows = computeRecceRows(recceConfig, proyecto)
      if (recceRows.length > 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text('RECCE TIMES', marginSides, y)
        y += 4

        const colDepart = usableWidth * 0.16
        const colFrom = usableWidth * 0.2
        const colTo = usableWidth * 0.2
        const colTravel = usableWidth * 0.16
        const colArrival = usableWidth * 0.16
        const colTimeLoc = usableWidth * 0.12

        const headerY2 = y
        doc.setFontSize(7)
        doc.setTextColor(90, 90, 90)
        const baseX = marginSides
        doc.text('Depart', baseX + 2, headerY2 + 4)
        doc.text('From', baseX + colDepart + 2, headerY2 + 4)
        doc.text('To', baseX + colDepart + colFrom + 2, headerY2 + 4)
        doc.text('Travel', baseX + colDepart + colFrom + colTo + 2, headerY2 + 4)
        doc.text(
          'Arrival',
          baseX + colDepart + colFrom + colTo + colTravel + 2,
          headerY2 + 4
        )
        doc.text(
          'Time on loc.',
          baseX + colDepart + colFrom + colTo + colTravel + colArrival + 2,
          headerY2 + 4
        )

        // Bordes cabecera
        doc.rect(baseX, headerY2, colDepart, rowHeight, 'S')
        doc.rect(baseX + colDepart, headerY2, colFrom, rowHeight, 'S')
        doc.rect(baseX + colDepart + colFrom, headerY2, colTo, rowHeight, 'S')
        doc.rect(
          baseX + colDepart + colFrom + colTo,
          headerY2,
          colTravel,
          rowHeight,
          'S'
        )
        doc.rect(
          baseX + colDepart + colFrom + colTo + colTravel,
          headerY2,
          colArrival,
          rowHeight,
          'S'
        )
        doc.rect(
          baseX + colDepart + colFrom + colTo + colTravel + colArrival,
          headerY2,
          colTimeLoc,
          rowHeight,
          'S'
        )

        y += rowHeight

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)

        recceRows.forEach((row) => {
          if (y > pageHeight - marginBottom - 20) {
            doc.addPage()
            y = marginTop
          }

          doc.rect(baseX, y, colDepart, rowHeight, 'S')
          doc.rect(baseX + colDepart, y, colFrom, rowHeight, 'S')
          doc.rect(baseX + colDepart + colFrom, y, colTo, rowHeight, 'S')
          doc.rect(
            baseX + colDepart + colFrom + colTo,
            y,
            colTravel,
            rowHeight,
            'S'
          )
          doc.rect(
            baseX + colDepart + colFrom + colTo + colTravel,
            y,
            colArrival,
            rowHeight,
            'S'
          )
          doc.rect(
            baseX + colDepart + colFrom + colTo + colTravel + colArrival,
            y,
            colTimeLoc,
            rowHeight,
            'S'
          )

          doc.text(row.departTime || '', baseX + 2, y + 5)
          doc.text(row.from || '', baseX + colDepart + 2, y + 5)
          doc.text(row.to || '', baseX + colDepart + colFrom + 2, y + 5)
          doc.text(row.travelTime || '', baseX + colDepart + colFrom + colTo + 2, y + 5)
          doc.text(
            row.arrivalTime || '',
            baseX + colDepart + colFrom + colTo + colTravel + 2,
            y + 5
          )
          doc.text(
            row.timeOnLocation || '',
            baseX + colDepart + colFrom + colTo + colTravel + colArrival + 2,
            y + 5
          )

          y += rowHeight
        })

        y += 10
      }

      // ===== SECCIÓN 6: ENTRADAS LIBRES + LOCALIZACIONES =====
      const recceRowsByLocation = {}
      recceRows.forEach((row) => {
        if (row.locationId) {
          recceRowsByLocation[row.locationId.toString()] = row
        }
      })

      // Entradas libres
      if (recceConfig.freeEntries && recceConfig.freeEntries.length > 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text('NOTES', marginSides, y)
        y += 5

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)

        recceConfig.freeEntries.forEach((entry) => {
          if (y > pageHeight - marginBottom - 20) {
            doc.addPage()
            y = marginTop
          }
          const line = entry.time ? `${entry.time}  -  ${entry.text || ''}` : entry.text
          doc.text(line || '', marginSides, y)
          y += 5
        })

        y += 8
      }

      // Bloques de localización en el orden de las legs
      const locationsById = {}
      if (proyecto.Locations) {
        proyecto.Locations.forEach((loc) => {
          locationsById[loc.id?.toString()] = loc
        })
      }

      const includedLegs = (recceConfig.legs || []).filter(
        (leg) => leg.include && leg.locationId
      )

      includedLegs.forEach((leg, index) => {
        const loc = locationsById[leg.locationId.toString()]
        if (!loc) return

        const row = recceRowsByLocation[leg.locationId.toString()]

        if (y > pageHeight - marginBottom - 80) {
          doc.addPage()
          y = marginTop
        }

        // Texto "Travel to ..."
        if (index > 0 && loc.nombre) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(90, 90, 90)
          doc.text(`Travel to ${loc.nombre}`, marginSides, y)
          y += 6
        }

        const blockStartY = y

        // Primera fila: nombre + arrival/depart
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(loc.nombre || 'Location', marginSides, y)

        if (row) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(70, 70, 70)
          const timesText = [
            row.arrivalTime ? `Arrival: ${row.arrivalTime}` : '',
            row.departTime ? `Depart: ${row.departTime}` : ''
          ]
            .filter(Boolean)
            .join('   |   ')
          if (timesText) {
            doc.text(timesText, pageWidth - marginSides, y, { align: 'right' })
          }
        }

        y += 6

        // Segunda fila: link Google
        if (loc.googleMapsLink) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(30, 60, 150)
          doc.textWithLink('Google Maps', marginSides, y, {
            url: loc.googleMapsLink
          })
          y += 6
        }

        // Tercera fila: dos imágenes lado a lado
        const imagenes =
          Array.isArray(loc.imagenes) && loc.imagenes.length > 0
            ? loc.imagenes
            : typeof loc.imagenes === 'string' && loc.imagenes
              ? JSON.parse(loc.imagenes)
              : []

        if (imagenes && imagenes.length > 0) {
          // Para simplificar y evitar problemas con await en bucles,
          // usamos placeholders de imagen en 16:9.
          const gap = 4
          const imageWidth = (usableWidth - gap) / 2
          const imageHeight = imageWidth * (9 / 16)
          const imageY = y

          for (let i = 0; i < Math.min(imagenes.length, 2); i++) {
            const x = marginSides + i * (imageWidth + gap)
            doc.setFillColor(240, 240, 240)
            doc.rect(x, imageY, imageWidth, imageHeight, 'F')
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('Image', x + imageWidth / 2, imageY + imageHeight / 2, {
              align: 'center'
            })
            doc.setTextColor(0, 0, 0)
          }

          y = imageY + imageHeight + 10
        } else {
          y += 6
        }

        // Separación entre bloques
        y = Math.max(y, blockStartY + 20)
        y += 4
      })

      doc.save(`${proyecto.nombre || 'proyecto'}_location_recce.pdf`)
    } catch (error) {
      console.error('Error generando Location Recce PDF:', error)
      alert('Error al generar el PDF de Location Recce')
    } finally {
      setGenerating(false)
      setShowRecceModal(false)
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
      const secondaryLogoMaxWidth = 22
      const secondaryLogoMaxHeight = 12

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

      // Segundo logo a la derecha (usar secondaryLogoUrl si existe, si no, logo principal)
      const rightLogoUrl = proyecto.secondaryLogoUrl || proyecto.logoUrl
      if (rightLogoUrl) {
        try {
          const logoImgRight = await loadImage(rightLogoUrl)
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

          {/* Plantilla Location Recce */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a4 4 0 00-4 4v1m4-5a4 4 0 014 4v1m-9 4h10l1 4H6l1-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Location Recce</h3>
                <p className="text-xs text-gray-500">Plan de recce con tiempos y asistentes</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Genera un documento de recce con planning, asistentes, tabla de tiempos y bloques de localización del proyecto.
            </p>
            <button
              type="button"
              onClick={() => {
                // Prefijar configuración con datos del proyecto
                setRecceConfig((prev) => ({
                  ...prev,
                  documentTitle: prev.documentTitle || 'LOCATION RECCE',
                  locationManagerName: prev.locationManagerName || proyecto.locationManager || '',
                  attendants:
                    prev.attendants && prev.attendants.length > 0
                      ? prev.attendants
                      : (proyecto.Crews || []).map((c) => ({
                          name: c.nombre || '',
                          position: c.rol || '',
                          phone: c.telefono || '',
                          email: c.email || ''
                        })),
                  legs:
                    prev.legs && prev.legs.length > 0
                      ? prev.legs
                      : (proyecto.Locations || []).map((loc, index) => ({
                          include: true,
                          locationId: loc.id?.toString(),
                          departTime: index === 0 ? '08:00' : '',
                          travelTimeMinutes: '15',
                          timeOnLocationMinutes: '60'
                        }))
                }))
                setShowRecceModal(true)
              }}
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
                  Configurar y generar
                </>
              )}
            </button>
            {(!proyecto.Locations || proyecto.Locations.length === 0) && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Este proyecto no tiene locations asignadas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Location Recce */}
      {showRecceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Configurar Location Recce</h2>
                <p className="text-sm text-gray-500">
                  Rellena la información del recce antes de generar el PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Datos generales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del documento
                  </label>
                  <input
                    type="text"
                    value={recceConfig.documentTitle}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, documentTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recce schedule
                  </label>
                  <input
                    type="text"
                    value={recceConfig.recceSchedule}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, recceSchedule: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: Día completo / Mañana / Tarde"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting point
                  </label>
                  <input
                    type="text"
                    value={recceConfig.meetingPoint}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, meetingPoint: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Dirección o punto de encuentro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Manager - Nombre
                  </label>
                  <input
                    type="text"
                    value={recceConfig.locationManagerName}
                    onChange={(e) =>
                      setRecceConfig({
                        ...recceConfig,
                        locationManagerName: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder={proyecto.locationManager || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Manager - Teléfono
                  </label>
                  <input
                    type="text"
                    value={recceConfig.locationManagerPhone}
                    onChange={(e) =>
                      setRecceConfig({
                        ...recceConfig,
                        locationManagerPhone: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Manager - Email
                  </label>
                  <input
                    type="email"
                    value={recceConfig.locationManagerEmail}
                    onChange={(e) =>
                      setRecceConfig({
                        ...recceConfig,
                        locationManagerEmail: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de salida del sol
                  </label>
                  <input
                    type="text"
                    value={recceConfig.sunriseTime}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, sunriseTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: 07:25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de puesta de sol
                  </label>
                  <input
                    type="text"
                    value={recceConfig.sunsetTime}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, sunsetTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: 18:50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previsión del tiempo
                  </label>
                  <input
                    type="text"
                    value={recceConfig.weatherForecast}
                    onChange={(e) =>
                      setRecceConfig({
                        ...recceConfig,
                        weatherForecast: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: Soleado, 22ºC, viento suave"
                  />
                </div>
              </div>

              {/* Attendants */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Attendants
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setRecceConfig({
                        ...recceConfig,
                        attendants: [
                          ...(recceConfig.attendants || []),
                          { name: '', position: '', phone: '', email: '' }
                        ]
                      })
                    }
                    className="text-xs text-dark-blue hover:text-dark-blue-light"
                  >
                    + Añadir asistente
                  </button>
                </div>
                {(!recceConfig.attendants || recceConfig.attendants.length === 0) ? (
                  <p className="text-xs text-gray-500">
                    No hay asistentes. Pulsa &quot;Añadir asistente&quot; para crear el primero.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recceConfig.attendants.map((att, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={att.name}
                          onChange={(e) => {
                            const updated = [...recceConfig.attendants]
                            updated[index] = { ...updated[index], name: e.target.value }
                            setRecceConfig({ ...recceConfig, attendants: updated })
                          }}
                          className="px-2 py-1.5 border rounded-lg text-xs"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={att.position}
                          onChange={(e) => {
                            const updated = [...recceConfig.attendants]
                            updated[index] = { ...updated[index], position: e.target.value }
                            setRecceConfig({ ...recceConfig, attendants: updated })
                          }}
                          className="px-2 py-1.5 border rounded-lg text-xs"
                          placeholder="Posición"
                        />
                        <input
                          type="text"
                          value={att.phone}
                          onChange={(e) => {
                            const updated = [...recceConfig.attendants]
                            updated[index] = { ...updated[index], phone: e.target.value }
                            setRecceConfig({ ...recceConfig, attendants: updated })
                          }}
                          className="px-2 py-1.5 border rounded-lg text-xs"
                          placeholder="Teléfono"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={att.email}
                            onChange={(e) => {
                              const updated = [...recceConfig.attendants]
                              updated[index] = { ...updated[index], email: e.target.value }
                              setRecceConfig({ ...recceConfig, attendants: updated })
                            }}
                            className="flex-1 px-2 py-1.5 border rounded-lg text-xs"
                            placeholder="Email"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = recceConfig.attendants.filter((_, i) => i !== index)
                              setRecceConfig({ ...recceConfig, attendants: updated })
                            }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legs / Recce times */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Recce times (por localización)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Indica la hora de salida inicial, el tiempo de viaje y el tiempo en cada localización.
                  </p>
                </div>
                {(!recceConfig.legs || recceConfig.legs.length === 0) ? (
                  <p className="text-xs text-gray-500">
                    No hay legs configurados. Asegúrate de que el proyecto tenga locations asignadas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recceConfig.legs.map((leg, index) => {
                      const loc =
                        (proyecto.Locations || []).find(
                          (l) => l.id?.toString() === leg.locationId?.toString()
                        ) || {}
                      return (
                        <div
                          key={leg.locationId || index}
                          className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs"
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!leg.include}
                              onChange={(e) => {
                                const updated = [...recceConfig.legs]
                                updated[index] = { ...updated[index], include: e.target.checked }
                                setRecceConfig({ ...recceConfig, legs: updated })
                              }}
                            />
                            <span className="font-medium text-gray-800">
                              {loc.nombre || `Location ${leg.locationId}`}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={leg.departTime || ''}
                            onChange={(e) => {
                              const updated = [...recceConfig.legs]
                              updated[index] = { ...updated[index], departTime: e.target.value }
                              setRecceConfig({ ...recceConfig, legs: updated })
                            }}
                            className="px-2 py-1.5 border rounded-lg"
                            placeholder={index === 0 ? 'Hora salida (ej: 08:00)' : 'Auto'}
                          />
                          <input
                            type="number"
                            value={leg.travelTimeMinutes || ''}
                            onChange={(e) => {
                              const updated = [...recceConfig.legs]
                              updated[index] = {
                                ...updated[index],
                                travelTimeMinutes: e.target.value
                              }
                              setRecceConfig({ ...recceConfig, legs: updated })
                            }}
                            className="px-2 py-1.5 border rounded-lg"
                            placeholder="Travel (min)"
                          />
                          <input
                            type="number"
                            value={leg.timeOnLocationMinutes || ''}
                            onChange={(e) => {
                              const updated = [...recceConfig.legs]
                              updated[index] = {
                                ...updated[index],
                                timeOnLocationMinutes: e.target.value
                              }
                              setRecceConfig({ ...recceConfig, legs: updated })
                            }}
                            className="px-2 py-1.5 border rounded-lg"
                            placeholder="Time on loc (min)"
                          />
                          <div className="text-[11px] text-gray-500">
                            {index === 0
                              ? 'From: Meeting point'
                              : `From: ${recceConfig.legs[index - 1]?.locationId
                                  ? (proyecto.Locations || []).find(
                                      (l) =>
                                        l.id?.toString() ===
                                        recceConfig.legs[index - 1].locationId?.toString()
                                    )?.nombre || 'Anterior'
                                  : 'Anterior'
                                }`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Entradas libres */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Entradas libres
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setRecceConfig({
                        ...recceConfig,
                        freeEntries: [
                          ...(recceConfig.freeEntries || []),
                          { time: '', text: '' }
                        ]
                      })
                    }
                    className="text-xs text-dark-blue hover:text-dark-blue-light"
                  >
                    + Añadir entrada
                  </button>
                </div>
                {(!recceConfig.freeEntries || recceConfig.freeEntries.length === 0) ? (
                  <p className="text-xs text-gray-500">
                    No hay entradas libres. Úsalas para notas adicionales del día.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recceConfig.freeEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-2 items-center text-xs"
                      >
                        <input
                          type="text"
                          value={entry.time}
                          onChange={(e) => {
                            const updated = [...recceConfig.freeEntries]
                            updated[index] = { ...updated[index], time: e.target.value }
                            setRecceConfig({ ...recceConfig, freeEntries: updated })
                          }}
                          className="px-2 py-1.5 border rounded-lg"
                          placeholder="Hora"
                        />
                        <input
                          type="text"
                          value={entry.text}
                          onChange={(e) => {
                            const updated = [...recceConfig.freeEntries]
                            updated[index] = { ...updated[index], text: e.target.value }
                            setRecceConfig({ ...recceConfig, freeEntries: updated })
                          }}
                          className="px-2 py-1.5 border rounded-lg"
                          placeholder="Texto de la entrada"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = recceConfig.freeEntries.filter((_, i) => i !== index)
                            setRecceConfig({ ...recceConfig, freeEntries: updated })
                          }}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecceModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  disabled={generating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={generateLocationReccePDF}
                  disabled={generating}
                  className="px-5 py-2 rounded-lg bg-dark-blue text-white text-sm hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generando...' : 'Generar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

