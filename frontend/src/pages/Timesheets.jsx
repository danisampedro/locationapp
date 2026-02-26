import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

// Modelos de jornada disponibles
const MODELOS_JORNADA = [
  {
    id: '',
    label: 'Sin modelo',
    horasTrabajo: null
  },
  {
    id: 'normal',
    label: 'Jornada normal (10h trabajo + 1h comida)',
    // Extras a partir de 11h totales
    horasTrabajo: 11
  },
  {
    id: 'continua',
    label: 'Jornada continua (9h trabajo)',
    // Extras a partir de 9h
    horasTrabajo: 9
  },
  {
    id: 'semi',
    label: 'Jornada semi continua (9h trabajo + 0,5h comida)',
    // Extras a partir de 9,5h totales
    horasTrabajo: 9.5
  }
]

const VACATION_WORDS = ['vacaciones', 'fiesta', 'libre', 'descanso']

function computeHorasExtra(horas, modeloId) {
  const modelo = MODELOS_JORNADA.find(m => m.id === modeloId)
  if (!modelo || modelo.horasTrabajo == null || !horas) return 0
  const extra = horas - modelo.horasTrabajo
  return extra > 0 ? +extra.toFixed(2) : 0
}

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
    horasExtra: 0,
    // Por defecto aplicamos Jornada normal
    modeloId: 'normal',
    shortRest: false,
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
    d2.shortRest = false
    if (d1.horas > 0 && d2.horas > 0 && d1.fin && d2.inicio) {
      const end1 = parseHourToMinutes(d1.fin)
      const start2 = parseHourToMinutes(d2.inicio)
      if (end1 != null && start2 != null) {
        const rest = (24 * 60 - end1) + start2
        if (rest < 12 * 60) {
          d2.shortRest = true
          warnings.push(
            `El descanso entre ${d1.label} y ${d2.label} es inferior a 12 horas.`
          )
        }
      }
    }
  }

  const totalHours = daysArray.reduce((acc, d) => acc + (d.horas || 0), 0)

  // Inicialmente las horas extra son 0 hasta que el usuario seleccione un modelo
  daysArray.forEach(d => {
    d.horasExtra = computeHorasExtra(d.horas, d.modeloId)
  })

  return { days: daysArray, totalHours: +totalHours.toFixed(2), warnings }
}

// Dado un día cualquiera (YYYY-MM-DD), devuelve el lunes de esa semana
function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

// Dado el lunes (YYYY-MM-DD), devuelve año y número de semana ISO
function getYearWeekFromMonday(mondayStr) {
  const monday = new Date(mondayStr + 'T12:00:00')
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const dow = (jan4.getDay() + 6) % 7
  const mondayWeek1 = new Date(year, 0, 4 - dow)
  const weekNumber = 1 + Math.floor((monday - mondayWeek1) / (7 * 86400000))
  return { year, weekNumber }
}

// Dado año y semana ISO, devuelve el lunes (YYYY-MM-DD)
function getWeekStartDateFromYearWeek(year, weekNumber) {
  const jan4 = new Date(year, 0, 4)
  const dow = (jan4.getDay() + 6) % 7
  const mondayWeek1 = new Date(year, 0, 4 - dow)
  const weekStart = new Date(mondayWeek1)
  weekStart.setDate(mondayWeek1.getDate() + (weekNumber - 1) * 7)
  return weekStart.toISOString().slice(0, 10)
}

const initialDays = () =>
  DAYS.map(d => ({
    dayKey: d.key,
    label: d.label,
    inicio: '',
    fin: '',
    horas: 0,
    horasExtra: 0,
    modeloId: 'normal',
    shortRest: false,
    catering: false,
    notas: '',
    tipoDia: 'libre'
  }))

export default function Timesheets() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [proyectos, setProyectos] = useState([])
  const [crew, setCrew] = useState([])
  const [selectedProyectoId, setSelectedProyectoId] = useState('')
  const [selectedCrewId, setSelectedCrewId] = useState('')
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    getMondayOfWeek(new Date().toISOString().slice(0, 10))
  )
  const [freeText, setFreeText] = useState('')
  const [days, setDays] = useState(() => initialDays())
  const [warnings, setWarnings] = useState([])
  const [loadingEdit, setLoadingEdit] = useState(!!editId)

  const totalHours = useMemo(
    () => days.reduce((acc, d) => acc + (d.horas || 0), 0),
    [days]
  )
  const totalExtraHours = useMemo(
    () => days.reduce((acc, d) => acc + (d.horasExtra || 0), 0),
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

  // Cargar timesheet existente para editar (?edit=id)
  useEffect(() => {
    if (!editId) {
      setLoadingEdit(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/timesheets/${editId}`, {
          withCredentials: true
        })
        const ts = res.data
        if (cancelled || !ts) return
        setSelectedProyectoId(String(ts.proyectoId))
        setSelectedCrewId(String(ts.crewId))
        setSelectedWeekStart(
          ts.weekStartDate || getWeekStartDateFromYearWeek(ts.year, ts.weekNumber)
        )
        const rawDays = Array.isArray(ts.days)
          ? ts.days
          : typeof ts.days === 'string'
            ? (() => {
                try {
                  const p = JSON.parse(ts.days)
                  return Array.isArray(p) ? p : []
                } catch {
                  return []
                }
              })()
            : []
        setDays(
          DAYS.map((def, i) => ({
            ...def,
            ...(rawDays[i] || {}),
            dayKey: def.key,
            label: def.label
          }))
        )
      } catch (error) {
        if (!cancelled) {
          console.error('Error cargando timesheet para editar:', error)
          alert(error.response?.data?.error || 'Error al cargar el timesheet')
        }
      } finally {
        if (!cancelled) setLoadingEdit(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [editId])

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

  // Rango de la semana seleccionada (ej. "Lunes 3 feb - Domingo 9 feb 2026")
  const weekRangeLabel = (() => {
    const start = new Date(selectedWeekStart + 'T12:00:00')
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) +
      ' - ' + end.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  })()

  // Fecha del día (0=lunes, 6=domingo) para la semana seleccionada
  const getDayDateFormatted = (dayIndex) => {
    const d = new Date(selectedWeekStart + 'T12:00:00')
    d.setDate(d.getDate() + dayIndex)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const handleSave = async () => {
    try {
      if (!selectedProyectoId || !selectedCrewId) return

      const { year, weekNumber } = getYearWeekFromMonday(selectedWeekStart)

      const payload = {
        proyectoId: selectedProyectoId,
        crewId: selectedCrewId,
        year,
        weekNumber,
        weekStartDate: selectedWeekStart,
        projectTitle: '',
        projectCompany: '',
        department: '',
        workerName: '',
        workerRole: '',
        days,
        totalHoras: totalHours,
        totalHorasExtra: totalExtraHours
      }

      await axios.post(`${API_URL}/timesheets`, payload, {
        withCredentials: true
      })

      alert('Timesheet semanal guardado correctamente.')
    } catch (error) {
      console.error('Error guardando timesheet:', error)
      alert(
        error.response?.data?.error ||
          'Error al guardar el timesheet. Revisa la consola para más detalles.'
      )
    }
  }

  const updateDayField = (dayKey, field, value) => {
    setDays(prev => {
      const updated = prev.map(d =>
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
                      const horas = +h.toFixed(2)
                      return {
                        horas,
                        tipoDia: 'normal',
                        horasExtra: computeHorasExtra(horas, d.modeloId)
                      }
                    }
                    return { horas: 0, horasExtra: 0 }
                  })()
                : {}),
              ...(field === 'modeloId'
                ? {
                    horasExtra: computeHorasExtra(d.horas, value)
                  }
                : {})
            }
          : d
      )

      // Recalcular marcas de descanso corto (12h) después de cualquier cambio
      for (let i = 0; i < updated.length; i++) {
        updated[i].shortRest = false
      }
      for (let i = 0; i < updated.length - 1; i++) {
        const d1 = updated[i]
        const d2 = updated[i + 1]
        if (d1.horas > 0 && d2.horas > 0 && d1.fin && d2.inicio) {
          const end1 = parseHourToMinutes(d1.fin)
          const start2 = parseHourToMinutes(d2.inicio)
          if (end1 != null && start2 != null) {
            const rest = (24 * 60 - end1) + start2
            if (rest < 12 * 60) {
              d2.shortRest = true
            }
          }
        }
      }

      return [...updated]
    })
  }

  return (
    <div className="min-h-full">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-800">Timesheets</h1>
        <p className="text-gray-500 text-sm">
          Introduce la jornada semanal en texto libre y revisa el resumen día a día.
        </p>
        {editId && (
          <p className="text-sm text-dark-blue font-medium">
            Editando timesheet guardado. Los cambios se guardarán sobre el mismo registro.
          </p>
        )}
      </div>

      {loadingEdit && (
        <p className="text-sm text-gray-500 mb-4">Cargando timesheet…</p>
      )}

      {/* Selección de semana, proyecto y trabajador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana a cumplimentar
            </label>
            <input
              type="date"
              value={selectedWeekStart}
              onChange={e => setSelectedWeekStart(getMondayOfWeek(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {weekRangeLabel}
            </p>
          </div>
          <div>
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
          <div>
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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Resumen semanal</h2>
            <p className="text-sm text-gray-500">{weekRangeLabel}</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-700 mr-1">Total horas:</span>
            <span className="text-dark-blue font-bold">{totalHours.toFixed(2)}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="font-semibold text-gray-700 mr-1">Horas extra:</span>
            <span className="text-red-600 font-bold">
              {totalExtraHours.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1 text-left">Día</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Fecha</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Modelo</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Inicio</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Fin</th>
                <th className="border border-gray-200 px-2 py-1 text-center">Horas</th>
                <th className="border border-gray-200 px-2 py-1 text-center">
                  Horas extra
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center">
                  Catering
                </th>
                <th className="border border-gray-200 px-2 py-1 text-left">Notas</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, dayIndex) => (
                <tr
                  key={d.dayKey}
                  className={
                    (d.tipoDia === 'libre'
                      ? 'bg-gray-50'
                      : d.tipoDia === 'especial'
                      ? 'bg-blue-50'
                      : 'bg-white') +
                    (d.shortRest ? ' border-l-4 border-red-500' : '')
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
                  <td className="border border-gray-200 px-2 py-1 text-gray-600 text-xs whitespace-nowrap">
                    {getDayDateFormatted(dayIndex)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <select
                      value={d.modeloId}
                      onChange={e =>
                        updateDayField(d.dayKey, 'modeloId', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                    >
                      {MODELOS_JORNADA.map(m => (
                        <option key={m.id || 'none'} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="time"
                      value={d.inicio}
                      onChange={e =>
                        updateDayField(d.dayKey, 'inicio', e.target.value)
                      }
                      className={
                        'w-full border rounded px-1 py-0.5 text-xs ' +
                        (d.shortRest
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-300')
                      }
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
                    {d.horasExtra ? d.horasExtra.toFixed(2) : '0.00'}
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
            onClick={handleSave}
            className="px-4 py-2 bg-accent-green text-white rounded-lg text-sm hover:bg-accent-green-dark disabled:opacity-50"
            disabled={!selectedProyectoId || !selectedCrewId}
          >
            {editId ? 'Actualizar semana' : 'Guardar semana'}
          </button>
        </div>
      </div>
    </div>
  )
}

