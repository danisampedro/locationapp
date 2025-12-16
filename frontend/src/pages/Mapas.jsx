import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Image, Rect, Circle, Line, Text, Transformer } from 'react-konva'
import { useDropzone } from 'react-dropzone'

// Componente para objetos en el canvas
const MapObject = ({ shapeProps, isSelected, onSelect, onChange, scale }) => {
  const shapeRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = (e) => {
    onChange({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y(),
    })
  }

  const handleTransformEnd = () => {
    const node = shapeRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    node.scaleX(1)
    node.scaleY(1)

    onChange({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    })
  }

  // Convertir dimensiones reales a píxeles
  // scale es metros por píxel, así que dividimos metros entre scale para obtener píxeles
  const widthPx = scale > 0 ? (shapeProps.width || 0) / scale : 0
  const heightPx = scale > 0 ? (shapeProps.height || 0) / scale : 0

  const renderShape = () => {
    // No renderizar si scale no está calibrado (scale === 0 significa sin calibrar)
    // o si las dimensiones son inválidas
    if (scale <= 0 || widthPx <= 0 || heightPx <= 0) {
      return null
    }

    switch (shapeProps.type) {
      case 'rectangle':
        return (
          <Rect
            ref={shapeRef}
            x={shapeProps.x}
            y={shapeProps.y}
            width={widthPx}
            height={heightPx}
            fill={shapeProps.fill}
            stroke={shapeProps.stroke}
            strokeWidth={shapeProps.strokeWidth}
            opacity={shapeProps.opacity}
            rotation={shapeProps.rotation || 0}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        )
      case 'circle':
        return (
          <Circle
            ref={shapeRef}
            x={shapeProps.x}
            y={shapeProps.y}
            radius={widthPx / 2}
            fill={shapeProps.fill}
            stroke={shapeProps.stroke}
            strokeWidth={shapeProps.strokeWidth}
            opacity={shapeProps.opacity}
            rotation={shapeProps.rotation || 0}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {renderShape()}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
      {/* Mostrar medidas reales */}
      {isSelected && (
        <Text
          x={shapeProps.x}
          y={shapeProps.y - 20}
          text={`${shapeProps.width.toFixed(2)}m × ${shapeProps.height.toFixed(2)}m`}
          fontSize={12}
          fill="#fff"
          padding={4}
          stroke="#333"
          strokeWidth={1}
        />
      )}
    </>
  )
}

export default function Mapas() {
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 }) // Tamaño original de la imagen
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 }) // Tamaño del contenedor
  const [scale, setScale] = useState(0) // metros por píxel (0 = sin calibrar)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState([])
  const [calibrationDistance, setCalibrationDistance] = useState('')
  const [objects, setObjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [objectLibrary, setObjectLibrary] = useState([])
  const [showCreateObjectModal, setShowCreateObjectModal] = useState(false)
  const [newObject, setNewObject] = useState({
    nombre: '',
    categoria: '',
    ancho: '',
    largo: '',
    forma: 'rectangle',
    color: '#3b82f6',
  })
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const stageRef = useRef()
  const containerRef = useRef()

  // Actualizar tamaño del contenedor cuando cambia el tamaño de la ventana
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [])

  // Cargar imagen de fondo
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.src = e.target.result
        img.onload = () => {
          setBackgroundImage(img)
          setImageSize({ width: img.width, height: img.height })
          // Resetear zoom, posición y escala cuando se carga una nueva imagen
          setStageScale(1)
          setStagePosition({ x: 0, y: 0 })
          setScale(0) // Resetear escala a sin calibrar
          setObjects([]) // Limpiar objetos al cargar nueva imagen
          setSelectedId(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    noClick: true,
  })

  // Calibración de escala
  const handleStageClick = (e) => {
    if (calibrationMode && calibrationPoints.length < 2) {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()
      
      // Convertir coordenadas del pointer (que incluyen zoom y pan) a coordenadas de la imagen original
      const point = {
        x: (pointerPos.x - stagePosition.x) / stageScale,
        y: (pointerPos.y - stagePosition.y) / stageScale,
      }
      
      setCalibrationPoints([...calibrationPoints, point])
    } else if (!calibrationMode) {
      // Si no estamos en modo calibración, permitir seleccionar objetos
      const clickedOnEmpty = e.target === e.target.getStage()
      if (clickedOnEmpty) {
        setSelectedId(null)
      }
    }
  }

  const handleCalibrate = () => {
    if (calibrationPoints.length === 2 && calibrationDistance) {
      const distance = parseFloat(calibrationDistance)
      if (distance > 0) {
        const dx = calibrationPoints[1].x - calibrationPoints[0].x
        const dy = calibrationPoints[1].y - calibrationPoints[0].y
        const pixelDistance = Math.sqrt(dx * dx + dy * dy)
        const newScale = distance / pixelDistance // metros por píxel
        setScale(newScale)
        setCalibrationMode(false)
        setCalibrationPoints([])
        setCalibrationDistance('')
        alert(`Escala calibrada: ${newScale.toFixed(4)} metros por píxel`)
      }
    }
  }

  const handleCancelCalibration = () => {
    setCalibrationMode(false)
    setCalibrationPoints([])
    setCalibrationDistance('')
  }

  // Crear objeto personalizado
  const handleCreateObject = () => {
    if (newObject.nombre && newObject.ancho && newObject.largo) {
      const object = {
        id: Date.now().toString(),
        nombre: newObject.nombre,
        categoria: newObject.categoria,
        width: parseFloat(newObject.ancho),
        height: parseFloat(newObject.largo),
        type: newObject.forma,
        fill: newObject.color,
        stroke: '#000',
        strokeWidth: 2,
        opacity: 0.7,
        x: 100,
        y: 100,
      }
      setObjectLibrary([...objectLibrary, object])
      setShowCreateObjectModal(false)
      setNewObject({
        nombre: '',
        categoria: '',
        ancho: '',
        largo: '',
        forma: 'rectangle',
        color: '#3b82f6',
      })
    }
  }

  // Agregar objeto al canvas desde la biblioteca
  const handleAddObjectToCanvas = (libraryObject) => {
    const newObject = {
      ...libraryObject,
      id: Date.now().toString(),
      x: imageSize.width / 2,
      y: imageSize.height / 2,
    }
    setObjects([...objects, newObject])
  }

  // Eliminar objeto
  const handleDeleteObject = () => {
    if (selectedId) {
      setObjects(objects.filter((obj) => obj.id !== selectedId))
      setSelectedId(null)
    }
  }

  // Duplicar objeto
  const handleDuplicateObject = () => {
    if (selectedId) {
      const selectedObject = objects.find((obj) => obj.id === selectedId)
      if (selectedObject) {
        const duplicated = {
          ...selectedObject,
          id: Date.now().toString(),
          x: selectedObject.x + 20,
          y: selectedObject.y + 20,
        }
        setObjects([...objects, duplicated])
      }
    }
  }

  // Zoom
  const handleZoom = (delta) => {
    const scaleBy = 1.1
    const stage = stageRef.current
    const oldScale = stageScale
    const newScale = delta > 0 ? oldScale * scaleBy : oldScale / scaleBy
    setStageScale(Math.max(0.1, Math.min(5, newScale)))
  }

  // Cálculos de superficie
  const calculateMetrics = () => {
    const totalAreaPx = imageSize.width * imageSize.height
    const totalAreaM2 = totalAreaPx * scale * scale

    let occupiedAreaM2 = 0
    const objectsByCategory = {}

    objects.forEach((obj) => {
      const areaM2 = obj.width * obj.height
      occupiedAreaM2 += areaM2

      if (!objectsByCategory[obj.categoria || 'Sin categoría']) {
        objectsByCategory[obj.categoria || 'Sin categoría'] = 0
      }
      objectsByCategory[obj.categoria || 'Sin categoría']++
    })

    const freeAreaM2 = totalAreaM2 - occupiedAreaM2

    return {
      totalAreaM2,
      occupiedAreaM2,
      freeAreaM2,
      objectsByCategory,
      totalObjects: objects.length,
    }
  }

  const metrics = calculateMetrics()

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mapas</h1>
          <p className="text-sm text-gray-500">Planificación y diseño de espacios sobre mapas</p>
        </div>
        <div className="flex gap-2">
          {!backgroundImage && (
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <button className="bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors">
                Cargar Mapa/Plano
              </button>
            </div>
          )}
          {backgroundImage && !calibrationMode && scale === 0 && (
            <button
              onClick={() => {
                setCalibrationMode(true)
                setCalibrationPoints([])
              }}
              className="bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-accent-green-dark transition-colors"
            >
              Calibrar Escala
            </button>
          )}
          {backgroundImage && calibrationMode && (
            <button
              onClick={handleCancelCalibration}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar Calibración
            </button>
          )}
          {backgroundImage && !calibrationMode && scale > 0 && (
            <button
              onClick={() => {
                setScale(0)
                setCalibrationPoints([])
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Recalibrar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel lateral izquierdo - Biblioteca de objetos */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 mb-2">Biblioteca de Objetos</h2>
            <button
              onClick={() => setShowCreateObjectModal(true)}
              className="w-full bg-dark-blue text-white px-3 py-2 rounded-lg hover:bg-dark-blue-light transition-colors text-sm"
            >
              + Crear Objeto
            </button>
          </div>

          <div className="p-4 space-y-2">
            {objectLibrary.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay objetos en la biblioteca. Crea tu primer objeto.
              </p>
            ) : (
              objectLibrary.map((obj) => (
                <div
                  key={obj.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-accent-green transition-colors cursor-pointer"
                  onClick={() => handleAddObjectToCanvas(obj)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: obj.fill }}
                    />
                    <span className="font-medium text-sm text-gray-800">{obj.nombre}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {obj.categoria && <div>Categoría: {obj.categoria}</div>}
                    <div>
                      {obj.width}m × {obj.height}m
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canvas central */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 relative" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute inset-0 bg-accent-green/20 border-2 border-dashed border-accent-green z-50 flex items-center justify-center">
                <p className="text-accent-green font-semibold text-lg">Suelta el mapa aquí...</p>
              </div>
            )}
            {!backgroundImage && !isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 mb-2">Arrastra un mapa o plano aquí</p>
                  <p className="text-sm text-gray-400">o haz clic para seleccionar</p>
                </div>
              </div>
            )}

            {backgroundImage && (
              <div ref={containerRef} className="w-full h-full overflow-hidden bg-gray-200 relative">
                <Stage
                  ref={stageRef}
                  width={containerSize.width}
                  height={containerSize.height}
                  onWheel={(e) => {
                    e.evt.preventDefault()
                    const stage = e.target.getStage()
                    const oldScale = stageScale
                    const pointer = stage.getPointerPosition()
                    const mousePointTo = {
                      x: (pointer.x - stagePosition.x) / oldScale,
                      y: (pointer.y - stagePosition.y) / oldScale,
                    }
                    const scaleBy = 1.1
                    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
                    const clampedScale = Math.max(0.1, Math.min(5, newScale))
                    setStageScale(clampedScale)
                    setStagePosition({
                      x: pointer.x - mousePointTo.x * clampedScale,
                      y: pointer.y - mousePointTo.y * clampedScale,
                    })
                  }}
                  onMouseDown={(e) => {
                    const stage = e.target.getStage()
                    if (e.evt.button === 0 && !calibrationMode) {
                      stage.container().style.cursor = 'grabbing'
                    }
                  }}
                  onMouseUp={(e) => {
                    const stage = e.target.getStage()
                    stage.container().style.cursor = 'default'
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage()
                    stage.container().style.cursor = 'default'
                  }}
                  onClick={handleStageClick}
                  onTap={handleStageClick}
                >
                  <Layer
                    scaleX={stageScale}
                    scaleY={stageScale}
                    x={stagePosition.x}
                    y={stagePosition.y}
                    draggable={!calibrationMode}
                    onDragStart={(e) => {
                      if (calibrationMode) {
                        e.cancelBubble = true
                        return false
                      }
                    }}
                    onDragMove={(e) => {
                      if (!calibrationMode) {
                        setStagePosition({ x: e.target.x(), y: e.target.y() })
                      }
                    }}
                  >
                    {/* Imagen de fondo */}
                    <Image 
                      image={backgroundImage} 
                      width={imageSize.width}
                      height={imageSize.height}
                    />

                    {/* Puntos de calibración */}
                    {calibrationMode &&
                      calibrationPoints.map((point, index) => (
                        <Circle
                          key={index}
                          x={point.x}
                          y={point.y}
                          radius={5 / stageScale}
                          fill="red"
                          stroke="white"
                          strokeWidth={2 / stageScale}
                        />
                      ))}

                    {/* Línea de calibración */}
                    {calibrationMode && calibrationPoints.length === 2 && (
                      <Line
                        points={[
                          calibrationPoints[0].x,
                          calibrationPoints[0].y,
                          calibrationPoints[1].x,
                          calibrationPoints[1].y,
                        ]}
                        stroke="red"
                        strokeWidth={2 / stageScale}
                        dash={[5 / stageScale, 5 / stageScale]}
                      />
                    )}

                    {/* Objetos - Solo mostrar si la escala está calibrada */}
                    {scale > 0 && objects.length > 0 && objects.map((obj) => (
                      <MapObject
                        key={obj.id}
                        shapeProps={obj}
                        isSelected={obj.id === selectedId}
                        onSelect={() => setSelectedId(obj.id)}
                        onChange={(newAttrs) => {
                          const updatedObjects = objects.map((o) =>
                            o.id === obj.id ? { ...o, ...newAttrs } : o
                          )
                          setObjects(updatedObjects)
                        }}
                        scale={scale}
                      />
                    ))}
                  </Layer>
                </Stage>
              </div>
            )}
          </div>

          {/* Controles de zoom */}
          {backgroundImage && (
            <div className="bg-white border-t border-gray-200 p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom(-1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  −
                </button>
                <span className="text-sm text-gray-600 w-20 text-center">
                  {Math.round(stageScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setStageScale(1)
                    setStagePosition({ x: 0, y: 0 })
                  }}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm ml-4"
                >
                  Reset
                </button>
              </div>
              {selectedId && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDuplicateObject}
                    className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm"
                  >
                    Duplicar
                  </button>
                  <button
                    onClick={handleDeleteObject}
                    className="px-3 py-1 bg-red-500 text-white hover:bg-red-600 rounded text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel lateral derecho - Métricas */}
        <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Métricas</h2>
          </div>

          <div className="p-4 space-y-4">
            {scale === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Calibra la escala para ver las métricas
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Superficie Total</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {metrics.totalAreaM2.toFixed(2)} m²
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Superficie Ocupada</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {metrics.occupiedAreaM2.toFixed(2)} m²
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Superficie Libre</div>
                  <div className="text-lg font-semibold text-accent-green">
                    {metrics.freeAreaM2.toFixed(2)} m²
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Total de Objetos</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {metrics.totalObjects}
                  </div>
                </div>

                {Object.keys(metrics.objectsByCategory).length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Por Categoría</div>
                    <div className="space-y-1">
                      {Object.entries(metrics.objectsByCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-semibold text-gray-800">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Escala</div>
                  <div className="text-sm font-medium text-gray-700">
                    {scale.toFixed(4)} m/px
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de calibración */}
      {calibrationMode && calibrationPoints.length === 2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Calibrar Escala</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa la distancia real en metros entre los dos puntos seleccionados:
            </p>
            <input
              type="number"
              value={calibrationDistance}
              onChange={(e) => setCalibrationDistance(e.target.value)}
              placeholder="Distancia en metros"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue mb-4"
              step="0.01"
              min="0.01"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCalibrate}
                className="flex-1 bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
              >
                Calibrar
              </button>
              <button
                onClick={handleCancelCalibration}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear objeto */}
      {showCreateObjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Crear Objeto Personalizado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newObject.nombre}
                  onChange={(e) => setNewObject({ ...newObject, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Ej: Camión, Contenedor, Escenario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={newObject.categoria}
                  onChange={(e) => setNewObject({ ...newObject, categoria: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="Ej: Vehículos, Mobiliario, Equipamiento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newObject.ancho}
                    onChange={(e) => setNewObject({ ...newObject, ancho: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                    step="0.01"
                    min="0.01"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largo (m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newObject.largo}
                    onChange={(e) => setNewObject({ ...newObject, largo: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                    step="0.01"
                    min="0.01"
                    placeholder="5.0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma
                </label>
                <select
                  value={newObject.forma}
                  onChange={(e) => setNewObject({ ...newObject, forma: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                >
                  <option value="rectangle">Rectángulo</option>
                  <option value="circle">Círculo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newObject.color}
                  onChange={(e) => setNewObject({ ...newObject, color: e.target.value })}
                  className="w-full h-10 border rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateObject}
                className="flex-1 bg-dark-blue text-white px-4 py-2 rounded-lg hover:bg-dark-blue-light transition-colors"
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setShowCreateObjectModal(false)
                  setNewObject({
                    nombre: '',
                    categoria: '',
                    ancho: '',
                    largo: '',
                    forma: 'rectangle',
                    color: '#3b82f6',
                  })
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
