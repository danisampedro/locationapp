import { useEffect, useMemo, useState } from 'react'
import axios, { API_URL } from '../config/axios.js'

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
]

const VACATION_WORDS = ['vacaciones', 'fiesta', 'libre', 'descanso']

// Convierte "9", "9h", "9:00" -> minutos desde medianoche
function parseHourToMinutes(raw) {
  if (!raw) return null
  let s = String(raw).trim().toLowerCase()
  s = s.replace('h', ':')
  if (!s.includes(':')) {
    s = `${s}:00`
  }
  const [hh, mm] = s.split(':')
  const h = parseInt(hh, 10)
  const m = parseInt(mm || '0', 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function minutesToHHMM(mins) {
  if (mins == null) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Devuelve { days: [...], totalHours, warnings }
function parseFreeTextWeek(text) {
  const initialDays = DAYS.map(d => ({
    dayKey: d.key,
    label: d.label,
    inicio: '',
    fin: '',
    horas: 0,
    catering: false,
    lugar: '',
    hotel: false,
    notas: '',
    tipoDia: 'libre' // libre | normal | especial
  }))

  if (!text || !text.trim()) {
    return { days: initialDays, totalHours: 0, warnings: [] }
  }

  const normalized = text
    .toLowerCase()
    .replace(/miércoles/g, 'miercoles')
    .replace(/sábado/g, 'sabado')

  // Trocear por días
  const dayRegex = /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/g
  const parts = []
  let match
  let lastIndex = 0

  while ((match = dayRegex.exec(normalized)) !== null) {
    if (parts.length > 0) {
      const last = parts[parts.length - 1]
      last.text = normalized.slice(last.index, match.index).trim().replace(/^[,y]+/, '').trim()
    }
    parts.push({ dayKey: match[1], index: match.index, text: '' })
    lastIndex = match.index
  }
  if (parts.length > 0) {
    const last = parts[parts.length - 1]
    last.text = normalized.slice(last.index + last.dayKey.length).trim()
  }

  const dayMap = new Map(initialDays.map(d => [d.dayKey, { ...d }]))

  parts.forEach(part => {
    const day = dayMap.get(part.dayKey)
    if (!day) return

    const fragment = part.text

    // ¿Día de vacaciones/libre?
    if (VACATION_WORDS.some(w => fragment.includes(w))) {
      day.tipoDia = 'libre'
      day.horas = 0
      return
    }

    // Buscar tramos horarios: 9-14, 9:00-14:00, 8.30-16.30...
    const rangeRegex = /(\d{1,2}[:h.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:h.]?\d{0,2})/g
    let r
    const segments = []
    while ((r = rangeRegex.exec(fragment)) !== null) {
      const start = parseHourToMinutes(r[1].replace('.', ':'))
      const end = parseHourToMinutes(r[2].replace('.', ':'))
      if (start != null && end != null && end > start) {
        segments.push({ start, end })
      }
    }

    if (segments.length === 0) {
      // No hay horas reconocibles -> lo dejamos como libre
      day.tipoDia = 'libre'
      day.horas = 0
      return
    }

    let totalMinutes = 0
    let minStart = segments[0].start
    let maxEnd = segments[0].end
    segments.forEach(seg => {
      totalMinutes += seg.end - seg.start
      if (seg.start < minStart) minStart = seg.start
      if (seg.end > maxEnd) maxEnd = seg.end
    })

    day.tipoDia = 'normal'
    day.inicio = minutesToHHMM(minStart)
    day.fin = minutesToHHMM(maxEnd)
    day.horas = +(totalMinutes / 60).toFixed(2)
  })

  // Normas: mínimo 2 días libres, sexto día especial
  const warnings = []
  const daysArray = Array.from(dayMap.values())
  const workedDays = daysArray.filter(d => d.horas > 0)

  // Marcar libres donde no haya horas
  daysArray.forEach(d => {
    if (!d.horas || d.horas === 0) {
      d.tipoDia = 'libre'
    }
  })

  // Sexto día especial
  if (workedDays.length >= 6) {
    const sixth = workedDays[5]
    const target = daysArray.find(d => d.dayKey === sixth.dayKey)
    if (target) {
      target.tipoDia = 'especial'
    }
  }

  const freeDaysCount = daysArray.filter(d => d.tipoDia === 'libre').length
  if (freeDaysCount < 2) {
    warnings.push('Hay menos de 2 días libres en la semana.')
  }

  // Regla 12h entre días consecutivos trabajados
  for (let i = 0; i < daysArray.length - 1; i++) {
    const d1 = daysArray[i]
    const d2 = daysArray[i + 1]
    if (d1.horas > 0 && d2.horas > 0 && d1.fin && d2.inicio) {
      const end1 = parseHourToMinutes(d1.fin)
      const start2 = parseHourToMinutes(d2.inicio)
      if (end1 != null && start2 != null) {
        const rest = (24 * 60 - end1) + start2
        if (rest < 12 * 60) {
          warnings.push(
            `El descanso entre ${d1.label} y ${d2.label} es inferior a 12 horas.`
          )
        }
      }
    }
  }

  const totalHours = daysArray.reduce((acc, d) => acc + (d.horas || 0), 0)

  return { days: daysArray, totalHours: +totalHours.toFixed(2), warnings }
}

export default function Timesheets() {
  const [proyectos, setProyectos] = useState([])
  const [crew, setCrew] = useState([])
  const [selectedProyectoId, setSelectedProyectoId] = useState('')
  const [selectedCrewId, setSelectedCrewId] = useState('')
  const [freeText, setFreeText] = useState('')
  const [days, setDays] = useState(() =>
    DAYS.map(d => ({
      dayKey: d.key,
      label: d.label,
      inicio: '',
      fin: '',
      horas: 0,
      catering: false,
      lugar: '',
      hotel: false,
      notas: '',
      tipoDia: 'libre'
    }))
  )
  const [warnings, setWarnings] = useState([])

  const totalHours = useMemo(
    () => days.reduce((acc, d) => acc + (d.horas || 0), 0),
    [days]
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projRes, crewRes] = await Promise.all([
          axios.get(`${API_URL}/proyectos`, { withCredentials: true }),
          axios.get(`${API_URL}/crew`, { withCredentials: true })
        ])
        setProyectos(projRes.data || [])
        setCrew(crewRes.data || [])
      } catch (error) {
        console.error('Error cargando proyectos/crew para timesheets:', error)
      }
    }
    loadData()
  }, [])

  const handleProcess = () => {
    const result = parseFreeTextWeek(freeText)
    setDays(result.days)
    setWarnings(result.warnings)
  }

  const handleSameAsLastWeek = () => {
    // De momento simplemente reutilizamos lo que haya en pantalla
    // (más adelante se conectará con el backend para traer la semana anterior real)
    alert('Función "Igual que la semana pasada" pendiente de conectar con el backend.')
  }

  const updateDayField = (dayKey, field, value) => {
    setDays(prev =>
      prev.map(d =>
        d.dayKey === dayKey
          ? {
              ...d,
              [field]: value,
              // Recalcular horas si cambian inicio/fin
              ...(field === 'inicio' || field === 'fin'
                ? (() => {
                    const startM = parseHourToMinutes(
                      field === 'inicio' ? value : d.inicio
                    )
                    const endM = parseHourToMinutes(
                      field === 'fin' ? value : d.fin
                    )
                    if (startM != null && endM != null && endM > startM) {
                      const h = (endM - startM) / 60
                      return { horas: +h.toFixed(2), tipoDia: 'normal' }
                    }
                    return { horas: 0 }
                  })()
                : {})
            }
          : d
      )
    )
  }

  return (
    <div className="min-h-full">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-800">Timesheets</h1>
        <p className="text-gray-500 text-sm">
          Introduce la jornada semanal en texto libre y revisa el resumen día a día.
        </p>
      </div>

      {/* Selección de proyecto y trabajador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proyecto
          </label>
          <select
            value={selectedProyectoId}
            onChange={e => setSelectedProyectoId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Selecciona un proyecto</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trabajador
          </label>
          <select
            value={selectedCrewId}
            onChange={e => setSelectedCrewId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Selecciona un miembro del crew</option>
            {crew.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.rol ? `(${c.rol})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entrada de texto libre */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Jornada semanal (texto libre)
          </label>
          <span className="text-xs text-gray-400">
            Ejemplo: Lunes 9:00-14:00 y 15:00-18:00, Martes 8:30-16:30, Miércoles vacaciones...
          </span>
        </div>
        <textarea
          rows={4}
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder='Lunes 9:00-14:00 y 15:00-18:00, Martes 8:30-16:30, Miércoles vacaciones, Jueves 10:00-14:00, Viernes 9:00-13:00'
        />
        <div className="flex flex-wrap gap-3 mt-3">
          <button
            type="button"
            onClick={handleProcess}
            className="px-4 py-2 bg-dark-blue text-white rounded-lg text-sm hover:bg-dark-blue-light"
          >
            Procesar
          </button>
          <button
            type="button"
            onClick={handleSameAsLastWeek}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Igual que la semana pasada
          </button>
        </div>
        {warnings.length > 0 && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg p-3 space-y-1">
            {warnings.map((w, idx) => (
              <p key={idx}>• {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* Tabla semanal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Resumen semanal</h2>
          <div className="text-sm">
            <span className="font-semibold text-gray-700 mr-1">Total horas:</span>
            <span className="text-dark-blue font-bold">{totalHours.toFixed(2)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1 text-left">Día</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Inicio</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Fin</th>
                <th className="border border-gray-200 px-2 py-1 text-center">Horas</th>
                <th className="border border-gray-200 px-2 py-1 text-center">
                  Catering
                </th>
                <th className="border border-gray-200 px-2 py-1 text-left">Lugar</th>
                <th className="border border-gray-200 px-2 py-1 text-center">Hotel</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Notas</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <tr
                  key={d.dayKey}
                  className={
                    d.tipoDia === 'libre'
                      ? 'bg-gray-50'
                      : d.tipoDia === 'especial'
                      ? 'bg-blue-50'
                      : ''
                  }
                >
                  <td className="border border-gray-200 px-2 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{d.label}</span>
                      {d.tipoDia === 'libre' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          Día libre
                        </span>
                      )}
                      {d.tipoDia === 'especial' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Día especial
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="time"
                      value={d.inicio}
                      onChange={e =>
                        updateDayField(d.dayKey, 'inicio', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="time"
                      value={d.fin}
                      onChange={e => updateDayField(d.dayKey, 'fin', e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    {d.horas ? d.horas.toFixed(2) : '0.00'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={d.catering}
                      onChange={e =>
                        updateDayField(d.dayKey, 'catering', e.target.checked)
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={d.lugar}
                      onChange={e =>
                        updateDayField(d.dayKey, 'lugar', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      placeholder="Lugar de trabajo"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={d.hotel}
                      onChange={e =>
                        updateDayField(d.dayKey, 'hotel', e.target.checked)
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={d.notas}
                      onChange={e =>
                        updateDayField(d.dayKey, 'notas', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      placeholder="Notas del trabajador"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-accent-green text-white rounded-lg text-sm hover:bg-accent-green-dark disabled:opacity-50"
            disabled={!selectedProyectoId || !selectedCrewId}
          >
            Guardar (pendiente de backend)
          </button>
        </div>
      </div>
    </div>
  )
}

