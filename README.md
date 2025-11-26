# Location App

Aplicación web para gestionar proyectos, locations, crew y vendors.

## Estructura del Proyecto

- `frontend/` - Aplicación React con Vite
- `backend/` - API Node.js con Express
- `dist/` - Build de producción del frontend (se genera automáticamente)

## Configuración Rápida

### 1. Backend

1. Navega a la carpeta `backend`:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` con las siguientes variables:
```env
# MySQL (Hostinger)
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
# O usa variables individuales:
# DB_NAME=u729095573_locationapp
# DB_USER=u729095573_locationapp
# DB_PASSWORD=Dsp_76499486
# DB_HOST=srv2071.hstgr.io
# DB_PORT=3306

CLOUDINARY_CLOUD_NAME=de5zyspyj
CLOUDINARY_API_KEY=374527478257815
CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0
PORT=3001
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

### 2. Frontend

1. Navega a la carpeta `frontend`:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` con:
```env
VITE_API_URL=http://localhost:3001/api
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Despliegue

### Backend en Render

1. **Crea una cuenta en Render** (si no la tienes): https://render.com

2. **Conecta tu repositorio** a Render

3. **Crea un nuevo Web Service**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: `Node`

4. **Configura las variables de entorno** en Render:
   - `DATABASE_URL` - Tu URI de MySQL de Hostinger: `mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp`
   - `CLOUDINARY_CLOUD_NAME` - `de5zyspyj`
   - `CLOUDINARY_API_KEY` - `374527478257815`
   - `CLOUDINARY_API_SECRET` - `0wKSmyRf_yGc7NwIXzpfE9mnSe0`

5. **Despliega** y copia la URL de tu backend (ej: `https://tu-app.onrender.com`)

### Frontend en Hostinger

1. **Configura la URL del backend**:
   - Edita `frontend/.env` y configura `VITE_API_URL` con la URL de tu backend en Render
   - Ejemplo: `VITE_API_URL=https://tu-app.onrender.com/api`

2. **Genera el build**:
   ```bash
   # Opción 1: Usar el script
   chmod +x build.sh
   ./build.sh
   
   # Opción 2: Manualmente
   cd frontend
   npm run build
   ```

3. **Sube a Hostinger**:
   - La carpeta `dist/` se creará en la raíz del proyecto
   - Sube todo el contenido de la carpeta `dist/` a tu hosting en Hostinger
   - Asegúrate de que el archivo `index.html` esté en la raíz del directorio público

## MySQL en Hostinger

### Credenciales de la base de datos:

- **Base de datos**: `u729095573_locationapp`
- **Usuario**: `u729095573_locationapp`
- **Contraseña**: `Dsp_76499486`
- **Host**: `srv2071.hstgr.io`
- **Puerto**: `3306`

### Configuración de DATABASE_URL:
```
mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
```

### Acceso remoto desde Render:

✅ **Ya configurado**: Tienes acceso remoto configurado para "%" en Hostinger y el host es `srv2071.hstgr.io`

**Configuración para Render:**
```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
```

## Características

- **Proyectos**: Gestión de proyectos con logo, descripción y asociación de locations, crew y vendors
- **Locations**: Gestión de localizaciones con hasta 2 imágenes (drag & drop)
- **Crew**: Gestión de miembros del equipo
- **Vendors**: Gestión de proveedores

## Tecnologías

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MySQL (Sequelize), Cloudinary
- **Hosting**: Render (backend), Hostinger (frontend + base de datos)
