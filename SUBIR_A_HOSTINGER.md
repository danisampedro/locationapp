# 📤 Subir Frontend a Hostinger - Guía Final

## ✅ Backend Verificado

Tu backend está funcionando correctamente:
- ✅ Health check responde: `{"status":"OK","message":"Server is running"}`
- ✅ Backend desplegado en Render
- ✅ Base de datos conectada

## 📤 Subir Frontend a Hostinger

### Paso 1: Acceder a Hostinger

1. Ve al panel de control de Hostinger (hPanel)
2. Inicia sesión con tus credenciales

### Paso 2: Usar File Manager

1. En el panel de Hostinger, busca **"File Manager"** o **"Administrador de Archivos"**
2. Click para abrirlo

### Paso 3: Navegar a la Carpeta Pública

1. En el File Manager, busca la carpeta pública de tu dominio:
   - Generalmente: `public_html`
   - O: `www`
   - O: `htdocs`
2. Abre esa carpeta

### Paso 4: Limpiar (Opcional)

Si hay archivos antiguos en esa carpeta, puedes:
- Eliminarlos (si no los necesitas)
- O moverlos a otra carpeta como backup

### Paso 5: Subir Archivos

1. En el File Manager, busca el botón **"Upload"** o **"Subir"**
2. Selecciona todos los archivos de la carpeta `dist/`:
   - `index.html`
   - Carpeta `assets/` (con todos sus archivos)
3. Sube los archivos

**O si prefieres usar FTP:**

1. Usa un cliente FTP (FileZilla, Cyberduck, etc.)
2. Conéctate con tus credenciales FTP de Hostinger
3. Navega a `public_html` o `www`
4. Sube todos los archivos de `dist/`

### Paso 6: Verificar Estructura

Después de subir, la estructura debe ser:

```
public_html/
├── index.html
└── assets/
    ├── index-BOdIV_FD.js
    └── index-DdGSuZC_.css
```

**Importante**: `index.html` debe estar en la raíz de `public_html`, NO dentro de otra carpeta.

## 🧪 Verificar que Funciona

1. Accede a tu dominio en el navegador
2. Deberías ver:
   - ✅ Menú lateral con: Proyectos, Locations, Crew, Vendors
   - ✅ La aplicación carga correctamente
   - ✅ Puedes navegar entre secciones

3. Prueba crear:
   - Un proyecto (con logo)
   - Una location (con imágenes drag & drop)
   - Un crew member
   - Un vendor

## 🎊 ¡Listo!

Tu aplicación está completamente desplegada:
- ✅ Backend en Render funcionando
- ✅ Frontend en Hostinger
- ✅ Base de datos MySQL conectada
- ✅ Cloudinary configurado

## 🆘 Si Algo No Funciona

### La página no carga
- Verifica que `index.html` esté en la raíz de `public_html`
- Verifica que la carpeta `assets/` esté en el mismo nivel
- Revisa la consola del navegador (F12) para errores

### No se conecta al backend
- Verifica que la URL del backend sea correcta en el build
- Abre la consola del navegador (F12) y revisa los errores de red
- Verifica que el backend esté funcionando en Render

### Errores de CORS
- El backend ya tiene CORS configurado
- Si persisten, verifica los logs de Render

