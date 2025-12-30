# 🔍 Verificar Build Correcto

## ⚠️ PROBLEMA ACTUAL

Estás viendo errores con `localhost:3001` y el archivo `index-BmWd_7kH.js`, pero el build correcto tiene:
- Archivo: `index-D9aDTYlN.js` (nombre puede variar en futuros builds)
- URL: `https://locationapp-backend.onrender.com/api`

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Verificar Archivos en `dist/`

Antes de subir, verifica que en la carpeta `dist/` local tengas:

```bash
dist/
├── index.html
├── .htaccess
└── assets/
    ├── index-D9aDTYlN.js  (o similar, pero NO index-BmWd_7kH.js)
    ├── index-C3PUPYa0.css
    ├── index.es-BsYF_2Hf.js
    └── purify.es-B6FQ9oRL.js
```

### Paso 2: BORRAR TODO en Hostinger

**MUY IMPORTANTE**: Debes borrar TODO el contenido antiguo:

1. Ve a File Manager de Hostinger
2. Navega a `public_html` (o `www`)
3. **SELECCIONA Y ELIMINA**:
   - `index.html`
   - Toda la carpeta `assets/` (incluye el archivo antiguo `index-BmWd_7kH.js`)
   - Cualquier otro archivo o carpeta

### Paso 3: Subir Build Nuevo

Sube **TODOS** los archivos de `dist/` a `public_html`:

1. Selecciona **TODOS** los archivos de `dist/`
2. Sube a `public_html`:
   - `index.html` → debe estar en la raíz de `public_html`
   - `.htaccess` → debe estar en la raíz de `public_html`
   - Carpeta `assets/` completa → debe estar en la raíz de `public_html`

### Paso 4: Verificar en Hostinger

Después de subir, verifica en Hostinger File Manager que tengas:

```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-D9aDTYlN.js  (archivo NUEVO, NO el antiguo)
    ├── index-C3PUPYa0.css
    ├── index.es-BsYF_2Hf.js
    └── purify.es-B6FQ9oRL.js
```

**IMPORTANTE**: El archivo JavaScript debe ser `index-D9aDTYlN.js` (o similar), **NO** `index-BmWd_7kH.js`

### Paso 5: Limpiar Caché del Navegador

**Obligatorio** antes de probar:

1. **Opción A**: Modo incógnito
   - Abre ventana incógnita: `Ctrl + Shift + N` (Windows) o `Cmd + Shift + N` (Mac)
   - Ve a tu dominio

2. **Opción B**: Hard Refresh
   - Abre tu dominio
   - Presiona: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)

3. **Opción C**: Limpiar caché completamente
   - Chrome: Configuración → Privacidad → Borrar datos de navegación
   - Selecciona "Imágenes y archivos en caché"
   - Borrar

### Paso 6: Verificar en el Navegador

1. Abre la consola (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Verifica que las peticiones vayan a:
   - ✅ `https://locationapp-backend.onrender.com/api/auth/login`
   - ❌ NO deben ir a `localhost:3001`

5. Verifica el archivo JavaScript cargado:
   - Ve a la pestaña **Sources** o **Network**
   - El archivo debe ser `index-D9aDTYlN.js` (o similar)
   - ❌ NO debe ser `index-BmWd_7kH.js`

## 🔧 Si Sigue Sin Funcionar

### 1. Verificar que el Backend Funciona

Abre en tu navegador:
```
https://locationapp-backend.onrender.com/api/health
```

Debes ver:
```json
{"status":"OK","message":"Server is running"}
```

Si no funciona, el backend puede estar "sleeping" (plan gratuito). Espera 30-60 segundos y vuelve a intentar.

### 2. Verificar URL Real del Backend

Si la URL no es `locationapp-backend.onrender.com`:

1. Ve a Render Dashboard
2. Click en tu servicio `locationapp-backend`
3. Copia la URL real (ejemplo: `https://locationapp-xxxxx.onrender.com`)
4. Edita `frontend/.env`:
   ```env
   VITE_API_URL=https://TU-URL-REAL.onrender.com/api
   ```
5. Regenera el build:
   ```bash
   cd frontend
   npm run build
   ```
6. Vuelve a subir a Hostinger

## ✅ Checklist Final

- [ ] Eliminé TODO el contenido antiguo de `public_html`
- [ ] Subí `index.html` a la raíz de `public_html`
- [ ] Subí `.htaccess` a la raíz de `public_html`
- [ ] Subí la carpeta `assets/` completa a la raíz de `public_html`
- [ ] Verifiqué que el archivo JS en `assets/` es el nuevo (NO `index-BmWd_7kH.js`)
- [ ] Limpié la caché del navegador
- [ ] Verifiqué que las peticiones van a `https://locationapp-backend.onrender.com/api`
- [ ] Verifiqué que NO van a `localhost:3001`

