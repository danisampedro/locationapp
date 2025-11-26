# Configuración de Hostinger para Acceso Remoto

## ✅ Acceso Remoto Configurado

Ya tienes configurado el acceso remoto para "%" en Hostinger, lo que permite conexiones desde cualquier IP.

## 🔍 Encontrar el Host de MySQL

Para conectar desde Render, necesitas el **host externo** de MySQL de Hostinger. Puedes encontrarlo de estas formas:

### Opción 1: Panel de Control de Hostinger

1. Accede al panel de control de Hostinger (hPanel)
2. Ve a **"Bases de datos"** o **"MySQL Databases"**
3. Busca la información de conexión de tu base de datos
4. Busca el campo **"Host"** o **"Server"**
   - Puede ser algo como: `mysql.hostinger.com` o `185.xxx.xxx.xxx`
   - **NO uses** `localhost` para conexiones remotas

### Opción 2: phpMyAdmin

1. Accede a phpMyAdmin desde el panel de Hostinger
2. En la parte superior, busca la información de conexión
3. El host generalmente aparece como el servidor MySQL

### Opción 3: Contactar con Soporte

Si no encuentras el host, contacta con el soporte de Hostinger y pregunta:
- "¿Cuál es el host externo para conexiones remotas a MySQL?"
- "¿Cuál es la dirección del servidor MySQL para acceso remoto?"

## 📝 Configuración para Render

Una vez que tengas el host, configura en Render:

### Usando DATABASE_URL:
```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@TU_HOST_HOSTINGER:3306/u729095573_locationapp
```

**Ejemplo** (reemplaza con tu host real):
```
DATABASE_URL=mysql://u729095573_locationapp:Dsp_76499486@mysql.hostinger.com:3306/u729095573_locationapp
```

### O usando variables individuales:
```
DB_NAME=u729095573_locationapp
DB_USER=u729095573_locationapp
DB_PASSWORD=Dsp_76499486
DB_HOST=TU_HOST_HOSTINGER
DB_PORT=3306
```

## ⚠️ Notas Importantes

1. **Puerto**: Generalmente es `3306` para MySQL
2. **Firewall**: Asegúrate de que Hostinger permita conexiones en el puerto 3306
3. **SSL**: Algunos hosts requieren SSL, si es así, contacta con Hostinger para obtener el certificado

## 🧪 Probar la Conexión

Una vez configurado en Render, verifica los logs del servicio para confirmar que la conexión funciona:
- ✅ Si ves: "Connected to MySQL database" → Todo está bien
- ❌ Si ves errores de conexión → Verifica el host y las credenciales

