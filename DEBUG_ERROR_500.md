# 🔍 Debugging Error 500 en Upload de Capas

## ⚠️ Problema

Error 500 (Internal Server Error) al intentar subir una capa GeoJSON.

## ✅ Cambios Realizados

Se ha mejorado el manejo de errores para obtener información más detallada:

1. **Logging mejorado**: Más información en cada paso del proceso
2. **Manejo específico de errores de BD**: Distingue entre errores de validación y errores generales
3. **Stack trace completo**: Para debugging en desarrollo
4. **Verificación de headers**: Asegura que siempre se responde con JSON

## 📋 Qué Revisar en los Logs de Render

Después de hacer deploy, en los logs de Render deberías ver información detallada:

### Si la petición llega:
```
📤 POST /api/visor/admin/upload - Petición recibida
📤 Usuario: nombre_usuario
📤 Body keys: [nombre, tipo, ...]
📤 File: { name: archivo.geojson, size: X, path: /ruta }
📤 Procesando capa: { nombre: "...", tipo: "...", tieneArchivo: true }
```

### Si el archivo se procesa correctamente:
```
📤 Leyendo archivo: /ruta/al/archivo
📤 Tamaño del archivo: X bytes
📤 Extensión del archivo: .geojson
✅ GeoJSON parseado correctamente, tipo: FeatureCollection
✅ Archivo temporal eliminado
📤 Creando capa en la base de datos...
📤 Geometría preparada, tipo: FeatureCollection
```

### Si hay un error:
```
❌ Error al crear capa en BD: [error details]
❌ Error name: SequelizeValidationError / SequelizeDatabaseError / etc
❌ Error message: [mensaje detallado]
❌ Error stack: [stack trace completo]
```

## 🔧 Posibles Causas del Error 500

1. **Archivo GeoJSON muy grande**: El archivo podría exceder el límite de tamaño o causar problemas de memoria
2. **Error en la base de datos**: 
   - La tabla `capas` no existe
   - El campo `geometria` tiene restricciones que no se cumplen
   - Problema con el tipo de dato TEXT('long')
3. **Error al convertir JSON**: El setter del modelo podría fallar con ciertos tipos de GeoJSON
4. **Problema con el directorio uploads**: No se puede crear o escribir en el directorio

## 📤 Próximos Pasos

1. **Hacer deploy de los cambios** (ya están commiteados)
2. **Intentar subir una capa nuevamente**
3. **Revisar los logs de Render** para ver exactamente dónde falla
4. **Compartir los logs** para identificar la causa específica

## 💡 Si el Problema Persiste

Con los logs mejorados, podremos ver:
- Si el error es en la lectura del archivo
- Si es en el parseo del JSON
- Si es en la inserción en la base de datos
- El tipo exacto de error (validation, database, etc.)

Esto nos permitirá hacer una corrección más precisa.

