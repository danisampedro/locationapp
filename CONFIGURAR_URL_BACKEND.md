# 🔧 Configurar URL del Backend

## ⚠️ Error: ERR_CONNECTION_REFUSED

Este error significa que el frontend no puede conectarse al backend. Necesitas configurar la URL correcta.

## 📋 Pasos para Solucionar

### 1. Encuentra la URL de tu Backend en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Busca tu servicio llamado `locationapp-backend`
3. Haz click en el servicio
4. **Copia la URL** que aparece en la parte superior
   - Formato: `https://tu-servicio-xxxxx.onrender.com`
   - Ejemplo: `https://locationapp-m67w.onrender.com`

### 2. Verifica que el Backend Funciona

Abre en tu navegador:
```
https://TU-URL.onrender.com/api/health
```

Deberías ver:
```json
{"status":"OK","message":"Server is running"}
```

Si no funciona, el backend puede estar "sleeping" (plan gratuito). Espera 30-60 segundos y vuelve a intentar.

### 3. Crea el archivo .env en el frontend

Crea un archivo `.env` en la carpeta `frontend/` con:

```env
VITE_API_URL=https://TU-URL-REAL.onrender.com/api
```

**Ejemplo** (si tu URL es `locationapp-m67w.onrender.com`):
```env
VITE_API_URL=https://locationapp-m67w.onrender.com/api
```

### 4. Regenera el Build

```bash
cd frontend
npm run build
```

### 5. Sube el Nuevo Build a Hostinger

Sube todo el contenido de la carpeta `dist/` a Hostinger.

## ✅ Verificación

Después de subir el nuevo build, el frontend debería poder conectarse al backend.

Si sigue sin funcionar:
1. Verifica que la URL en `.env` sea correcta (debe terminar en `/api`)
2. Verifica que el backend esté funcionando en Render
3. Revisa la consola del navegador para ver errores específicos

