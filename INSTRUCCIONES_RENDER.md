# Instrucciones para Desplegar en Render

## Paso 1: Preparar el Repositorio

1. Asegúrate de que todo tu código esté en un repositorio Git (GitHub, GitLab, etc.)
2. Verifica que el archivo `render.yaml` esté en la raíz del proyecto

## Paso 2: Crear el Servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio (GitHub/GitLab)
4. Selecciona el repositorio de tu proyecto

## Paso 3: Configurar el Servicio

### Configuración Básica:
- **Name**: `locationapp-backend` (o el nombre que prefieras)
- **Environment**: `Node`
- **Region**: Elige la región más cercana
- **Branch**: `main` (o la rama que uses)

### Build & Deploy:
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

## Paso 4: Configurar Variables de Entorno

En la sección **"Environment Variables"**, añade:

### Base de Datos MySQL:
```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
```

✅ **Configuración completa**: Ya tienes el host correcto (`srv2071.hstgr.io`) y acceso remoto configurado.

**Alternativa** (si DATABASE_URL no funciona, usa variables individuales):
```
DB_NAME=u729095573_locationapp
DB_USER=u729095573_locationapp
DB_PASSWORD=Dsp_76499486
DB_HOST=HOST_DE_HOSTINGER
DB_PORT=3306
```

### Cloudinary:
```
CLOUDINARY_CLOUD_NAME=de5zyspyj
CLOUDINARY_API_KEY=374527478257815
CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0
```

## Paso 5: Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Espera a que el despliegue termine (puede tardar unos minutos)
4. Una vez completado, copia la URL de tu servicio (ej: `https://locationapp-backend.onrender.com`)

## Paso 6: Configurar el Frontend

1. Edita `frontend/.env` y configura:
   ```
   VITE_API_URL=https://tu-backend.onrender.com/api
   ```

2. Genera el build:
   ```bash
   cd frontend
   npm run build
   ```

3. La carpeta `dist/` estará lista para subir a Hostinger

## Solución de Problemas

### Error de conexión a la base de datos:

1. **Verifica el host**: Hostinger puede requerir un host específico para acceso remoto
2. **Verifica el firewall**: Asegúrate de que Hostinger permita conexiones desde Render
3. **Contacta con Hostinger**: Si solo permite `localhost`, necesitarás habilitar acceso remoto

### El servicio no inicia:

1. Revisa los logs en Render para ver el error específico
2. Verifica que todas las variables de entorno estén configuradas correctamente
3. Asegúrate de que `package.json` tenga el script `start` correcto

