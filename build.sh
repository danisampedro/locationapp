#!/bin/bash

set -e  # Si algo falla, salir y no mostrar mensaje de éxito

# Script para generar el build del frontend
# Asegúrate de configurar VITE_API_URL antes de ejecutar este script

echo "🚀 Generando build del frontend..."

cd frontend

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  No se encontró el archivo .env en frontend/"
    echo "📝 Creando archivo .env de ejemplo..."
    echo "VITE_API_URL=http://localhost:3001/api" > .env
    echo "✅ Por favor, edita frontend/.env y configura VITE_API_URL con la URL de tu backend en Render"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Generar build
echo "🔨 Generando build de producción..."
if npm run build; then
    echo "✅ Build completado! La carpeta dist está lista en la raíz del proyecto."
    echo "📤 Puedes subir el contenido de la carpeta dist a Hostinger"
else
    echo "❌ Error al generar el build. Revisa los mensajes anteriores."
    exit 1
fi

