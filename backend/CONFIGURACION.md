# Configuración del Backend

## Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# MySQL Database (Hostinger)
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp

# O configuración individual:
DB_NAME=u729095573_locationapp
DB_USER=u729095573_locationapp
DB_PASSWORD=Dsp_76499486
DB_HOST=srv2071.hstgr.io
DB_PORT=3306

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=de5zyspyj
CLOUDINARY_API_KEY=374527478257815
CLOUDINARY_API_SECRET=0wKSmyRf_yGc7NwIXzpfE9mnSe0

# Server Port
PORT=3001
```

## Configuración en Render

Cuando despliegues en Render, configura estas variables de entorno en el panel de Render:

1. **DATABASE_URL** o las variables individuales:
   - `DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@srv2071.hstgr.io:3306/u729095573_locationapp`
   - O usa las variables individuales:
     - `DB_NAME=u729095573_locationapp`
     - `DB_USER=u729095573_locationapp`
     - `DB_PASSWORD=Dsp_76499486`
     - `DB_HOST=srv2071.hstgr.io`
     - `DB_PORT=3306`
   
2. **CLOUDINARY_CLOUD_NAME**: `de5zyspyj`
3. **CLOUDINARY_API_KEY**: `374527478257815`
4. **CLOUDINARY_API_SECRET**: `0wKSmyRf_yGc7NwIXzpfE9mnSe0`
5. **PORT**: Render lo configura automáticamente, no es necesario

## MySQL en Hostinger

### Credenciales de la base de datos:

- **Base de datos**: `u729095573_locationapp`
- **Usuario**: `u729095573_locationapp`
- **Contraseña**: `Dsp_76499486`
- **Host**: `srv2071.hstgr.io`
- **Puerto**: `3306`

### Nota importante sobre acceso remoto:

Si Render necesita acceder a la base de datos de Hostinger de forma remota, es posible que necesites:
- Configurar el acceso remoto en Hostinger
- Obtener la IP/host externo de Hostinger (puede no ser `localhost`)
- Verificar que el firewall de Hostinger permita conexiones desde Render

Si Hostinger solo permite conexiones locales, considera usar un túnel SSH o contactar con el soporte de Hostinger para habilitar acceso remoto.
