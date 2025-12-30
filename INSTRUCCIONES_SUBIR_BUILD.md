# 📤 Instrucciones para Subir el Build Correcto

## ⚠️ Problema Actual

Estás viendo errores con `localhost:3001` y archivos antiguos como `index-BmWd_7kH.js`. Esto significa que el build en Hostinger es **antiguo**.

## ✅ Solución

### 1. Verifica que el Build Actual es Correcto

El build actual en `dist/` debe tener:
- `index-D9aDTYlN.js` (NO `index-BmWd_7kH.js`)
- URL: `https://locationapp-backend.onrender.com/api` (NO `localhost:3001`)

### 2. Sube el Build Nuevo a Hostinger

1. **Accede al File Manager de Hostinger**
2. **Ve a `public_html` (o `www`)**
3. **BORRA TODO** el contenido actual:
   - Elimina `index.html`
   - Elimina toda la carpeta `assets/`
   - Elimina cualquier otro archivo/carpeta
4. **Sube TODO el contenido de `dist/`**:
   - `index.html`
   - Carpeta `assets/` completa (con todos sus archivos)
   - `.htaccess` (importante para que funcionen las rutas)

### 3. Verifica que los Archivos Están Correctos

Después de subir, verifica que:
- `index.html` esté en la raíz de `public_html`
- La carpeta `assets/` contenga:
  - `index-D9aDTYlN.js` (el archivo nuevo, NO el antiguo)
  - `index-C3PUPYa0.css`
  - `index.es-BsYF_2Hf.js`
  - `purify.es-B6FQ9oRL.js`
- `.htaccess` esté en la raíz

### 4. Limpia la Caché del Navegador

1. Abre en **modo incógnito** O
2. Haz **Hard Refresh**: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
3. O limpia la caché completamente del navegador

### 5. Verifica que Funciona

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Verifica que las peticiones vayan a `https://locationapp-backend.onrender.com/api/auth/login`
5. **NO** deberían ir a `localhost:3001`

## 🔍 Si Sigue Sin Funcionar

1. **Verifica la URL del backend en Render**:
   - Ve a Render Dashboard
   - Copia la URL real de tu servicio
   - Si NO es `locationapp-backend.onrender.com`, edita `frontend/.env` con la URL correcta
   - Regenera el build: `cd frontend && npm run build`
   - Vuelve a subir a Hostinger

2. **Verifica que el backend funciona**:
   - Abre: `https://TU-URL.onrender.com/api/health`
   - Deberías ver: `{"status":"OK","message":"Server is running"}`

## ✅ Archivos que Debes Subir

Desde la carpeta `dist/`:
- `index.html`
- `.htaccess`
- `assets/index-D9aDTYlN.js` (nombre puede variar, pero NO debe ser `index-BmWd_7kH.js`)
- `assets/index-C3PUPYa0.css`
- `assets/index.es-BsYF_2Hf.js`
- `assets/purify.es-B6FQ9oRL.js`

