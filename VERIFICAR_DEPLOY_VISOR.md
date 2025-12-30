# 🔍 Verificar Deploy del Backend - Rutas del Visor

## ⚠️ Problema

El error `Cannot POST /api/visor/admin/upload` (404) indica que la ruta no existe en el servidor de Render.

## ✅ Solución

### 1. Verificar que el Código Está en GitHub

1. Ve a tu repositorio en GitHub
2. Verifica que el archivo `backend/routes/visor.js` existe
3. Verifica que tiene el commit: "Eliminar authMiddleware redundante en rutas de visor"
4. Si NO está, necesitas hacer push:

```bash
git push
```

### 2. Verificar que Render Está Conectado al Repositorio Correcto

1. Ve a Render Dashboard
2. Click en tu servicio backend
3. Ve a la pestaña "Settings"
4. Verifica:
   - **Repository**: Debe apuntar al repositorio correcto
   - **Branch**: Debe ser `main` (o la rama que uses)
   - **Auto-Deploy**: Debe estar habilitado

### 3. Forzar Nuevo Deploy en Render

1. Ve a Render Dashboard
2. Click en tu servicio backend
3. Ve a la pestaña "Events" o "Deploys"
4. Click en "Manual Deploy" → "Deploy latest commit"
5. Espera a que termine el deploy (puede tardar varios minutos)

### 4. Verificar los Logs de Render

1. Ve a Render Dashboard
2. Click en tu servicio backend
3. Ve a la pestaña "Logs"
4. Busca errores al iniciar el servidor:
   - ❌ Si ves errores de importación: el código no se desplegó correctamente
   - ❌ Si ves "Cannot find module": falta alguna dependencia
   - ✅ Si ves "Server running on port": el servidor está corriendo

### 5. Verificar que las Rutas se Registran Correctamente

En los logs de Render, deberías ver que el servidor inicia sin errores. Si hay errores relacionados con `visor.js` o `Capa`, significa que hay un problema con el código.

### 6. Probar la Ruta Directamente

Puedes probar si el servidor responde:

```bash
# Probar health check
curl https://TU-BACKEND-URL.onrender.com/api/health

# Probar obtener capas (debe requerir autenticación)
curl https://TU-BACKEND-URL.onrender.com/api/visor/capas
```

## 🔧 Si el Problema Persiste

### Opción A: Verificar Variables de Entorno

1. Ve a Render Dashboard → Settings → Environment
2. Verifica que todas las variables necesarias estén configuradas:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CLOUDINARY_*` (si se usan)

### Opción B: Revisar el Código Localmente

Prueba iniciar el servidor localmente para ver si hay errores:

```bash
cd backend
npm install
npm start
```

Si funciona localmente pero no en Render, el problema es el deploy.

### Opción C: Verificar que el Modelo Capa Existe

Asegúrate de que el modelo `Capa` se está exportando correctamente en `backend/models/index.js`:

```javascript
export { Capa } from './Capa.js'
```

## ✅ Checklist

- [ ] El código está en GitHub (hacer push si falta)
- [ ] Render está conectado al repositorio correcto
- [ ] Se ha forzado un nuevo deploy en Render
- [ ] Los logs de Render no muestran errores al iniciar
- [ ] El servidor responde a `/api/health`
- [ ] Las variables de entorno están configuradas en Render

