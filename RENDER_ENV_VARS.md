# Variables de Entorno para Render

Copia y pega estas variables de entorno en el panel de Render:

## Variables de Entorno

```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp
CLOUDINARY_CLOUD_NAME=de5zyspyj
CLOUDINARY_API_KEY=374527478257815
CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0
```

## Instrucciones

1. Ve a tu servicio en Render
2. Click en **"Environment"** en el menú lateral
3. Click en **"Add Environment Variable"**
4. Añade cada variable una por una:

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: `mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp`

   **Variable 2:**
   - Key: `CLOUDINARY_CLOUD_NAME`
   - Value: `de5zyspyj`

   **Variable 3:**
   - Key: `CLOUDINARY_API_KEY`
   - Value: `374527478257815`

   **Variable 4:**
   - Key: `CLOUDINARY_API_SECRET`
   - Value: `0wKSmyRf_yGc7NwIXzpfE9mnSe0`

5. Guarda los cambios
6. Render reiniciará automáticamente el servicio con las nuevas variables

## Verificar

Después de desplegar, verifica los logs en Render. Deberías ver:
- ✅ `Connected to MySQL database`
- ✅ `Database models synchronized`
- ✅ `Server running on port XXXX`

Si ves errores de conexión, verifica que todas las variables estén correctamente configuradas.

