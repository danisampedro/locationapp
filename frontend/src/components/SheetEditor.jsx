import { useState, useEffect, useRef } from 'react'

export default function SheetEditor({ columnas, filas, onColumnasChange, onFilasChange }) {
  const [editingCell, setEditingCell] = useState(null)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [showAddColumn, setShowAddColumn] = useState(false)
  const inputRef = useRef(null)

  // Generar IDs únicos para columnas si no los tienen (solo una vez al montar)
  useEffect(() => {
    if (columnas && columnas.length > 0) {
      const hasIds = columnas.every(col => col.id)
      if (!hasIds) {
        const updatedColumnas = columnas.map((col, index) => ({
          ...col,
          id: col.id || `col_${Date.now()}_${index}`
        }))
        onColumnasChange(updatedColumnas)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      alert('Por favor, introduce un título para la columna')
      return
    }

    const newCol = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      titulo: newColumnTitle.trim()
    }

    // Asegurarse de que columnas sea un array
    const currentColumnas = Array.isArray(columnas) ? columnas : []
    const updatedColumnas = [...currentColumnas, newCol]
    
    onColumnasChange(updatedColumnas)

    // Inicializar valores vacíos para esta columna en todas las filas existentes
    const currentFilas = Array.isArray(filas) ? filas : []
    const updatedFilas = currentFilas.map(fila => ({
      ...fila,
      datos: {
        ...(fila.datos || {}),
        [newCol.id]: ''
      }
    }))
    onFilasChange(updatedFilas)

    setNewColumnTitle('')
    setShowAddColumn(false)
  }

  const handleDeleteColumn = (colId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta columna? Se perderán todos los datos de esta columna.')) {
      return
    }

    const updatedColumnas = columnas.filter(col => col.id !== colId)
    onColumnasChange(updatedColumnas)

    // Eliminar datos de esta columna en todas las filas
    const updatedFilas = filas.map(fila => {
      const newDatos = { ...fila.datos }
      delete newDatos[colId]
      return {
        ...fila,
        datos: newDatos
      }
    })
    onFilasChange(updatedFilas)
  }

  const handleAddRow = () => {
    const newRow = {
      id: `row_${Date.now()}`,
      datos: {}
    }

    // Inicializar con valores vacíos para todas las columnas
    columnas.forEach(col => {
      newRow.datos[col.id] = ''
    })

    onFilasChange([...(filas || []), newRow])
  }

  const handleDeleteRow = (rowId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta fila?')) {
      return
    }
    onFilasChange(filas.filter(fila => fila.id !== rowId))
  }

  const handleCellChange = (rowId, colId, value) => {
    const updatedFilas = filas.map(fila => {
      if (fila.id === rowId) {
        return {
          ...fila,
          datos: {
            ...fila.datos,
            [colId]: value
          }
        }
      }
      return fila
    })
    onFilasChange(updatedFilas)
  }

  const handleColumnTitleChange = (colId, newTitle) => {
    const updatedColumnas = columnas.map(col => {
      if (col.id === colId) {
        return { ...col, titulo: newTitle }
      }
      return col
    })
    onColumnasChange(updatedColumnas)
  }

  const startEditing = (rowId, colId) => {
    setEditingCell(`${rowId}_${colId}`)
  }

  const stopEditing = () => {
    setEditingCell(null)
  }

  if (!columnas || columnas.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4">No hay columnas definidas. Añade la primera columna para comenzar.</p>
        <div className="flex gap-2 justify-center">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
            placeholder="Título de la columna"
            className="px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleAddColumn}
            className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green-dark"
          >
            Añadir Columna
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Barra de herramientas */}
      <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
        <div className="flex gap-2">
          {!showAddColumn ? (
            <button
              onClick={() => setShowAddColumn(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Añadir Columna
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddColumn()
                  } else if (e.key === 'Escape') {
                    setShowAddColumn(false)
                    setNewColumnTitle('')
                  }
                }}
                placeholder="Título de la columna"
                className="px-3 py-1.5 border rounded text-sm"
                autoFocus
              />
              <button
                onClick={handleAddColumn}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false)
                  setNewColumnTitle('')
                }}
                className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-500"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={handleAddRow}
            className="bg-accent-green text-white px-3 py-1.5 rounded text-sm hover:bg-accent-green-dark flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir Fila
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 w-12">
                #
              </th>
              {columnas.map((col, index) => (
                <th key={col.id} className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 min-w-[150px]">
                  <div className="flex items-center justify-between gap-2">
                    {editingCell === `header_${col.id}` ? (
                      <input
                        type="text"
                        value={col.titulo}
                        onChange={(e) => handleColumnTitleChange(col.id, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                        className="flex-1 px-1 py-0.5 border rounded text-xs"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setEditingCell(`header_${col.id}`)}
                        className="flex-1 cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded"
                        title="Click para editar"
                      >
                        {col.titulo}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteColumn(col.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                      title="Eliminar columna"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas && filas.length > 0 ? (
              filas.map((fila, rowIndex) => (
                <tr key={fila.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 text-center text-xs text-gray-600 bg-gray-50">
                    <div className="flex items-center justify-center gap-1">
                      <span>{rowIndex + 1}</span>
                      <button
                        onClick={() => handleDeleteRow(fila.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Eliminar fila"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                  {columnas.map((col) => {
                    const cellId = `${fila.id}_${col.id}`
                    const isEditing = editingCell === cellId
                    const cellValue = fila.datos && fila.datos[col.id] ? String(fila.datos[col.id]) : ''

                    return (
                      <td key={col.id} className="border border-gray-300 p-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => handleCellChange(fila.id, col.id, e.target.value)}
                            onBlur={stopEditing}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                stopEditing()
                              }
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(fila.id, col.id)}
                            className="px-2 py-1 min-h-[24px] cursor-pointer hover:bg-blue-50 rounded text-sm"
                            title="Click para editar"
                          >
                            {cellValue || <span className="text-gray-400">...</span>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnas.length + 1} className="border border-gray-300 p-4 text-center text-gray-500 text-sm">
                  No hay filas. Haz clic en "Añadir Fila" para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
