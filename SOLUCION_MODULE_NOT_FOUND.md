# 🔧 Solución: Error "Cannot find package 'express'"

## ❌ El Problema

Render no está instalando las dependencias correctamente. Esto puede deberse a:
1. El Build Command no se está ejecutando correctamente
2. El directorio de trabajo no es el correcto
3. Las dependencias no están en el package.json correcto

## ✅ Solución: Corregir Build Command

### Opción 1: Build Command Mejorado (Recomendado)

En Render, cambia el **Build Command** a:

```bash
cd backend && npm ci
```

O si eso no funciona:

```bash
cd backend && npm install --production=false
```

### Opción 2: Build Command Alternativo

Si la opción 1 no funciona, prueba:

```bash
npm install --prefix backend
```

### Opción 3: Verificar Estructura

Asegúrate de que el **Root Directory** en Render esté vacío o sea `/` (raíz del repositorio).

## 🔍 Verificar en Render

1. Ve a tu servicio en Render
2. Click en **"Settings"**
3. Busca **"Build & Deploy"**
4. Verifica:
   - **Root Directory**: Debe estar vacío o ser `/`
   - **Build Command**: `cd backend && npm install` o `cd backend && npm ci`
   - **Start Command**: `cd backend && npm start`

## 📝 Configuración Correcta

**Build Command:**
```
cd backend && npm install
```

**Start Command:**
```
cd backend && npm start
```

**Root Directory:**
```
(empty or /)
```

## 🧪 Verificar Logs

Después de cambiar el Build Command:

1. Ve a **"Logs"** en Render
2. Deberías ver:
   - ✅ `npm install` ejecutándose
   - ✅ `added X packages`
   - ✅ `npm start` ejecutándose
   - ✅ `Server running on port XXXX`

Si ves errores de `npm install`, el problema está en el Build Command.

## ⚠️ Si Persiste el Error

1. Verifica que `backend/package.json` tenga todas las dependencias
2. Verifica que el archivo esté en GitHub
3. Intenta usar `npm ci` en lugar de `npm install` (más rápido y confiable)

