import { useEffect, useState } from 'react'
import axios, { API_URL } from '../config/axios.js'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAYS_OF_WEEK_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const PRESET_COLORS = [
  '#3b82f6', // Azul
  '#ef4444', // Rojo
  '#10b981', // Verde
  '#f59e0b', // Naranja
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#06b6d4', // Cian
  '#f97316', // Naranja oscuro
  '#84cc16', // Lima
  '#6366f1'  // Índigo
]

export default function Calendar() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvento, setEditingEvento] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    titulo: '',
    fechaInicio: '',
    fechaFin: '',
    color: PRESET_COLORS[0]
  })

  const loadEventos = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`, { withCredentials: true })
      setEventos(res.data)
    } catch (error) {
      console.error('Error cargando eventos:', error)
      alert('Error cargando eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventos()
  }, [])

  const getDaysInMonth = (year, month) => {
    if (month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
      return 29 // Año bisiesto
    }
    return DAYS_IN_MONTH[month]
  }

  // Obtener el día de la semana (0 = Domingo, 1 = Lunes, etc.)
  const getDayOfWeek = (year, month, day) => {
    const date = new Date(year, month, day)
    return date.getDay()
  }

  // Calcular las semanas de un mes
  const getWeeksOfMonth = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfWeek = getDayOfWeek(year, month, 1)
    const weeks = []
    let currentWeek = []

    // Rellenar días vacíos al inicio del mes
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null)
    }

    // Añadir días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Rellenar días vacíos al final del mes
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null)
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }

  // Algoritmo para apilar eventos verticalmente
  const stackEvents = (events, year, month) => {
    if (events.length === 0) return []

    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    // Normalizar eventos y calcular días dentro del mes
    const normalizedEvents = events.map(evento => {
      const inicio = new Date(evento.fechaInicio + 'T00:00:00')
      const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
      const startDay = inicio >= monthStart ? inicio.getDate() : 1
      const endDay = fin <= monthEnd ? fin.getDate() : getDaysInMonth(year, month)
      return {
        ...evento,
        startDay: inicio < monthStart ? 1 : startDay,
        endDay: fin > monthEnd ? getDaysInMonth(year, month) : endDay
      }
    })

    // Ordenar eventos por día de inicio
    normalizedEvents.sort((a, b) => a.startDay - b.startDay)

    // Algoritmo de apilamiento: asignar pistas (tracks) a eventos
    const tracks = []
    const eventTracks = new Map()

    normalizedEvents.forEach(evento => {
      let assignedTrack = -1

      // Buscar la primera pista disponible donde el evento no se solape
      for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
        const trackEvents = tracks[trackIndex]
        const overlaps = trackEvents.some(existingEvento => {
          return !(evento.endDay < existingEvento.startDay || evento.startDay > existingEvento.endDay)
        })
        if (!overlaps) {
          assignedTrack = trackIndex
          break
        }
      }

      // Si no hay pista disponible, crear una nueva
      if (assignedTrack === -1) {
        assignedTrack = tracks.length
        tracks.push([])
      }

      tracks[assignedTrack].push(evento)
      eventTracks.set(evento.id, assignedTrack)
    })

    return { tracks, eventTracks }
  }

  const openCreateModal = () => {
    setEditingEvento(null)
    setFormData({
      titulo: '',
      fechaInicio: '',
      fechaFin: '',
      color: PRESET_COLORS[0]
    })
    setShowModal(true)
  }

  const openEditModal = (evento) => {
    setEditingEvento(evento)
    setFormData({
      titulo: evento.titulo || '',
      fechaInicio: evento.fechaInicio || '',
      fechaFin: evento.fechaFin || '',
      color: evento.color || PRESET_COLORS[0]
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.titulo.trim() || !formData.fechaInicio) {
        alert('Título y fecha de inicio son obligatorios')
        setIsSubmitting(false)
        return
      }

      const submitData = {
        ...formData,
        fechaFin: formData.fechaFin || null
      }

      if (editingEvento) {
        await axios.put(`${API_URL}/events/${editingEvento.id}`, submitData, {
          withCredentials: true
        })
      } else {
        await axios.post(`${API_URL}/events`, submitData, {
          withCredentials: true
        })
      }

      await loadEventos()
      setShowModal(false)
    } catch (error) {
      console.error('Error guardando evento:', error)
      alert('Error guardando el evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (evento) => {
    if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return
    try {
      await axios.delete(`${API_URL}/events/${evento.id}`, {
        withCredentials: true
      })
      await loadEventos()
    } catch (error) {
      console.error('Error eliminando evento:', error)
      alert('Error eliminando el evento')
    }
  }

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-dark-blue text-xl">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-full pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calendario</h1>
          <p className="text-gray-500 text-sm mt-1">
            Vista anual de eventos y actividades
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Año anterior
            </button>
            <span className="text-lg font-semibold text-gray-800 min-w-[80px] text-center">
              {currentYear}
            </span>
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Año siguiente →
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-dark-blue text-white rounded-lg hover:bg-dark-blue-light transition-colors font-medium"
          >
            + Nuevo Evento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <div className="min-w-[1400px]">
          {/* Header con días de la semana */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-32 p-3 font-semibold text-gray-700 border-r border-gray-200">
                Mes
              </div>
              <div className="flex-1 flex">
                {DAYS_OF_WEEK.map((dayName, index) => (
                  <div
                    key={index}
                    className={`flex-1 p-3 text-center text-sm font-semibold border-r border-gray-200 last:border-r-0 ${
                      index === 0 || index === 6 
                        ? 'text-gray-600 bg-blue-50/50' 
                        : 'text-gray-700'
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filas de meses */}
          {MONTHS.map((monthName, monthIndex) => {
            const weeks = getWeeksOfMonth(currentYear, monthIndex)
            const monthEventos = eventos.filter(evento => {
              const inicio = new Date(evento.fechaInicio + 'T00:00:00')
              const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
              const monthStart = new Date(currentYear, monthIndex, 1)
              const monthEnd = new Date(currentYear, monthIndex + 1, 0)
              return (inicio <= monthEnd && fin >= monthStart)
            })

            const { tracks, eventTracks } = stackEvents(monthEventos, currentYear, monthIndex)
            const maxTracks = tracks.length

            return (
              <div
                key={monthIndex}
                className="border-b border-gray-200"
              >

                {/* Semanas del mes */}
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex min-h-[80px]">
                    {/* Columna del mes solo en la primera semana */}
                    {weekIndex === 0 && (
                      <div className="w-32 p-4 font-semibold text-gray-800 border-r border-gray-200 flex items-center bg-gray-50/30">
                        {monthName}
                      </div>
                    )}
                    {weekIndex > 0 && (
                      <div className="w-32 border-r border-gray-200 bg-gray-50/30"></div>
                    )}

                    {/* Días de la semana */}
                    <div className="flex-1 flex relative">
                      {week.map((day, dayIndex) => {
                        const dayOfWeek = (dayIndex) % 7
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        const isCurrentMonth = day !== null

                        // Obtener eventos que están en este día
                        const dayEventos = monthEventos.filter(evento => {
                          const inicio = new Date(evento.fechaInicio + 'T00:00:00')
                          const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
                          const monthStart = new Date(currentYear, monthIndex, 1)
                          const monthEnd = new Date(currentYear, monthIndex + 1, 0)

                          if (!day) return false
                          
                          // Normalizar fechas para el mes actual
                          const eventStartInMonth = inicio < monthStart ? monthStart : inicio
                          const eventEndInMonth = fin > monthEnd ? monthEnd : fin
                          
                          const eventStartDay = eventStartInMonth.getDate()
                          const eventEndDay = eventEndInMonth.getDate()

                          return day >= eventStartDay && day <= eventEndDay
                        })

                        return (
                          <div
                            key={dayIndex}
                            className={`flex-1 border-r border-gray-100 last:border-r-0 p-1 ${
                              isCurrentMonth 
                                ? isWeekend 
                                  ? 'bg-blue-50/30' 
                                  : 'bg-white'
                                : 'bg-gray-50/50'
                            }`}
                            style={{ minWidth: '140px' }}
                          >
                            {/* Número del día */}
                            <div className={`text-xs font-medium mb-1 ${
                              isCurrentMonth 
                                ? isWeekend 
                                  ? 'text-blue-700' 
                                  : 'text-gray-700'
                                : 'text-gray-400'
                            }`}>
                              {day || ''}
                            </div>

                            {/* Eventos del día */}
                            <div className="relative" style={{ minHeight: `${Math.max(1, maxTracks) * 32}px` }}>
                              {dayEventos.map(evento => {
                                const trackIndex = eventTracks.get(evento.id) || 0
                                const inicio = new Date(evento.fechaInicio + 'T00:00:00')
                                const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
                                const monthStart = new Date(currentYear, monthIndex, 1)
                                const monthEnd = new Date(currentYear, monthIndex + 1, 0)
                                
                                const eventStartInMonth = inicio < monthStart ? monthStart : inicio
                                const eventEndInMonth = fin > monthEnd ? monthEnd : fin
                                
                                const eventStartDay = eventStartInMonth.getDate()
                                const eventEndDay = eventEndInMonth.getDate()
                                const isStart = day === eventStartDay
                                const isEnd = day === eventEndDay
                                const spansMultipleDays = eventEndDay > eventStartDay

                                const color = evento.color || PRESET_COLORS[0]
                                const rgba = hexToRgba(color, 0.75)

                                return (
                                  <div
                                    key={evento.id}
                                    className="absolute rounded px-2 py-1 flex items-center text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity z-10"
                                    style={{
                                      top: `${trackIndex * 32}px`,
                                      left: isStart ? '2px' : '0',
                                      right: isEnd ? '2px' : '0',
                                      width: spansMultipleDays ? '100%' : 'calc(100% - 4px)',
                                      backgroundColor: rgba,
                                      borderLeft: isStart ? `3px solid ${color}` : 'none',
                                      height: '28px'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditModal(evento)
                                    }}
                                    title={evento.titulo}
                                  >
                                    {isStart && (
                                      <span className="truncate font-semibold">{evento.titulo}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal para crear/editar evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                    min={formData.fechaInicio}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Déjalo vacío para un evento de un solo día
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-dark-blue text-white rounded-lg hover:bg-dark-blue-light transition-colors font-medium disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : editingEvento ? 'Actualizar' : 'Crear'}
                  </button>
                </div>

                {editingEvento && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingEvento)}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Eliminar Evento
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
