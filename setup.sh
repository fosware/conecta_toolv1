#!/bin/bash

echo "🚀 Iniciando setup del proyecto..."

echo "📦 Levantando contenedores Docker..."
docker-compose up -d

echo "⌛ Esperando 5 segundos para que la base de datos esté lista..."
sleep 5

echo "📥 Instalando dependencias..."
npm install --legacy-peer-deps

echo "🔧 Generando cliente Prisma..."
npx prisma generate

echo "🗄️ Aplicando migraciones..."
npx prisma migrate deploy

echo "🌱 Cargando semillas..."
npm run prisma:seed

echo "✨ Setup completado! Puedes iniciar el servidor con: npm run dev"
