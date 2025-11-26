# 🔧 Solución: Error "failed to read dockerfile"

## ❌ El Problema

Render está intentando usar Docker en lugar de leer `render.yaml`. Esto puede pasar porque:
1. El servicio está configurado como "Docker" en lugar de "Web Service"
2. Render no está detectando el `render.yaml` correctamente
3. Necesitas configurar el servicio manualmente

## ✅ Solución: Configurar Manualmente en Render

### Paso 1: Eliminar el Servicio Actual (si existe)

1. Ve a tu servicio en Render
2. Click en **"Settings"**
3. Scroll hasta el final
4. Click en **"Delete Service"**
5. Confirma la eliminación

### Paso 2: Crear Nuevo Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio: `danisampedro/locationapp`
4. Selecciona el repositorio

### Paso 3: Configuración Manual (IMPORTANTE)

**NO uses "Auto-Deploy"**, configura manualmente:

- **Name**: `locationapp-backend`
- **Environment**: `Node` (NO Docker)
- **Region**: Elige la más cercana
- **Branch**: `main`

### Paso 4: Build & Deploy Settings

**Build Command:**
```
cd backend && npm install
```

**Start Command:**
```
cd backend && npm start
```

### Paso 5: Environment Variables

Añade estas variables manualmente:

```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
CLOUDINARY_CLOUD_NAME=de5zyspyj
CLOUDINARY_API_KEY=374527478257815
CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0
```

### Paso 6: Crear el Servicio

1. Click en **"Create Web Service"**
2. Render comenzará a construir

## ⚠️ Importante

- **Environment debe ser "Node"**, NO "Docker"
- Si ves opciones de Docker, estás en el lugar equivocado
- Usa "Web Service", no "Docker Web Service"

## 🔍 Verificar

Después de crear el servicio, en los logs deberías ver:
- ✅ `npm install` ejecutándose
- ✅ `npm start` ejecutándose
- ✅ `Connected to MySQL database`

Si ves referencias a Docker, algo está mal configurado.

