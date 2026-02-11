import React from 'react'

export default function Timesheets() {
  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Timesheets</h1>
        <p className="text-gray-500 text-sm mt-1">
          Módulo de control de horas semanales por trabajador y proyecto.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <p className="text-gray-600">
          Esta pantalla está creada y lista para integrar el flujo completo de:
        </p>
        <ul className="list-disc list-inside mt-3 text-gray-600 text-sm space-y-1">
          <li>Selección de proyecto, trabajador y semana.</li>
          <li>Entrada de jornada semanal en texto libre y parseo automático.</li>
          <li>Tabla semanal con resumen de días, horas y estados.</li>
          <li>Aplicación de normas (12h descanso, días libres, día especial).</li>
          <li>Exportación de timesheet a Excel.</li>
        </ul>
        <p className="mt-4 text-gray-500 text-sm">
          Si quieres, en el siguiente paso implemento aquí toda la lógica de parsers, validaciones y conexión con el backend.
        </p>
      </div>
    </div>
  )
}

