# 🔍 Cambios Realizados para Diagnóstico del Visor

## ✅ Cambios Implementados

### 1. Logging de Diagnóstico
- ✅ Añadido logging al cargar el router (`✅ Router de visor cargado correctamente`)
- ✅ Añadido logging al registrar las rutas en `server.js`
- ✅ Añadido logging extensivo en la ruta `/admin/upload`:
  - Cuando se recibe una petición
  - Información del usuario
  - Claves del body recibido
  - Información del archivo
  - Progreso del procesamiento del archivo
  - Errores detallados

### 2. Manejo del Directorio Uploads
- ✅ Verificación y creación automática del directorio `uploads/` si no existe
- ✅ Uso de ruta absoluta para el directorio (mejor para producción)
- ✅ Uso correcto de `fs.existsSync` antes de eliminar archivos

### 3. Mejoras en el Manejo de Errores
- ✅ Mensajes de error más detallados (incluyen el mensaje del error original)
- ✅ Logging del stack trace para debugging
- ✅ Verificación de existencia de archivo antes de eliminarlo

## 📋 Qué Verificar en los Logs de Render

Después de desplegar estos cambios, en los logs de Render deberías ver:

1. **Al iniciar el servidor:**
   ```
   ✅ Router de visor cargado correctamente
   ✅ Directorio de uploads: /ruta/al/directorio/uploads
   ✅ Rutas del visor importadas correctamente
   ✅ Rutas /api/visor registradas correctamente
   ```

2. **Al hacer una petición POST /api/visor/admin/upload:**
   ```
   📤 POST /api/visor/admin/upload - Petición recibida
   📤 Usuario: nombre_usuario
   📤 Body keys: [lista de claves]
   📤 File: { información del archivo }
   📤 Procesando capa: { información }
   📤 Leyendo archivo: /ruta/al/archivo
   📤 Tamaño del archivo: X bytes
   📤 Extensión del archivo: .geojson
   ✅ GeoJSON parseado correctamente, tipo: FeatureCollection
   ✅ Archivo temporal eliminado
   ✅ Capa creada exitosamente con ID: X
   ```

3. **Si hay errores:**
   ```
   ❌ Error creando capa: [mensaje de error]
   ❌ Error stack: [stack trace completo]
   ```

## 🔧 Si el Problema Persiste

Si después de estos cambios el error 404 persiste, los logs te dirán exactamente dónde está el problema:

- **Si NO ves "✅ Router de visor cargado correctamente"**: El archivo no se está cargando
- **Si NO ves "✅ Rutas /api/visor registradas correctamente"**: El servidor no está registrando las rutas
- **Si NO ves "📤 POST /api/visor/admin/upload - Petición recibida"**: La ruta no se está alcanzando (problema de routing)
- **Si ves la petición pero falla después**: El problema está en el procesamiento (archivo, base de datos, etc.)

## 📤 Próximos Pasos

1. Hacer push de estos cambios
2. Hacer deploy en Render
3. Revisar los logs de Render para ver qué mensajes aparecen
4. Intentar subir una capa y revisar los logs detallados

