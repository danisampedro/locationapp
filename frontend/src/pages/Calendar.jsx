import { useEffect, useState } from 'react'
import axios, { API_URL } from '../config/axios.js'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

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

  const renderEventBar = (evento, year, month) => {
    const inicio = new Date(evento.fechaInicio + 'T00:00:00')
    const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    
    // Asegurar que el evento está dentro del mes
    if (fin < monthStart || inicio > monthEnd) {
      return null
    }
    
    // Calcular día de inicio y fin dentro del mes
    const startDay = inicio >= monthStart ? inicio.getDate() : 1
    const endDay = fin <= monthEnd ? fin.getDate() : getDaysInMonth(year, month)
    
    // Calcular posición (0-31) y ancho
    const startOffset = inicio < monthStart ? 0 : startDay - 1
    const width = endDay - startDay + 1
    const daysInMonth = getDaysInMonth(year, month)

    const color = evento.color || PRESET_COLORS[0]
    const rgba = hexToRgba(color, 0.7)

    return (
      <div
        key={evento.id}
        className="absolute h-6 rounded px-2 flex items-center text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          left: `${(startOffset / 31) * 100}%`,
          width: `${(width / 31) * 100}%`,
          backgroundColor: rgba,
          borderLeft: `3px solid ${color}`
        }}
        onClick={(e) => {
          e.stopPropagation()
          openEditModal(evento)
        }}
        title={evento.titulo}
      >
        <span className="truncate">{evento.titulo}</span>
      </div>
    )
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
        <div className="min-w-[1200px]">
          {/* Header con días del mes */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-32 p-3 font-semibold text-gray-700 border-r border-gray-200">
                Mes
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div
                    key={day}
                    className="flex-1 p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filas de meses */}
          {MONTHS.map((monthName, monthIndex) => {
            const daysInMonth = getDaysInMonth(currentYear, monthIndex)
            const monthEventos = eventos.filter(evento => {
              const inicio = new Date(evento.fechaInicio + 'T00:00:00')
              const fin = new Date((evento.fechaFin || evento.fechaInicio) + 'T00:00:00')
              const monthStart = new Date(currentYear, monthIndex, 1)
              const monthEnd = new Date(currentYear, monthIndex + 1, 0)
              return (inicio <= monthEnd && fin >= monthStart)
            })

            return (
              <div
                key={monthIndex}
                className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex min-h-[60px]">
                  {/* Nombre del mes */}
                  <div className="w-32 p-4 font-semibold text-gray-800 border-r border-gray-200 flex items-center">
                    {monthName}
                  </div>
                  
                  {/* Grid de días */}
                  <div className="flex-1 relative">
                    <div className="flex h-full">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <div
                          key={day}
                          className={`flex-1 p-1 border-r border-gray-100 last:border-r-0 ${
                            day <= daysInMonth ? 'bg-white' : 'bg-gray-50'
                          } ${day === daysInMonth ? 'border-r-2 border-gray-300' : ''}`}
                        />
                      ))}
                    </div>
                    
                    {/* Eventos del mes */}
                    <div className="absolute inset-0 flex items-center px-1">
                      {monthEventos.map(evento => renderEventBar(evento, currentYear, monthIndex)).filter(Boolean)}
                    </div>
                  </div>
                </div>
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

