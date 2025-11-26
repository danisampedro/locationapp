# 🔍 Cómo Verificar la URL Correcta de Render

## 📍 Cómo Encontrar tu URL en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en tu servicio (locationapp-backend o el nombre que le pusiste)
3. En la parte superior verás la **URL del servicio**
   - Formato: `https://tu-servicio.onrender.com`
   - Ejemplo: `https://locationapp-m67w.onrender.com`

## ✅ URLs Correctas para Probar

### Health Check:
```
https://TU-URL.onrender.com/api/health
```

**Ejemplo** (si tu URL es `locationapp-m67w.onrender.com`):
```
https://locationapp-m67w.onrender.com/api/health
```

### Otras URLs para Probar:

```
https://TU-URL.onrender.com/api/proyectos
https://TU-URL.onrender.com/api/locations
https://TU-URL.onrender.com/api/crew
https://TU-URL.onrender.com/api/vendors
```

## ⚠️ Posibles Problemas

### 1. El servicio está "sleeping" (plan gratuito)

En Render, el servicio puede estar "durmiendo" si no hay tráfico. La primera petición puede tardar 30-60 segundos en responder.

**Solución**: Espera unos segundos y vuelve a intentar.

### 2. URL incorrecta

Asegúrate de que la URL sea exactamente:
- `https://TU-URL.onrender.com/api/health`
- **NO** `https://TU-URL.onrender.com/health` (falta `/api`)
- **NO** `https://TU-URL.onrender.com/api/health/` (no debe terminar en `/`)

### 3. El servicio no está desplegado

Verifica en Render:
- ¿El deploy está completo?
- ¿Hay errores en los logs?
- ¿El servicio está "Live" o "Sleeping"?

### 4. Error de conexión a la base de datos

Si el servicio no puede conectarse a MySQL, no iniciará. Revisa los logs en Render.

## 🔧 Cómo Verificar

1. **En Render Dashboard**:
   - Ve a tu servicio
   - Click en **"Logs"**
   - Deberías ver: `✅ Connected to MySQL database` y `🚀 Server running on port XXXX`

2. **En el navegador**:
   - Abre: `https://TU-URL.onrender.com/api/health`
   - Deberías ver: `{"status":"OK","message":"Server is running"}`

3. **Si no funciona**:
   - Revisa los logs de Render para ver el error específico
   - Verifica que las variables de entorno estén configuradas
   - Verifica que el Build Command y Start Command sean correctos

## 📝 Nota Importante

La URL debe ser exactamente:
- **Con** `https://`
- **Con** `/api/health` al final
- **Sin** barra final (`/`)

