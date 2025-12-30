# 🗺️ Filtrado Automático de GeoJSON para Mallorca

## ✅ Funcionalidad Implementada

El sistema ahora **filtra automáticamente** los archivos GeoJSON grandes (España/Europa) para extraer solo las features que están dentro del área de Mallorca antes de guardarlos en la base de datos.

## 🎯 Bounding Box de Mallorca

El filtrado usa el siguiente bounding box aproximado:
- **Latitud**: 39.2° a 40.0°
- **Longitud**: 2.3° a 3.2°

## 📊 Beneficios

### Antes:
- Archivo completo de España/Europa: **60+ MB**
- Tiempo de procesamiento: **Muy lento o timeout**
- Tamaño en base de datos: **60+ MB** (ineficiente)

### Después:
- Archivo filtrado solo Mallorca: **Varios MB o menos**
- Tiempo de procesamiento: **Rápido**
- Tamaño en base de datos: **Optimizado** (solo datos relevantes)
- **Reducción típica: 90-95%** del tamaño original

## 🔧 Cómo Funciona

1. **Subida del archivo**: El usuario sube un archivo GeoJSON grande (hasta 100MB)
2. **Parseo**: El backend parsea el GeoJSON completo
3. **Filtrado automático**: 
   - Identifica todas las features
   - Verifica si cada feature está dentro del bounding box de Mallorca
   - Filtra y mantiene solo las features de Mallorca
4. **Logging**: Muestra estadísticas del filtrado (features originales → features filtradas, tamaño antes/después)
5. **Guardado**: Solo se guarda el GeoJSON filtrado en la base de datos

## 📝 Logs de Ejemplo

En los logs del servidor verás:

```
📤 Filtrando GeoJSON para extraer solo Mallorca...
📤 Tamaño original del GeoJSON: 65.23MB
📊 Filtrado GeoJSON: 15234 features originales → 124 features de Mallorca
✅ GeoJSON filtrado: 2.15MB (reducción del 96.7%)
📤 Creando capa en la base de datos...
```

## ⚠️ Consideraciones

- Si un archivo **NO contiene ninguna feature de Mallorca**, el filtrado fallará con un error claro
- El filtrado se basa en **intersección con el bounding box**, no en clipping preciso
- Para polígonos grandes que cruzan el bounding box, se mantienen completos (no se recortan)

## 🚀 Límites Actualizados

- **Límite de multer**: Aumentado a 100MB (para permitir archivos grandes de España/Europa)
- **Límite del frontend**: Aumentado a 100MB con mensaje informativo sobre el filtrado automático

## 💡 Ventajas

1. **No necesitas herramientas externas**: El filtrado es automático
2. **Ahorro de espacio**: Solo se guardan datos relevantes
3. **Mejor rendimiento**: Procesamiento más rápido
4. **Transparencia**: Los logs muestran exactamente qué se filtró

