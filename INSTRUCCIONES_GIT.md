# 📦 Instrucciones para Conectar con GitHub y Render

## ✅ Paso 1: Repositorio Git Inicializado

Ya tienes el repositorio Git inicializado y el commit inicial hecho.

## 📤 Paso 2: Crear Repositorio en GitHub

### Opción A: Desde GitHub Web

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Click en el botón **"+"** (arriba a la derecha) → **"New repository"**
3. Configura:
   - **Repository name**: `locationapp` (o el nombre que prefieras)
   - **Description**: "Location App - Gestión de proyectos, locations, crew y vendors"
   - **Visibility**: Elige **Public** o **Private**
   - **NO marques** "Initialize this repository with a README" (ya tienes archivos)
4. Click en **"Create repository"**

### Opción B: Desde GitHub CLI (si lo tienes instalado)

```bash
gh repo create locationapp --public --source=. --remote=origin --push
```

## 🔗 Paso 3: Conectar tu Repositorio Local con GitHub

Ejecuta estos comandos (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
cd /Users/danielsampedropalerm/Documents/Apps/locationapp

# Añade el repositorio remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/locationapp.git

# O si prefieres SSH:
# git remote add origin git@github.com:TU_USUARIO/locationapp.git

# Sube el código
git branch -M main
git push -u origin main
```

## 🚀 Paso 4: Conectar con Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Click en **"Connect account"** si aún no has conectado GitHub
4. Autoriza a Render para acceder a tus repositorios
5. Selecciona tu repositorio `locationapp`
6. Render detectará automáticamente el archivo `render.yaml` y usará la configuración
7. O configura manualmente:
   - **Name**: `locationapp-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
8. En **"Environment Variables"**, añade las variables desde `VARIABLES_RENDER.txt`:
   ```
   DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
   CLOUDINARY_CLOUD_NAME=de5zyspyj
   CLOUDINARY_API_KEY=374527478257815
   CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0
   ```
9. Click en **"Create Web Service"**
10. Render comenzará a construir y desplegar automáticamente

## ✅ Paso 5: Verificar el Deploy

1. Espera a que Render termine el build (5-10 minutos)
2. Verifica los logs para confirmar:
   - ✅ `Connected to MySQL database`
   - ✅ `Database models synchronized`
   - ✅ `Server running on port XXXX`
3. Copia la URL de tu servicio (ej: `https://locationapp-m67w.onrender.com`)

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

Render se actualizará automáticamente.

## 🆘 Si Tienes Problemas

### Error: "Repository not found"
- Verifica que el nombre del repositorio sea correcto
- Verifica que tengas permisos para acceder al repositorio

### Error: "Authentication failed"
- Si usas HTTPS, GitHub puede requerir un token personal
- Ve a GitHub → Settings → Developer settings → Personal access tokens
- Crea un token con permisos de repositorio
- Usa el token como contraseña al hacer push

### Error en Render: "Build failed"
- Revisa los logs de Render para ver el error específico
- Verifica que todas las variables de entorno estén configuradas
- Verifica que el archivo `render.yaml` esté en la raíz del proyecto

