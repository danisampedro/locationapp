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
  const [savedRecceDocuments, setSavedRecceDocuments] = useState([])
  const [editingRecceDocument, setEditingRecceDocument] = useState(null)
  const [recceDocumentName, setRecceDocumentName] = useState('')
  const [showLocationSelectorModal, setShowLocationSelectorModal] = useState(false)
  const [locationSearchText, setLocationSearchText] = useState('')
  const [recceConfig, setRecceConfig] = useState({
    documentTitle: 'LOCATION RECCE',
    recceSchedule: '',
    meetingPoint: '',
    meetingPointLink: '',
    departureTime: '', // Hora de salida del meeting point
    locationManagerName: '',
    locationManagerPhone: '',
    locationManagerEmail: '',
    sunriseTime: '',
    sunsetTime: '',
    weatherForecast: '',
    attendants: [],
    legs: [],
    freeEntries: [], // { text: '...', notes: '...', travelTimeMinutes: '', timeOnPlaceMinutes: '', order: 0 } — text en tabla de tiempos; notes solo en elementos/PDF
    flights: [], // { text: 'Información del vuelo...', order: 0 }
    notes: [] // { text: 'Texto libre sin horario...', order: 0 }
  })

  useEffect(() => {
    loadProyecto()
    loadSavedRecceDocuments()
  }, [id])

  const loadSavedRecceDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/recce-documents/project/${id}`, { withCredentials: true })
      setSavedRecceDocuments(response.data)
    } catch (error) {
      console.error('Error cargando documentos Recce:', error)
    }
  }


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
      img.onload = () => {
        // Si es PNG, procesar en canvas para preservar transparencia
        if (url.toLowerCase().includes('.png') || url.toLowerCase().includes('png')) {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            
            // Limpiar canvas (transparente)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            // Dibujar imagen en canvas (preserva transparencia)
            ctx.drawImage(img, 0, 0)
            
            // Convertir a data URL PNG para preservar transparencia
            const dataUrl = canvas.toDataURL('image/png')
            const processedImg = new Image()
            processedImg.onload = () => resolve(processedImg)
            processedImg.onerror = () => resolve(img) // Fallback a imagen original
            processedImg.src = dataUrl
          } catch (e) {
            console.error('Error procesando PNG:', e)
            resolve(img) // Fallback a imagen original
          }
        } else {
          // Para otros formatos, usar imagen directamente
          resolve(img)
        }
      }
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
    
    const locationsById = {}
    if (proyecto?.Locations) {
      proyecto.Locations.forEach((loc) => {
        locationsById[loc.id?.toString()] = loc
      })
    }

    // Crear lista combinada de elementos (entradas libres y localizaciones) con orden
    // NOTA: Las notas (notes) y vuelos (flights) NO se incluyen aquí porque no tienen tiempos
    const combinedItems = []
    
    // Añadir entradas libres
    if (config.freeEntries && config.freeEntries.length > 0) {
      config.freeEntries.forEach((entry, index) => {
        combinedItems.push({
          type: 'freeEntry',
          order: entry.order !== undefined ? entry.order : index,
          data: entry
        })
      })
    }

    // Añadir localizaciones incluidas
    const includedLegs = (config.legs || []).filter(
      (leg) => leg.include && leg.locationId
    )
    includedLegs.forEach((leg, index) => {
      combinedItems.push({
        type: 'location',
        order: leg.order !== undefined ? leg.order : index + (config.freeEntries?.length || 0),
        data: leg
      })
    })

    // Ordenar por el campo order
    combinedItems.sort((a, b) => a.order - b.order)

    if (combinedItems.length === 0) return rows

    // Inicializar con la hora de salida del meeting point
    let currentDepartMinutes = parseTimeToMinutes(config.departureTime || '')
    let currentFrom = meetingPointName

    // Procesar cada elemento en orden
    combinedItems.forEach((item) => {
      if (item.type === 'freeEntry') {
        // Entrada libre
        const entry = item.data
        const travelMinutes = parseInt(entry.travelTimeMinutes || '0', 10) || 0
        const timeOnPlaceMinutes = parseInt(entry.timeOnPlaceMinutes || '0', 10) || 0

        if (currentDepartMinutes == null) {
          // Si no hay hora de salida inicial, usar la hora de la entrada libre si está definida
          currentDepartMinutes = parseTimeToMinutes(entry.time || '')
        }

        const arrivalMinutes = currentDepartMinutes != null ? currentDepartMinutes + travelMinutes : null

        rows.push({
          from: currentFrom,
          to: entry.text || 'ENTRADA LIBRE',
          departTime: formatMinutesToTime(currentDepartMinutes),
          travelTime: `${travelMinutes} min`,
          arrivalTime: formatMinutesToTime(arrivalMinutes),
          timeOnLocation: `${timeOnPlaceMinutes} min`,
          locationId: null,
          isFreeEntry: true,
          isFlight: false
        })

        // Actualizar para el siguiente elemento
        currentFrom = entry.text || 'ENTRADA LIBRE'
        if (arrivalMinutes != null) {
          currentDepartMinutes = arrivalMinutes + timeOnPlaceMinutes
        }
      } else if (item.type === 'location') {
        // Localización
        const leg = item.data
        const loc = locationsById[leg.locationId?.toString()]
        const toName = loc?.nombre || `Location ${leg.locationId}`

        const travelMinutes = parseInt(leg.travelTimeMinutes || '0', 10) || 0
        const timeOnLocationMinutes = parseInt(leg.timeOnLocationMinutes || '0', 10) || 0

        const arrivalMinutes = currentDepartMinutes != null ? currentDepartMinutes + travelMinutes : null

        rows.push({
          from: currentFrom,
          to: toName,
          departTime: formatMinutesToTime(currentDepartMinutes),
          travelTime: `${travelMinutes} min`,
          arrivalTime: formatMinutesToTime(arrivalMinutes),
          timeOnLocation: `${timeOnLocationMinutes} min`,
          locationId: leg.locationId,
          isFreeEntry: false,
          isFlight: false
        })

        // Actualizar para el siguiente elemento
        currentFrom = toName
        if (arrivalMinutes != null) {
          currentDepartMinutes = arrivalMinutes + timeOnLocationMinutes
        }
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
      const marginBottom = 20 // Aumentado para el pie de página
      const marginSides = 20
      const usableWidth = pageWidth - (2 * marginSides)
      const usableHeight = pageHeight - marginTop - marginBottom
      
      let yPosition = marginTop

      // ===== CABECERA (HEADER) MODERNA =====
      // Logo a la izquierda, segundo logo a la derecha, nombre del proyecto y "LOCATION LIST" en el centro
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
          // Detectar formato de imagen y usar el formato correcto para preservar transparencia
          const isPng = logoImg.src.toLowerCase().includes('.png') || logoImg.src.toLowerCase().includes('data:image/png')
          const imageFormat = isPng ? 'PNG' : 'JPEG'
          doc.addImage(logoImg, imageFormat, logoX, logoY, w, h)
        } catch (e) {
          console.error('Error cargando logo:', e)
        }
      }

      // Segundo logo a la derecha
      if (proyecto.secondaryLogoUrl) {
        try {
          const logoImgRight = await loadImage(proyecto.secondaryLogoUrl)
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
          // Detectar formato de imagen y usar el formato correcto para preservar transparencia
          const isPngRight = logoImgRight.src.toLowerCase().includes('.png') || logoImgRight.src.toLowerCase().includes('data:image/png')
          const imageFormatRight = isPngRight ? 'PNG' : 'JPEG'
          doc.addImage(logoImgRight, imageFormatRight, logoRightX, logoRightY, wRight, hRight)
        } catch (e) {
          console.error('Error cargando segundo logo:', e)
        }
      }

      // Nombre del proyecto y "LOCATION LIST" en el centro
      const docTypeText = 'LOCATION LIST'
      const projectName = (proyecto.nombre || '').toUpperCase()

      // Calcular posición central
      const centerX = pageWidth / 2
      
      // Nombre de proyecto (arriba, grande, blanco, centrado)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(
        projectName,
        centerX,
        headerY + 7,
        { align: 'center' }
      )

      // Tipo de documento (debajo, pequeño, gris claro, centrado)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(185, 193, 210)
      doc.text(
        docTypeText,
        centerX,
        headerY + 7 + 6,
        { align: 'center' }
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
        'LOCATION MANAGER: ',
        'LOCATION COORDINATOR: ',
        'ASSISTANT LOCATION MANAGER: ',
        'BASECAMP MANAGER: '
      ]
      doc.setFont('helvetica', 'bold')
      const maxLabelWidth = Math.max(...labels.map(l => doc.getTextWidth(l)))
      const labelX = marginSides
      const valueX = marginSides + maxLabelWidth + 2
      
      // Location Manager
      if (proyecto.locationManager) {
        doc.setFont('helvetica', 'bold')
        doc.text('LOCATION MANAGER: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        let managerInfo = proyecto.locationManager
        if (proyecto.locationManagerPhone || proyecto.locationManagerEmail) {
          const contactParts = []
          if (proyecto.locationManagerPhone) {
            contactParts.push(`Tel: ${proyecto.locationManagerPhone}`)
          }
          if (proyecto.locationManagerEmail) {
            contactParts.push(`Email: ${proyecto.locationManagerEmail}`)
          }
          managerInfo += ` (${contactParts.join(' | ')})`
        }
        doc.text(managerInfo, valueX, yPosition)
        yPosition += 6
      }

      // Location Coordinator
      if (proyecto.locationCoordinator) {
        doc.setFont('helvetica', 'bold')
        doc.text('LOCATION COORDINATOR: ', labelX, yPosition)
        doc.setFont('helvetica', 'normal')
        let coordinatorInfo = proyecto.locationCoordinator
        if (proyecto.locationCoordinatorPhone || proyecto.locationCoordinatorEmail) {
          const contactParts = []
          if (proyecto.locationCoordinatorPhone) {
            contactParts.push(`Tel: ${proyecto.locationCoordinatorPhone}`)
          }
          if (proyecto.locationCoordinatorEmail) {
            contactParts.push(`Email: ${proyecto.locationCoordinatorEmail}`)
          }
          coordinatorInfo += ` (${contactParts.join(' | ')})`
        }
        doc.text(coordinatorInfo, valueX, yPosition)
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

      // ===== PIE DE PÁGINA (FOOTER) =====
      // Añadir información de empresa en el pie de página de todas las páginas
      const totalPages = doc.internal.pages.length - 1
      const footerY = pageHeight - marginBottom
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum)
        
        // Línea superior del pie de página (con más separación)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.line(marginSides, footerY - 12, pageWidth - marginSides, footerY - 12)
        
        // Información de empresa (company, address, CIF) centrada
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        
        const footerInfo = []
        if (proyecto.company) {
          footerInfo.push(proyecto.company)
        }
        if (proyecto.address) {
          footerInfo.push(proyecto.address)
        }
        if (proyecto.cif) {
          footerInfo.push(`CIF: ${proyecto.cif}`)
        }
        
        if (footerInfo.length > 0) {
          const footerText = footerInfo.join(' | ')
          const centerX = pageWidth / 2
          const footerLines = doc.splitTextToSize(footerText, usableWidth)
          footerLines.forEach((line, index) => {
            doc.text(line, centerX, footerY - 8 + (index * 3), { align: 'center' })
          })
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
      const marginBottom = 20 // Aumentado para el pie de página
      const marginSides = 20
      const usableWidth = pageWidth - marginSides * 2

      // ===== CABECERA NUEVA LOCATION RECCE =====
      const headerHeight = 22
      const headerY = 0
      const logoMaxWidth = 28
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
          // Detectar formato de imagen y usar el formato correcto para preservar transparencia
          const isPng = logoImg.src.toLowerCase().includes('.png') || logoImg.src.toLowerCase().includes('data:image/png')
          const imageFormat = isPng ? 'PNG' : 'JPEG'
          doc.addImage(logoImg, imageFormat, logoX, logoY, w, h)
        } catch (e) {
          console.error('Error cargando logo principal en Location Recce:', e)
        }
      }

      // Logo derecho (solo secondaryLogoUrl, sin fallback)
      if (proyecto.secondaryLogoUrl) {
        try {
          const logoImgRight = await loadImage(proyecto.secondaryLogoUrl)
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
          // Detectar formato de imagen y usar el formato correcto para preservar transparencia
          const isPngRight = logoImgRight.src.toLowerCase().includes('.png') || logoImgRight.src.toLowerCase().includes('data:image/png')
          const imageFormatRight = isPngRight ? 'PNG' : 'JPEG'
          doc.addImage(logoImgRight, imageFormatRight, logoRightX, logoRightY, wRight, hRight)
        } catch (e) {
          console.error('Error cargando segundo logo en Location Recce:', e)
        }
      }

      // Nombre del proyecto y "LOCATION RECCE" en el centro
      const projectTitle = (proyecto.nombre || '').toUpperCase()
      const documentTitle = recceConfig.documentTitle || 'LOCATION RECCE'

      // Nombre de proyecto (arriba, grande, blanco, centrado)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(projectTitle, pageWidth / 2, headerY + 7, { align: 'center' })

      // Tipo de documento (debajo, pequeño, gris claro, centrado)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(185, 193, 210)
      doc.text(documentTitle, pageWidth / 2, headerY + 7 + 6, { align: 'center' })

      let y = marginTop + 8 // Margen adicional entre cabecera y primera tabla

      // ===== SECCIÓN 2: TABLA DATOS GENERALES =====
      const rowHeight = 8
      const col1Width = usableWidth / 3 // Columna 1 más pequeña (1/3)
      const col2Width = (usableWidth * 2) / 3 // Columna 2 más grande (2/3)
      const tableX = marginSides

      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')

      // Fila 1: RECCE SCHEDULE
      doc.rect(tableX, y, col1Width, rowHeight, 'S')
      doc.rect(tableX + col1Width, y, col2Width, rowHeight, 'S')
      doc.text('RECCE SCHEDULE', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(recceConfig.recceSchedule || '', tableX + col1Width + 2, y + 5)
      y += rowHeight

      // Fila 2: MEETING POINT
      doc.setFont('helvetica', 'bold')
      doc.rect(tableX, y, col1Width, rowHeight, 'S')
      doc.rect(tableX + col1Width, y, col2Width, rowHeight, 'S')
      doc.text('MEETING POINT', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      const meetingPointText = [
        recceConfig.meetingPoint || '',
        recceConfig.meetingPointLink || ''
      ]
        .filter(Boolean)
        .join('  |  ')
      doc.text(meetingPointText, tableX + col1Width + 2, y + 5)
      y += rowHeight

      // Fila 3: LOCATION MANAGER
      const lmText = [
        recceConfig.locationManagerName || proyecto.locationManager || '',
        recceConfig.locationManagerPhone || proyecto.locationManagerPhone || '',
        recceConfig.locationManagerEmail || proyecto.locationManagerEmail || ''
      ]
        .filter(Boolean)
        .join('  |  ')

      doc.setFont('helvetica', 'bold')
      doc.rect(tableX, y, col1Width, rowHeight, 'S')
      doc.rect(tableX + col1Width, y, col2Width, rowHeight, 'S')
      doc.text('LOCATION MANAGER', tableX + 2, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(lmText || '', tableX + col1Width + 2, y + 5)
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
        // Fondo azul para la cabecera
        doc.setFillColor(10, 25, 47)
        doc.rect(marginSides, headerY, colAttName, rowHeight, 'F')
        doc.rect(marginSides + colAttName, headerY, colAttPos, rowHeight, 'F')
        doc.rect(
          marginSides + colAttName + colAttPos,
          headerY,
          colAttPhone,
          rowHeight,
          'F'
        )
        doc.rect(
          marginSides + colAttName + colAttPos + colAttPhone,
          headerY,
          colAttMail,
          rowHeight,
          'F'
        )
        // Bordes más finos
        doc.setDrawColor(10, 25, 47)
        doc.setLineWidth(0.2)
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
        // Texto blanco, alineado a la izquierda
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text('Name', marginSides + 2, headerY + 4)
        doc.text('Position', marginSides + colAttName + 2, headerY + 4)
        doc.text('Phone', marginSides + colAttName + colAttPos + 2, headerY + 4)
        doc.text('Email', marginSides + colAttName + colAttPos + colAttPhone + 2, headerY + 4)
        // Restaurar color y grosor de línea
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)

        y += rowHeight

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)

        // Ordenar attendants por order antes de mostrar
        const sortedAttendants = [...recceConfig.attendants].map((att, index) => ({
          ...att,
          order: att.order !== undefined ? att.order : index
        })).sort((a, b) => a.order - b.order)
        
        sortedAttendants.forEach((att) => {
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
        const baseX = marginSides
        // Fondo azul para la cabecera
        doc.setFillColor(10, 25, 47)
        doc.rect(baseX, headerY2, colDepart, rowHeight, 'F')
        doc.rect(baseX + colDepart, headerY2, colFrom, rowHeight, 'F')
        doc.rect(baseX + colDepart + colFrom, headerY2, colTo, rowHeight, 'F')
        doc.rect(
          baseX + colDepart + colFrom + colTo,
          headerY2,
          colTravel,
          rowHeight,
          'F'
        )
        doc.rect(
          baseX + colDepart + colFrom + colTo + colTravel,
          headerY2,
          colArrival,
          rowHeight,
          'F'
        )
        doc.rect(
          baseX + colDepart + colFrom + colTo + colTravel + colArrival,
          headerY2,
          colTimeLoc,
          rowHeight,
          'F'
        )
        // Bordes más finos
        doc.setDrawColor(10, 25, 47)
        doc.setLineWidth(0.2)
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
        // Texto blanco, alineado a la izquierda
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
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
        // Restaurar color y grosor de línea
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)

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

      // ===== SECCIÓN 6: ENTRADAS LIBRES + LOCALIZACIONES (ORDEN COMBINADO) =====
      const recceRowsByLocation = {}
      const recceRowsByIndex = []
      recceRows.forEach((row, index) => {
        recceRowsByIndex.push(row)
        if (row.locationId) {
          recceRowsByLocation[row.locationId.toString()] = { row, index }
        }
      })

      const locationsById = {}
      if (proyecto.Locations) {
        proyecto.Locations.forEach((loc) => {
          locationsById[loc.id?.toString()] = loc
        })
      }

      // Crear lista combinada de elementos (entradas libres, vuelos y localizaciones) con orden
      // Usar el índice como orden por defecto si no hay campo order
      const combinedItems = []
      
      // Añadir entradas libres
      if (recceConfig.freeEntries && recceConfig.freeEntries.length > 0) {
        recceConfig.freeEntries.forEach((entry, index) => {
          combinedItems.push({
            type: 'freeEntry',
            order: entry.order !== undefined ? entry.order : index,
            data: entry
          })
        })
      }

      // Añadir vuelos
      if (recceConfig.flights && recceConfig.flights.length > 0) {
        recceConfig.flights.forEach((flight, index) => {
          combinedItems.push({
            type: 'flight',
            order: flight.order !== undefined ? flight.order : index + (recceConfig.freeEntries?.length || 0),
            data: flight
          })
        })
      }

      // Añadir notas (texto libre sin horario)
      if (recceConfig.notes && recceConfig.notes.length > 0) {
        recceConfig.notes.forEach((note, index) => {
          combinedItems.push({
            type: 'note',
            order: note.order !== undefined ? note.order : index + (recceConfig.freeEntries?.length || 0) + (recceConfig.flights?.length || 0),
            data: note
          })
        })
      }

      // Añadir localizaciones incluidas
      const includedLegs = (recceConfig.legs || []).filter(
        (leg) => leg.include && leg.locationId
      )
      includedLegs.forEach((leg, index) => {
        combinedItems.push({
          type: 'location',
          order: leg.order !== undefined ? leg.order : index + (recceConfig.freeEntries?.length || 0) + (recceConfig.flights?.length || 0) + (recceConfig.notes?.length || 0),
          data: leg
        })
      })

      // Ordenar por el campo order
      combinedItems.sort((a, b) => a.order - b.order)

      // Crear mapa de entradas libres a filas de la tabla
      const freeEntryToRowMap = new Map()
      let freeEntryIndex = 0
      recceRows.forEach((row, idx) => {
        if (row.isFreeEntry) {
          // Encontrar la entrada libre correspondiente por orden
          const freeEntry = recceConfig.freeEntries?.find((entry, i) => {
            const entryOrder = entry.order !== undefined ? entry.order : i
            return entryOrder === freeEntryIndex
          })
          if (freeEntry) {
            freeEntryToRowMap.set(freeEntry, { row, index: idx })
          }
          freeEntryIndex++
        }
      })

      // Renderizar elementos en orden combinado
      let locationIndex = 0
      for (const item of combinedItems) {
        if (item.type === 'freeEntry') {
          // Renderizar entrada libre
          if (y > pageHeight - marginBottom - 30) {
            doc.addPage()
            y = marginTop
          }
          
          const entryStartY = y
          const padding = 3
          
          // Buscar la fila correspondiente en la tabla para obtener los tiempos
          let arrivalTime = ''
          let departTime = ''
          const rowData = freeEntryToRowMap.get(item.data)
          
          if (rowData) {
            arrivalTime = rowData.row.arrivalTime || ''
            const rowIndex = rowData.index
            
            // Calcular depart: siguiente fila o arrival + timeOnPlace
            if (rowIndex < recceRows.length - 1) {
              departTime = recceRows[rowIndex + 1].departTime || ''
            } else if (arrivalTime && item.data.timeOnPlaceMinutes) {
              const arrivalMinutes = parseTimeToMinutes(arrivalTime)
              const timeOnPlaceMinutes = parseInt(item.data.timeOnPlaceMinutes || '0', 10) || 0
              if (arrivalMinutes != null) {
                const departMinutes = arrivalMinutes + timeOnPlaceMinutes
                departTime = formatMinutesToTime(departMinutes)
              }
            }
          }
          
          // Calcular altura total (texto principal + notas si hay)
          let entryHeight = 6 + padding * 2
          const entryNotes = (item.data.notes || '').trim()
          let noteLines = []
          if (entryNotes) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            noteLines = doc.splitTextToSize(entryNotes, usableWidth - padding * 2)
            const lineHeight = 4
            entryHeight += padding * 2 + noteLines.length * lineHeight
          }

          // Marco alrededor de la entrada libre
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.3)
          doc.rect(marginSides, entryStartY, usableWidth, entryHeight, 'S')

          // Primera fila: texto de la entrada + arrival/depart (dentro del marco)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 30, 30)
          const entryText = item.data.text || 'ENTRADA LIBRE'
          doc.text(entryText, marginSides + padding, entryStartY + padding + 3)

          if (arrivalTime || departTime) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(70, 70, 70)
            const timesText = [
              arrivalTime ? `Arrival: ${arrivalTime}` : '',
              departTime ? `Depart: ${departTime}` : ''
            ]
              .filter(Boolean)
              .join('   |   ')
            if (timesText) {
              doc.text(timesText, pageWidth - marginSides - padding, entryStartY + padding + 3, { align: 'right' })
            }
          }

          if (noteLines.length > 0) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 60)
            const lineHeight = 4
            const notesStartY = entryStartY + 6 + padding * 2
            noteLines.forEach((line, i) => {
              doc.text(line, marginSides + padding, notesStartY + padding + (i * lineHeight))
            })
          }

          y = entryStartY + entryHeight + 4
        } else if (item.type === 'flight') {
          // Renderizar vuelo
          if (y > pageHeight - marginBottom - 30) {
            doc.addPage()
            y = marginTop
          }
          
          const flightStartY = y
          const padding = 3
          
          // Marco sutil alrededor del vuelo
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.3)
          
          // Texto del vuelo
          const flightText = item.data.text || 'VUELO'
          
          // Calcular ancho disponible para el texto (restando espacio para "FLIGHTS")
          const flightsLabelWidth = 25
          const textMaxWidth = usableWidth - padding * 2 - flightsLabelWidth
          
          // Dividir texto en líneas
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          const textLines = doc.splitTextToSize(flightText, textMaxWidth)
          
          // Calcular altura total necesaria
          const lineHeight = 4.5
          const textHeight = textLines.length * lineHeight
          const minHeight = 6
          const flightHeight = Math.max(minHeight, textHeight) + padding * 2
          
          // Título FLIGHTS
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 50, 150) // Color púrpura
          doc.text('FLIGHTS', marginSides + padding, flightStartY + padding + 3)
          
          // Texto del vuelo
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 30, 30)
          doc.text(textLines, marginSides + padding + flightsLabelWidth, flightStartY + padding + 3)
          
          doc.rect(marginSides, flightStartY, usableWidth, flightHeight, 'S')
          
          y = flightStartY + flightHeight + 4
        } else if (item.type === 'note') {
          // Renderizar nota (texto libre sin horario)
          if (y > pageHeight - marginBottom - 30) {
            doc.addPage()
            y = marginTop
          }
          
          const noteStartY = y
          const padding = 3
          
          // Marco sutil alrededor de la nota
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.3)
          
          // Texto de la nota
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(60, 60, 60)
          
          const noteText = item.data.text || ''
          const textLines = doc.splitTextToSize(noteText || '', usableWidth - padding * 2)
          const noteHeight = Math.max(6, textLines.length * 4) + padding * 2
          
          doc.rect(marginSides, noteStartY, usableWidth, noteHeight, 'S')
          doc.text(textLines, marginSides + padding, noteStartY + padding + 3)
          
          y = noteStartY + noteHeight + 4
        } else if (item.type === 'location') {
          // Renderizar bloque de localización
          const leg = item.data
          const loc = locationsById[leg.locationId.toString()]
          if (!loc) continue

          const locationRowData = recceRowsByLocation[leg.locationId.toString()]
          const row = locationRowData ? locationRowData.row : null
          const rowIndex = locationRowData ? locationRowData.index : -1

          if (y > pageHeight - marginBottom - 80) {
            doc.addPage()
            y = marginTop
          }

          // Texto "Travel to ..."
          if (locationIndex > 0 && loc.nombre) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(90, 90, 90)
            doc.text(`Travel to ${loc.nombre}`, marginSides, y)
            y += 6
          }

          const blockStartY = y
          const padding = 3

          // Primera fila: nombre + arrival/depart (dentro del marco)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 30, 30)
          doc.text(loc.nombre || 'Location', marginSides + padding, y + padding + 3)

          if (row) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(70, 70, 70)
            
            // El arrival es correcto (row.arrivalTime)
            // El depart es el departTime de la siguiente fila en la tabla
            let departTime = ''
            if (rowIndex >= 0 && rowIndex < recceRowsByIndex.length - 1) {
              // Hay una siguiente fila, usar su departTime
              const nextRow = recceRowsByIndex[rowIndex + 1]
              departTime = nextRow.departTime || ''
            } else if (rowIndex >= 0 && row.arrivalTime && row.timeOnLocation) {
              // Es la última fila, calcular: arrival + timeOnLocation
              const arrivalMinutes = parseTimeToMinutes(row.arrivalTime)
              const timeOnLocationMinutes = parseInt(row.timeOnLocation.replace(' min', '') || '0', 10) || 0
              if (arrivalMinutes != null) {
                const departMinutes = arrivalMinutes + timeOnLocationMinutes
                departTime = formatMinutesToTime(departMinutes)
              }
            }
            
            const timesText = [
              row.arrivalTime ? `Arrival: ${row.arrivalTime}` : '',
              departTime ? `Depart: ${departTime}` : ''
            ]
              .filter(Boolean)
              .join('   |   ')
            if (timesText) {
              doc.text(timesText, pageWidth - marginSides - padding, y + padding + 3, { align: 'right' })
            }
          }

          y += 6 + padding

          // Segunda fila: link Google (mostrar URL completo)
          if (loc.googleMapsLink) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(30, 60, 150)
            // Dividir el link si es muy largo
            const linkLines = doc.splitTextToSize(loc.googleMapsLink, usableWidth - padding * 2)
            linkLines.forEach((line, idx) => {
              doc.textWithLink(line, marginSides + padding, y + (idx * 3.5), {
                url: loc.googleMapsLink
              })
            })
            y += linkLines.length * 3.5 + 2
          }

          // Marco sutil alrededor del bloque de localización (dibujar después de calcular el contenido)
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.3)

          // Tercera fila: dos imágenes lado a lado
          const imagenes =
            Array.isArray(loc.imagenes) && loc.imagenes.length > 0
              ? loc.imagenes
              : typeof loc.imagenes === 'string' && loc.imagenes
                ? JSON.parse(loc.imagenes)
                : []

          if (imagenes && imagenes.length > 0) {
            const gap = 4
            const imageWidth = (usableWidth - gap - padding * 2) / 2
            const imageHeight = imageWidth * (9 / 16)
            const imageY = y

            // Cargar y mostrar las imágenes reales
            const imagesToShow = imagenes.slice(0, 2)
            const imagePromises = imagesToShow.map((imgUrl, i) => {
              if (!imgUrl) return Promise.resolve(null)
              return loadImage(imgUrl)
                .then((img) => ({ img, index: i }))
                .catch((e) => {
                  console.error('Error cargando imagen:', e)
                  return null
                })
            })

            // Esperar a que todas las imágenes se carguen
            const loadedImages = await Promise.all(imagePromises)

            for (let i = 0; i < imagesToShow.length; i++) {
              const x = marginSides + padding + i * (imageWidth + gap)
              const loaded = loadedImages[i]
              if (loaded && loaded.img) {
                try {
                  doc.addImage(loaded.img, 'JPEG', x, imageY, imageWidth, imageHeight)
                } catch (e) {
                  console.error('Error añadiendo imagen al PDF:', e)
                  // Placeholder si falla
                  doc.setFillColor(240, 240, 240)
                  doc.rect(x, imageY, imageWidth, imageHeight, 'F')
                  doc.setFontSize(8)
                  doc.setTextColor(150, 150, 150)
                  doc.text('Error', x + imageWidth / 2, imageY + imageHeight / 2, {
                    align: 'center'
                  })
                }
              } else {
                // Placeholder si no hay imagen
                doc.setFillColor(240, 240, 240)
                doc.rect(x, imageY, imageWidth, imageHeight, 'F')
                doc.setFontSize(8)
                doc.setTextColor(150, 150, 150)
                doc.text('Sin imagen', x + imageWidth / 2, imageY + imageHeight / 2, {
                  align: 'center'
                })
              }
              doc.setTextColor(0, 0, 0)
            }

            y = imageY + imageHeight + padding
          } else {
            y += padding
          }

          // Cerrar el marco del bloque de localización (incluye todo el contenido)
          const blockHeight = y - blockStartY + padding
          doc.rect(marginSides, blockStartY, usableWidth, blockHeight, 'S')
          
          // Restaurar color de línea para el siguiente elemento
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.5)

          // Separación entre bloques
          y += 6
          locationIndex++
        }
      }

      // ===== PIE DE PÁGINA (FOOTER) =====
      // Añadir información de empresa en el pie de página de todas las páginas
      const totalPages = doc.internal.pages.length - 1
      const footerY = pageHeight - marginBottom
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum)
        
        // Línea superior del pie de página (con más separación)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.line(marginSides, footerY - 12, pageWidth - marginSides, footerY - 12)
        
        // Información de empresa (company, address, CIF) centrada
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        
        const footerInfo = []
        if (proyecto.company) {
          footerInfo.push(proyecto.company)
        }
        if (proyecto.address) {
          footerInfo.push(proyecto.address)
        }
        if (proyecto.cif) {
          footerInfo.push(`CIF: ${proyecto.cif}`)
        }
        
        if (footerInfo.length > 0) {
          const footerText = footerInfo.join(' | ')
          const centerX = pageWidth / 2
          const footerLines = doc.splitTextToSize(footerText, usableWidth)
          footerLines.forEach((line, index) => {
            doc.text(line, centerX, footerY - 8 + (index * 3), { align: 'center' })
          })
        }
      }

      doc.save(`${proyecto.nombre || 'proyecto'}_location_recce.pdf`)
    } catch (error) {
      console.error('Error generando Location Recce PDF:', error)
      alert('Error al generar el PDF de Location Recce')
    } finally {
      setGenerating(false)
      setShowRecceModal(false)
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

        <div className="space-y-6">
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


          {/* Plantilla Location Recce */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a4 4 0 00-4 4v1m4-5a4 4 0 014 4v1m-9 4h10l1 4H6l1-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Location Recce</h3>
                <p className="text-xs text-gray-500">Plan de recce con tiempos y asistentes</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Genera un documento de recce con planning, asistentes, tabla de tiempos y bloques de localización del proyecto. Puedes guardar múltiples versiones de este documento.
            </p>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setEditingRecceDocument(null)
                  setRecceDocumentName('')
                  setRecceConfig({
                    documentTitle: 'LOCATION RECCE',
                    recceSchedule: '',
                    meetingPoint: '',
                    meetingPointLink: '',
                    departureTime: '08:00',
                    locationManagerName: proyecto.locationManager || '',
                    locationManagerPhone: '',
                    locationManagerEmail: '',
                    sunriseTime: '',
                    sunsetTime: '',
                    weatherForecast: '',
                    attendants: (proyecto.Crews || []).map((c, index) => ({
                      name: c.nombre || '',
                      position: c.rol || '',
                      phone: c.telefono || '',
                      email: c.email || '',
                      order: index
                    })),
                  legs: (proyecto.Locations || []).map((loc, index) => ({
                    include: true,
                    locationId: loc.id?.toString(),
                    travelTimeMinutes: '15',
                    timeOnLocationMinutes: '60',
                    order: index
                  })),
                    freeEntries: [],
                    flights: [],
                    notes: []
                  })
                  setShowRecceModal(true)
                }}
                disabled={generating || !proyecto.Locations || proyecto.Locations.length === 0}
                className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo documento
              </button>
            </div>
            {(!proyecto.Locations || proyecto.Locations.length === 0) ? (
              <p className="text-xs text-gray-500 text-center py-4">
                Este proyecto no tiene locations asignadas
              </p>
            ) : savedRecceDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay documentos Recce guardados. Crea el primero pulsando &quot;Nuevo documento&quot;.
              </p>
            ) : (
              <div className="space-y-2">
                {savedRecceDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-accent-green/50 transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{doc.nombre}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API_URL}/recce-documents/${doc.id}`, { withCredentials: true })
                            const savedDoc = response.data
                            setEditingRecceDocument(savedDoc)
                            setRecceDocumentName(savedDoc.nombre)
                            
                            // Función auxiliar para parsear campos JSON
                            const parseJsonField = (field) => {
                              if (!field) return []
                              if (Array.isArray(field)) return field
                              if (typeof field === 'string') {
                                try {
                                  const parsed = JSON.parse(field)
                                  return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
                                } catch (e) {
                                  console.error('Error parseando JSON:', e)
                                  return []
                                }
                              }
                              return [field]
                            }
                            
                            const parsedAttendants = parseJsonField(savedDoc.attendants)
                            const parsedLegs = parseJsonField(savedDoc.legs)
                            const parsedFreeEntries = parseJsonField(savedDoc.freeEntries)
                            const parsedFlights = parseJsonField(savedDoc.flights)
                            const parsedNotes = parseJsonField(savedDoc.notes)
                            
                            // Limpiar campos de tiempo de los vuelos (no deben tener tiempos)
                            const cleanedFlights = parsedFlights.map(flight => ({
                              text: flight.text || '',
                              order: flight.order !== undefined ? flight.order : 0
                            }))
                            
                            setRecceConfig({
                              documentTitle: savedDoc.documentTitle || 'LOCATION RECCE',
                              recceSchedule: savedDoc.recceSchedule || '',
                              meetingPoint: savedDoc.meetingPoint || '',
                              meetingPointLink: savedDoc.meetingPointLink || '',
                              departureTime: savedDoc.departureTime || '',
                              locationManagerName: savedDoc.locationManagerName || '',
                              locationManagerPhone: savedDoc.locationManagerPhone || '',
                              locationManagerEmail: savedDoc.locationManagerEmail || '',
                              sunriseTime: savedDoc.sunriseTime || '',
                              sunsetTime: savedDoc.sunsetTime || '',
                              weatherForecast: savedDoc.weatherForecast || '',
                              attendants: parsedAttendants.map((att, index) => ({
                                ...att,
                                order: att.order !== undefined ? att.order : index
                              })),
                              legs: parsedLegs,
                              freeEntries: parsedFreeEntries,
                              flights: cleanedFlights,
                              notes: parsedNotes
                            })
                            setShowRecceModal(true)
                          } catch (error) {
                            console.error('Error cargando documento:', error)
                            alert('Error al cargar el documento')
                          }
                        }}
                        className="p-1.5 text-gray-600 hover:text-dark-blue hover:bg-gray-100 rounded transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API_URL}/recce-documents/${doc.id}`, { withCredentials: true })
                            const savedDoc = response.data
                            
                            // Función auxiliar para parsear campos JSON
                            const parseJsonField = (field) => {
                              if (!field) return []
                              if (Array.isArray(field)) return field
                              if (typeof field === 'string') {
                                try {
                                  const parsed = JSON.parse(field)
                                  return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
                                } catch (e) {
                                  console.error('Error parseando JSON:', e)
                                  return []
                                }
                              }
                              return [field]
                            }
                            
                            const parsedAttendants = parseJsonField(savedDoc.attendants)
                            const parsedLegs = parseJsonField(savedDoc.legs)
                            const parsedFreeEntries = parseJsonField(savedDoc.freeEntries)
                            const parsedFlights = parseJsonField(savedDoc.flights)
                            const parsedNotes = parseJsonField(savedDoc.notes)
                            
                            // Limpiar campos de tiempo de los vuelos (no deben tener tiempos)
                            const cleanedFlights = parsedFlights.map(flight => ({
                              text: flight.text || '',
                              order: flight.order !== undefined ? flight.order : 0
                            }))
                            
                            // Crear nuevo documento con datos duplicados
                            const duplicateData = {
                              proyectoId: id,
                              nombre: `${savedDoc.nombre} (copia)`,
                              documentTitle: savedDoc.documentTitle || 'LOCATION RECCE',
                              recceSchedule: savedDoc.recceSchedule || '',
                              meetingPoint: savedDoc.meetingPoint || '',
                              meetingPointLink: savedDoc.meetingPointLink || '',
                              departureTime: savedDoc.departureTime || '',
                              locationManagerName: savedDoc.locationManagerName || '',
                              locationManagerPhone: savedDoc.locationManagerPhone || '',
                              locationManagerEmail: savedDoc.locationManagerEmail || '',
                              sunriseTime: savedDoc.sunriseTime || '',
                              sunsetTime: savedDoc.sunsetTime || '',
                              weatherForecast: savedDoc.weatherForecast || '',
                              attendants: parsedAttendants.map((att, index) => ({
                                ...att,
                                order: att.order !== undefined ? att.order : index
                              })),
                              legs: parsedLegs,
                              freeEntries: parsedFreeEntries,
                              flights: cleanedFlights,
                              notes: parsedNotes
                            }
                            
                            await axios.post(`${API_URL}/recce-documents`, duplicateData, { withCredentials: true })
                            await loadSavedRecceDocuments()
                            alert('Documento duplicado correctamente')
                          } catch (error) {
                            console.error('Error duplicando documento:', error)
                            alert('Error al duplicar el documento')
                          }
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Duplicar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar "${doc.nombre}"?`)) return
                          try {
                            await axios.delete(`${API_URL}/recce-documents/${doc.id}`, { withCredentials: true })
                            await loadSavedRecceDocuments()
                          } catch (error) {
                            console.error('Error eliminando documento:', error)
                            alert('Error al eliminar el documento')
                          }
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API_URL}/recce-documents/${doc.id}`, { withCredentials: true })
                            const savedDoc = response.data
                            
                            // Función auxiliar para parsear campos JSON
                            const parseJsonField = (field) => {
                              if (!field) return []
                              if (Array.isArray(field)) return field
                              if (typeof field === 'string') {
                                try {
                                  const parsed = JSON.parse(field)
                                  return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
                                } catch (e) {
                                  console.error('Error parseando JSON:', e)
                                  return []
                                }
                              }
                              return [field]
                            }
                            
                            const parsedAttendants = parseJsonField(savedDoc.attendants)
                            const parsedLegs = parseJsonField(savedDoc.legs)
                            const parsedFreeEntries = parseJsonField(savedDoc.freeEntries)
                            const parsedFlights = parseJsonField(savedDoc.flights)
                            const parsedNotes = parseJsonField(savedDoc.notes)
                            
                            // Limpiar campos de tiempo de los vuelos (no deben tener tiempos)
                            const cleanedFlights = parsedFlights.map(flight => ({
                              text: flight.text || '',
                              order: flight.order !== undefined ? flight.order : 0
                            }))
                            
                            setRecceConfig({
                              documentTitle: savedDoc.documentTitle || 'LOCATION RECCE',
                              recceSchedule: savedDoc.recceSchedule || '',
                              meetingPoint: savedDoc.meetingPoint || '',
                              meetingPointLink: savedDoc.meetingPointLink || '',
                              departureTime: savedDoc.departureTime || '',
                              locationManagerName: savedDoc.locationManagerName || '',
                              locationManagerPhone: savedDoc.locationManagerPhone || '',
                              locationManagerEmail: savedDoc.locationManagerEmail || '',
                              sunriseTime: savedDoc.sunriseTime || '',
                              sunsetTime: savedDoc.sunsetTime || '',
                              weatherForecast: savedDoc.weatherForecast || '',
                              attendants: parsedAttendants.map((att, index) => ({
                                ...att,
                                order: att.order !== undefined ? att.order : index
                              })),
                              legs: parsedLegs,
                              freeEntries: parsedFreeEntries,
                              flights: cleanedFlights,
                              notes: parsedNotes
                            })
                            await generateLocationReccePDF()
                          } catch (error) {
                            console.error('Error cargando documento:', error)
                            alert('Error al cargar el documento')
                          }
                        }}
                        className="px-3 py-1.5 bg-dark-blue text-white text-xs rounded-lg hover:bg-dark-blue-light transition-colors"
                      >
                        Generar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
              {/* Nombre del documento (solo si está guardando) */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recceDocumentName}
                  onChange={(e) => setRecceDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Ej: Recce Día 1 - Mañana"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre te ayudará a identificar el documento guardado
                </p>
              </div>

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
                <div>
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
                    Meeting point - Link Google Maps
                  </label>
                  <input
                    type="url"
                    value={recceConfig.meetingPointLink}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, meetingPointLink: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de salida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recceConfig.departureTime}
                    onChange={(e) =>
                      setRecceConfig({ ...recceConfig, departureTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: 08:00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hora de salida desde el meeting point
                  </p>
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
                    onClick={() => {
                      const maxOrder = Math.max(
                        ...(recceConfig.attendants || []).map(a => a.order !== undefined ? a.order : -1),
                        -1
                      )
                      setRecceConfig({
                        ...recceConfig,
                        attendants: [
                          ...(recceConfig.attendants || []),
                          { name: '', position: '', phone: '', email: '', order: maxOrder + 1 }
                        ]
                      })
                    }}
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
                    {(() => {
                      // Ordenar attendants por order
                      const sortedAttendants = [...(recceConfig.attendants || [])].map((att, index) => ({
                        ...att,
                        order: att.order !== undefined ? att.order : index
                      })).sort((a, b) => a.order - b.order)
                      
                      const moveAttendant = (currentIndex, direction) => {
                        if (direction === 'up' && currentIndex === 0) return
                        if (direction === 'down' && currentIndex === sortedAttendants.length - 1) return

                        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
                        const item = sortedAttendants[currentIndex]
                        const targetItem = sortedAttendants[newIndex]

                        // Intercambiar orders
                        const tempOrder = item.order
                        const newOrder = targetItem.order
                        const targetNewOrder = tempOrder

                        // Actualizar en el estado
                        setRecceConfig(prev => {
                          const newAttendants = [...prev.attendants]
                          const itemIndex = newAttendants.findIndex(a => 
                            a.name === item.name && a.position === item.position && a.phone === item.phone && a.email === item.email
                          )
                          const targetIndex = newAttendants.findIndex(a => 
                            a.name === targetItem.name && a.position === targetItem.position && a.phone === targetItem.phone && a.email === targetItem.email
                          )
                          
                          if (itemIndex >= 0 && targetIndex >= 0) {
                            newAttendants[itemIndex] = { ...newAttendants[itemIndex], order: newOrder }
                            newAttendants[targetIndex] = { ...newAttendants[targetIndex], order: targetNewOrder }
                          }
                          
                          return { ...prev, attendants: newAttendants }
                        })
                      }
                      
                      return sortedAttendants.map((att, displayIndex) => {
                        const originalIndex = recceConfig.attendants.findIndex(a => 
                          a.name === att.name && a.position === att.position && a.phone === att.phone && a.email === att.email
                        )
                        
                        return (
                          <div
                            key={originalIndex}
                            className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 items-center bg-gray-50/50 p-2 rounded border border-gray-200"
                          >
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => moveAttendant(displayIndex, 'up')}
                                disabled={displayIndex === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover arriba"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveAttendant(displayIndex, 'down')}
                                disabled={displayIndex === sortedAttendants.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover abajo"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={att.name}
                              onChange={(e) => {
                                const updated = [...recceConfig.attendants]
                                updated[originalIndex] = { ...updated[originalIndex], name: e.target.value }
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
                                updated[originalIndex] = { ...updated[originalIndex], position: e.target.value }
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
                                updated[originalIndex] = { ...updated[originalIndex], phone: e.target.value }
                                setRecceConfig({ ...recceConfig, attendants: updated })
                              }}
                              className="px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="Teléfono"
                            />
                            <input
                              type="email"
                              value={att.email}
                              onChange={(e) => {
                                const updated = [...recceConfig.attendants]
                                updated[originalIndex] = { ...updated[originalIndex], email: e.target.value }
                                setRecceConfig({ ...recceConfig, attendants: updated })
                              }}
                              className="px-2 py-1.5 border rounded-lg text-xs"
                              placeholder="Email"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = recceConfig.attendants.filter((_, i) => i !== originalIndex)
                                setRecceConfig({ ...recceConfig, attendants: updated })
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Eliminar
                            </button>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              {/* Lista combinada de elementos (localizaciones y entradas libres) */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-1">
                      Orden de elementos en el documento
                    </h3>
                    <p className="text-xs text-gray-500">
                      Arrastra o usa los botones para reordenar localizaciones, entradas libres, vuelos y notas
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        // Añadir nueva entrada libre al final
                        const maxOrder = Math.max(
                          ...(recceConfig.freeEntries || []).map(e => e.order !== undefined ? e.order : -1),
                          ...(recceConfig.legs || []).map(l => l.order !== undefined ? l.order : -1),
                          ...(recceConfig.flights || []).map(f => f.order !== undefined ? f.order : -1),
                          ...(recceConfig.notes || []).map(n => n.order !== undefined ? n.order : -1),
                          -1
                        )
                        setRecceConfig({
                          ...recceConfig,
                          freeEntries: [
                            ...(recceConfig.freeEntries || []),
                            { text: '', notes: '', travelTimeMinutes: '', timeOnPlaceMinutes: '', order: maxOrder + 1 }
                          ]
                        })
                      }}
                      className="text-[10px] text-dark-blue hover:text-dark-blue-light px-1.5 py-0.5 border border-dark-blue rounded"
                    >
                      + Entrada libre
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Añadir nuevo vuelo al final
                        const maxOrder = Math.max(
                          ...(recceConfig.freeEntries || []).map(e => e.order !== undefined ? e.order : -1),
                          ...(recceConfig.legs || []).map(l => l.order !== undefined ? l.order : -1),
                          ...(recceConfig.flights || []).map(f => f.order !== undefined ? f.order : -1),
                          ...(recceConfig.notes || []).map(n => n.order !== undefined ? n.order : -1),
                          -1
                        )
                        setRecceConfig({
                          ...recceConfig,
                          flights: [
                            ...(recceConfig.flights || []),
                            { text: '', order: maxOrder + 1 }
                          ]
                        })
                      }}
                      className="text-[10px] text-dark-blue hover:text-dark-blue-light px-1.5 py-0.5 border border-dark-blue rounded flex items-center gap-0.5"
                    >
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      + Vuelo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Añadir nueva nota de texto libre al final
                        const maxOrder = Math.max(
                          ...(recceConfig.freeEntries || []).map(e => e.order !== undefined ? e.order : -1),
                          ...(recceConfig.legs || []).map(l => l.order !== undefined ? l.order : -1),
                          ...(recceConfig.flights || []).map(f => f.order !== undefined ? f.order : -1),
                          ...(recceConfig.notes || []).map(n => n.order !== undefined ? n.order : -1),
                          -1
                        )
                        setRecceConfig({
                          ...recceConfig,
                          notes: [
                            ...(recceConfig.notes || []),
                            { text: '', order: maxOrder + 1 }
                          ]
                        })
                      }}
                      className="text-[10px] text-dark-blue hover:text-dark-blue-light px-1.5 py-0.5 border border-dark-blue rounded flex items-center gap-0.5"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      + Nota
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        // Recargar el proyecto para obtener las localizaciones actualizadas
                        try {
                          const response = await axios.get(`${API_URL}/proyectos/${id}`, { withCredentials: true })
                          setProyecto(response.data)
                          
                          // Mostrar modal de selección de localizaciones
                          const availableLocations = (response.data.Locations || []).filter(
                            loc => !(recceConfig.legs || []).some(leg => leg.locationId?.toString() === loc.id?.toString())
                          )
                          if (availableLocations.length === 0) {
                            alert('Todas las localizaciones ya están añadidas')
                            return
                          }
                          setLocationSearchText('')
                          setShowLocationSelectorModal(true)
                        } catch (error) {
                          console.error('Error recargando proyecto:', error)
                          alert('Error al cargar las localizaciones. Por favor, intenta de nuevo.')
                        }
                      }}
                      className="text-[10px] text-dark-blue hover:text-dark-blue-light px-1.5 py-0.5 border border-dark-blue rounded"
                    >
                      + Localización
                    </button>
                  </div>
                </div>

                {(() => {
                  // Calcular tiempos en tiempo real
                  const previewRows = computeRecceRows(recceConfig, proyecto)
                  const previewRowsByLocation = {}
                  const previewRowsByIndex = []
                  previewRows.forEach((row, index) => {
                    previewRowsByIndex.push(row)
                    if (row.locationId) {
                      previewRowsByLocation[row.locationId.toString()] = { row, index }
                    }
                  })

                  // Crear lista combinada ordenada
                  const combinedItems = []
                  
                  // Añadir entradas libres
                  if (recceConfig.freeEntries && recceConfig.freeEntries.length > 0) {
                    recceConfig.freeEntries.forEach((entry, index) => {
                      combinedItems.push({
                        type: 'freeEntry',
                        order: entry.order !== undefined ? entry.order : index,
                        data: entry,
                        originalIndex: index
                      })
                    })
                  }

                  // Añadir vuelos
                  if (recceConfig.flights && recceConfig.flights.length > 0) {
                    recceConfig.flights.forEach((flight, index) => {
                      combinedItems.push({
                        type: 'flight',
                        order: flight.order !== undefined ? flight.order : index + (recceConfig.freeEntries?.length || 0),
                        data: flight,
                        originalIndex: index
                      })
                    })
                  }

                  // Añadir notas (texto libre sin horario)
                  if (recceConfig.notes && recceConfig.notes.length > 0) {
                    recceConfig.notes.forEach((note, index) => {
                      combinedItems.push({
                        type: 'note',
                        order: note.order !== undefined ? note.order : index + (recceConfig.freeEntries?.length || 0) + (recceConfig.flights?.length || 0),
                        data: note,
                        originalIndex: index
                      })
                    })
                  }

                  // Añadir localizaciones
                  if (recceConfig.legs && recceConfig.legs.length > 0) {
                    recceConfig.legs.forEach((leg, index) => {
                      combinedItems.push({
                        type: 'location',
                        order: leg.order !== undefined ? leg.order : index + (recceConfig.freeEntries?.length || 0) + (recceConfig.flights?.length || 0) + (recceConfig.notes?.length || 0),
                        data: leg,
                        originalIndex: index
                      })
                    })
                  }

                  // Ordenar por order
                  combinedItems.sort((a, b) => a.order - b.order)
                  
                  // Añadir información de tiempos a cada elemento
                  // Crear un mapa de entradas libres a filas de la tabla
                  const freeEntryToRowMap = new Map()
                  let freeEntryIndex = 0
                  previewRowsByIndex.forEach((row, idx) => {
                    if (row.isFreeEntry) {
                      // Buscar la entrada libre correspondiente por orden
                      const entryOrder = recceConfig.freeEntries?.[freeEntryIndex]?.order !== undefined
                        ? recceConfig.freeEntries[freeEntryIndex].order
                        : freeEntryIndex
                      const freeEntry = recceConfig.freeEntries?.find((entry, i) => {
                        const entryOrderCheck = entry.order !== undefined ? entry.order : i
                        return entryOrderCheck === entryOrder
                      })
                      if (freeEntry) {
                        freeEntryToRowMap.set(freeEntry, { row, index: idx })
                      }
                      freeEntryIndex++
                    }
                  })

                  combinedItems.forEach((item) => {
                    if (item.type === 'freeEntry') {
                      // Buscar la fila correspondiente a esta entrada libre usando el mapa
                      const rowData = freeEntryToRowMap.get(item.data)
                      if (rowData) {
                        item.previewRow = rowData.row
                        item.previewRowIndex = rowData.index
                      }
                    } else if (item.type === 'location' && item.data.include) {
                      const locationRowData = previewRowsByLocation[item.data.locationId?.toString()]
                      if (locationRowData) {
                        item.previewRow = locationRowData.row
                        item.previewRowIndex = locationRowData.index
                      }
                    }
                    // Las notas (item.type === 'note') y vuelos (item.type === 'flight') no tienen tiempos, así que no se procesan aquí
                  })

                  if (combinedItems.length === 0) {
                    return (
                      <p className="text-xs text-gray-500">
                        No hay elementos. Añade localizaciones, entradas libres, vuelos o notas para comenzar.
                      </p>
                    )
                  }

                  const moveItem = (currentIndex, direction) => {
                    if (direction === 'up' && currentIndex === 0) return
                    if (direction === 'down' && currentIndex === combinedItems.length - 1) return

                    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
                    const item = combinedItems[currentIndex]
                    const targetItem = combinedItems[newIndex]

                    // Intercambiar orders
                    const tempOrder = item.order
                    const newOrder = targetItem.order
                    const targetNewOrder = tempOrder

                    // Actualizar en el estado de forma atómica
                    setRecceConfig(prev => {
                      const newConfig = { ...prev }
                      
                      if (item.type === 'freeEntry') {
                        const updated = [...newConfig.freeEntries]
                        updated[item.originalIndex] = { ...updated[item.originalIndex], order: newOrder }
                        newConfig.freeEntries = updated
                      } else if (item.type === 'flight') {
                        const updated = [...newConfig.flights]
                        updated[item.originalIndex] = { ...updated[item.originalIndex], order: newOrder }
                        newConfig.flights = updated
                      } else if (item.type === 'note') {
                        const updated = [...newConfig.notes]
                        updated[item.originalIndex] = { ...updated[item.originalIndex], order: newOrder }
                        newConfig.notes = updated
                      } else {
                        const updated = [...newConfig.legs]
                        updated[item.originalIndex] = { ...updated[item.originalIndex], order: newOrder }
                        newConfig.legs = updated
                      }

                      if (targetItem.type === 'freeEntry') {
                        const updated = [...newConfig.freeEntries]
                        updated[targetItem.originalIndex] = { ...updated[targetItem.originalIndex], order: targetNewOrder }
                        newConfig.freeEntries = updated
                      } else if (targetItem.type === 'flight') {
                        const updated = [...newConfig.flights]
                        updated[targetItem.originalIndex] = { ...updated[targetItem.originalIndex], order: targetNewOrder }
                        newConfig.flights = updated
                      } else if (targetItem.type === 'note') {
                        const updated = [...newConfig.notes]
                        updated[targetItem.originalIndex] = { ...updated[targetItem.originalIndex], order: targetNewOrder }
                        newConfig.notes = updated
                      } else {
                        const updated = [...newConfig.legs]
                        updated[targetItem.originalIndex] = { ...updated[targetItem.originalIndex], order: targetNewOrder }
                        newConfig.legs = updated
                      }

                      return newConfig
                    })
                  }

                  return (
                    <div className="space-y-2">
                      {combinedItems.map((item, displayIndex) => {
                        if (item.type === 'freeEntry') {
                          // Calcular tiempos para esta entrada libre
                          const row = item.previewRow
                          let arrivalTime = ''
                          let departTime = ''
                          
                          if (row) {
                            arrivalTime = row.arrivalTime || ''
                            
                            // Calcular departTime: siguiente fila o arrival + timeOnPlace
                            if (item.previewRowIndex !== undefined && item.previewRowIndex < previewRowsByIndex.length - 1) {
                              const nextRow = previewRowsByIndex[item.previewRowIndex + 1]
                              departTime = nextRow.departTime || ''
                            } else if (arrivalTime && item.data.timeOnPlaceMinutes) {
                              const arrivalMinutes = parseTimeToMinutes(arrivalTime)
                              const timeOnPlaceMinutes = parseInt(item.data.timeOnPlaceMinutes || '0', 10) || 0
                              if (arrivalMinutes != null) {
                                const departMinutes = arrivalMinutes + timeOnPlaceMinutes
                                departTime = formatMinutesToTime(departMinutes)
                              }
                            }
                          }
                          
                          return (
                            <div
                              key={`free-${item.originalIndex}`}
                              className="flex flex-col gap-2 text-xs bg-blue-50/30 p-2 rounded border border-blue-100"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr_80px_80px_100px_100px_auto] gap-2 items-center">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveItem(displayIndex, 'up')}
                                    disabled={displayIndex === 0}
                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Mover arriba"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItem(displayIndex, 'down')}
                                    disabled={displayIndex === combinedItems.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Mover abajo"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">ENTRADA</div>
                                <input
                                  type="text"
                                  value={item.data.text || ''}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.freeEntries]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], text: e.target.value }
                                    setRecceConfig({ ...recceConfig, freeEntries: updated })
                                  }}
                                  className="px-2 py-1.5 border rounded-lg"
                                  placeholder="Texto (aparece en tabla de tiempos)"
                                />
                                <input
                                  type="number"
                                  value={item.data.travelTimeMinutes || ''}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.freeEntries]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], travelTimeMinutes: e.target.value }
                                    setRecceConfig({ ...recceConfig, freeEntries: updated })
                                  }}
                                  className="px-2 py-1.5 border rounded-lg"
                                  placeholder="Travel (min)"
                                />
                                <input
                                  type="number"
                                  value={item.data.timeOnPlaceMinutes || ''}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.freeEntries]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], timeOnPlaceMinutes: e.target.value }
                                    setRecceConfig({ ...recceConfig, freeEntries: updated })
                                  }}
                                  className="px-2 py-1.5 border rounded-lg"
                                  placeholder="Time on place (min)"
                                />
                                <div className="text-[10px] text-gray-600 font-medium">
                                  {arrivalTime ? `Arrival: ${arrivalTime}` : ''}
                                </div>
                                <div className="text-[10px] text-gray-600 font-medium">
                                  {departTime ? `Depart: ${departTime}` : ''}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = recceConfig.freeEntries.filter((_, i) => i !== item.originalIndex)
                                    setRecceConfig({ ...recceConfig, freeEntries: updated })
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-600 px-1 py-0.5"
                                >
                                  Eliminar
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-2 items-start">
                                <span className="text-[10px] text-gray-500 font-medium">Notas (solo en documento)</span>
                                <textarea
                                  value={item.data.notes || ''}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.freeEntries]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], notes: e.target.value }
                                    setRecceConfig({ ...recceConfig, freeEntries: updated })
                                  }}
                                  className="px-2 py-1.5 border rounded-lg min-h-[44px] resize-y"
                                  placeholder="Notas que aparecen en el documento pero no en la tabla de tiempos"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )
                        } else if (item.type === 'flight') {
                          return (
                            <div
                              key={`flight-${item.originalIndex}`}
                              className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr_auto] gap-2 items-center text-xs bg-purple-50/30 p-2 rounded border border-purple-100"
                            >
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'up')}
                                  disabled={displayIndex === 0}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'down')}
                                  disabled={displayIndex === combinedItems.length - 1}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-[10px] text-purple-600 font-bold uppercase md:pt-1">
                                FLIGHTS
                              </div>
                              <textarea
                                value={item.data.text || ''}
                                onChange={(e) => {
                                  const updated = [...recceConfig.flights]
                                  updated[item.originalIndex] = { ...updated[item.originalIndex], text: e.target.value }
                                  setRecceConfig({ ...recceConfig, flights: updated })
                                }}
                                className="px-2 py-1.5 border rounded-lg min-h-[44px] resize-y"
                                placeholder="Información del vuelo (varias líneas)"
                                rows={2}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = recceConfig.flights.filter((_, i) => i !== item.originalIndex)
                                  setRecceConfig({ ...recceConfig, flights: updated })
                                }}
                                className="text-[10px] text-red-500 hover:text-red-600 px-1 py-0.5"
                              >
                                Eliminar
                              </button>
                            </div>
                          )
                        } else if (item.type === 'note') {
                          return (
                            <div
                              key={`note-${item.originalIndex}`}
                              className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 items-center text-xs bg-gray-50/30 p-2 rounded border border-gray-200"
                            >
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'up')}
                                  disabled={displayIndex === 0}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'down')}
                                  disabled={displayIndex === combinedItems.length - 1}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <input
                                  type="text"
                                  value={item.data.text || ''}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.notes]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], text: e.target.value }
                                    setRecceConfig({ ...recceConfig, notes: updated })
                                  }}
                                  className="flex-1 px-2 py-1.5 border rounded-lg"
                                  placeholder="Texto libre sin horario..."
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = recceConfig.notes.filter((_, i) => i !== item.originalIndex)
                                  setRecceConfig({ ...recceConfig, notes: updated })
                                }}
                                className="text-[10px] text-red-500 hover:text-red-600 px-1 py-0.5"
                              >
                                Eliminar
                              </button>
                            </div>
                          )
                        } else {
                          const loc = (proyecto.Locations || []).find(
                            (l) => l.id?.toString() === item.data.locationId?.toString()
                          ) || {}
                          
                          // Calcular tiempos para esta localización
                          const locationRowData = previewRowsByLocation[item.data.locationId?.toString()]
                          const row = locationRowData ? locationRowData.row : null
                          const rowIndex = locationRowData ? locationRowData.index : -1
                          
                          let departTime = ''
                          if (rowIndex >= 0 && rowIndex < previewRowsByIndex.length - 1) {
                            const nextRow = previewRowsByIndex[rowIndex + 1]
                            departTime = nextRow.departTime || ''
                          } else if (rowIndex >= 0 && row && row.arrivalTime && item.data.timeOnLocationMinutes) {
                            const arrivalMinutes = parseTimeToMinutes(row.arrivalTime)
                            const timeOnLocationMinutes = parseInt(item.data.timeOnLocationMinutes || '0', 10) || 0
                            if (arrivalMinutes != null) {
                              const departMinutes = arrivalMinutes + timeOnLocationMinutes
                              departTime = formatMinutesToTime(departMinutes)
                            }
                          }
                          
                          return (
                            <div
                              key={`leg-${item.originalIndex}`}
                              className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr_80px_80px_100px_100px_auto] gap-2 items-center text-xs bg-green-50/30 p-2 rounded border border-green-100"
                            >
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'up')}
                                  disabled={displayIndex === 0}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveItem(displayIndex, 'down')}
                                  disabled={displayIndex === combinedItems.length - 1}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!item.data.include}
                                  onChange={(e) => {
                                    const updated = [...recceConfig.legs]
                                    updated[item.originalIndex] = { ...updated[item.originalIndex], include: e.target.checked }
                                    setRecceConfig({ ...recceConfig, legs: updated })
                                  }}
                                />
                                <span className="font-medium text-gray-800 text-[10px]">
                                  {loc.nombre || `Location ${item.data.locationId}`}
                                </span>
                              </label>
                              <input
                                type="number"
                                value={item.data.travelTimeMinutes || ''}
                                onChange={(e) => {
                                  const updated = [...recceConfig.legs]
                                  updated[item.originalIndex] = {
                                    ...updated[item.originalIndex],
                                    travelTimeMinutes: e.target.value
                                  }
                                  setRecceConfig({ ...recceConfig, legs: updated })
                                }}
                                className="px-2 py-1.5 border rounded-lg text-[10px]"
                                placeholder="Travel (min)"
                              />
                              <input
                                type="number"
                                value={item.data.timeOnLocationMinutes || ''}
                                onChange={(e) => {
                                  const updated = [...recceConfig.legs]
                                  updated[item.originalIndex] = {
                                    ...updated[item.originalIndex],
                                    timeOnLocationMinutes: e.target.value
                                  }
                                  setRecceConfig({ ...recceConfig, legs: updated })
                                }}
                                className="px-2 py-1.5 border rounded-lg text-[10px]"
                                placeholder="Time on loc (min)"
                              />
                              <div className="text-[10px] text-gray-600 font-medium">
                                {row?.arrivalTime ? `Arrival: ${row.arrivalTime}` : ''}
                              </div>
                              <div className="text-[10px] text-gray-600 font-medium">
                                {departTime ? `Depart: ${departTime}` : ''}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = recceConfig.legs.filter((_, i) => i !== item.originalIndex)
                                  setRecceConfig({ ...recceConfig, legs: updated })
                                }}
                                className="text-[10px] text-red-500 hover:text-red-600 px-1 py-0.5"
                              >
                                Eliminar
                              </button>
                            </div>
                          )
                        }
                      })}
                    </div>
                  )
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecceModal(false)
                    setEditingRecceDocument(null)
                    setRecceDocumentName('')
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  disabled={generating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!recceDocumentName.trim()) {
                      alert('Por favor, introduce un nombre para el documento')
                      return
                    }
                    try {
                      // Asegurar que todos los campos estén presentes
                      const dataToSave = {
                        nombre: recceDocumentName.trim(),
                        documentTitle: recceConfig.documentTitle || 'LOCATION RECCE',
                        recceSchedule: recceConfig.recceSchedule || '',
                        meetingPoint: recceConfig.meetingPoint || '',
                        meetingPointLink: recceConfig.meetingPointLink || '',
                        departureTime: recceConfig.departureTime || '',
                        locationManagerName: recceConfig.locationManagerName || '',
                        locationManagerPhone: recceConfig.locationManagerPhone || '',
                        locationManagerEmail: recceConfig.locationManagerEmail || '',
                        sunriseTime: recceConfig.sunriseTime || '',
                        sunsetTime: recceConfig.sunsetTime || '',
                        weatherForecast: recceConfig.weatherForecast || '',
                        attendants: recceConfig.attendants || [],
                        legs: recceConfig.legs || [],
                        freeEntries: recceConfig.freeEntries || [],
                        flights: recceConfig.flights || [],
                        notes: recceConfig.notes || []
                      }
                      
                      console.log('Guardando documento con datos:', dataToSave)
                      
                      if (editingRecceDocument) {
                        await axios.put(`${API_URL}/recce-documents/${editingRecceDocument.id}`, dataToSave, { withCredentials: true })
                        alert('Documento actualizado correctamente')
                      } else {
                        await axios.post(`${API_URL}/recce-documents`, {
                          proyectoId: id,
                          ...dataToSave
                        }, { withCredentials: true })
                        alert('Documento guardado correctamente')
                      }
                      await loadSavedRecceDocuments()
                      setShowRecceModal(false)
                      setEditingRecceDocument(null)
                      setRecceDocumentName('')
                    } catch (error) {
                      console.error('Error guardando documento:', error)
                      alert('Error al guardar el documento')
                    }
                  }}
                  disabled={generating}
                  className="px-5 py-2 rounded-lg bg-accent-green text-white text-sm hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRecceDocument ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!recceDocumentName.trim()) {
                      alert('Por favor, introduce un nombre para el documento')
                      return
                    }
                    try {
                      // Asegurar que todos los campos estén presentes
                      const dataToSave = {
                        nombre: recceDocumentName.trim(),
                        documentTitle: recceConfig.documentTitle || 'LOCATION RECCE',
                        recceSchedule: recceConfig.recceSchedule || '',
                        meetingPoint: recceConfig.meetingPoint || '',
                        meetingPointLink: recceConfig.meetingPointLink || '',
                        departureTime: recceConfig.departureTime || '',
                        locationManagerName: recceConfig.locationManagerName || '',
                        locationManagerPhone: recceConfig.locationManagerPhone || '',
                        locationManagerEmail: recceConfig.locationManagerEmail || '',
                        sunriseTime: recceConfig.sunriseTime || '',
                        sunsetTime: recceConfig.sunsetTime || '',
                        weatherForecast: recceConfig.weatherForecast || '',
                        attendants: recceConfig.attendants || [],
                        legs: recceConfig.legs || [],
                        freeEntries: recceConfig.freeEntries || [],
                        flights: recceConfig.flights || [],
                        notes: recceConfig.notes || []
                      }
                      
                      console.log('Guardando y generando PDF con datos:', dataToSave)
                      
                      if (editingRecceDocument) {
                        await axios.put(`${API_URL}/recce-documents/${editingRecceDocument.id}`, dataToSave, { withCredentials: true })
                      } else {
                        await axios.post(`${API_URL}/recce-documents`, {
                          proyectoId: id,
                          ...dataToSave
                        }, { withCredentials: true })
                      }
                      await loadSavedRecceDocuments()
                      await generateLocationReccePDF()
                    } catch (error) {
                      console.error('Error guardando documento:', error)
                      alert('Error al guardar el documento')
                    }
                  }}
                  disabled={generating}
                  className="px-5 py-2 rounded-lg bg-dark-blue text-white text-sm hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generando...' : editingRecceDocument ? 'Actualizar y generar PDF' : 'Guardar y generar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de localizaciones */}
      {showLocationSelectorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Seleccionar Localización</h2>
              <button
                onClick={() => {
                  setShowLocationSelectorModal(false)
                  setLocationSearchText('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Campo de búsqueda */}
            <div className="mb-4">
              <input
                type="text"
                value={locationSearchText}
                onChange={(e) => setLocationSearchText(e.target.value)}
                placeholder="Buscar localización..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                autoFocus
              />
            </div>

            {/* Lista de localizaciones filtradas */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const availableLocations = (proyecto?.Locations || []).filter(
                  loc => !(recceConfig.legs || []).some(leg => leg.locationId?.toString() === loc.id?.toString())
                )
                
                const filteredLocations = availableLocations.filter(loc => {
                  const searchLower = locationSearchText.toLowerCase()
                  return (
                    loc.nombre?.toLowerCase().includes(searchLower) ||
                    loc.direccion?.toLowerCase().includes(searchLower) ||
                    loc.descripcion?.toLowerCase().includes(searchLower)
                  )
                })

                if (filteredLocations.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      {locationSearchText ? 'No se encontraron localizaciones con ese criterio' : 'No hay localizaciones disponibles'}
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          const maxOrder = Math.max(
                            ...(recceConfig.freeEntries || []).map(e => e.order !== undefined ? e.order : -1),
                            ...(recceConfig.legs || []).map(l => l.order !== undefined ? l.order : -1),
                            ...(recceConfig.flights || []).map(f => f.order !== undefined ? f.order : -1),
                            ...(recceConfig.notes || []).map(n => n.order !== undefined ? n.order : -1),
                            -1
                          )
                          const newLeg = {
                            locationId: loc.id?.toString(),
                            include: true,
                            travelTimeMinutes: '',
                            timeOnLocationMinutes: '',
                            order: maxOrder + 1
                          }
                          setRecceConfig({
                            ...recceConfig,
                            legs: [...(recceConfig.legs || []), newLeg]
                          })
                          setShowLocationSelectorModal(false)
                          setLocationSearchText('')
                        }}
                        className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-dark-blue transition-colors"
                      >
                        <div className="font-medium text-gray-800">{loc.nombre}</div>
                        {loc.direccion && (
                          <div className="text-sm text-gray-500 mt-1">{loc.direccion}</div>
                        )}
                        {loc.descripcion && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">{loc.descripcion}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

