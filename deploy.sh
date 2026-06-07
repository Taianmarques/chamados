#!/bin/bash
set -e

echo "==> Descartando alterações locais..."
git checkout src/app/login/page.tsx

echo "==> Atualizando código do GitHub..."
git pull origin main

echo "==> Instalando dependências..."
npm install

echo "==> Aplicando migrações do banco..."
npx prisma migrate deploy

echo "==> Gerando cliente Prisma..."
npx prisma generate

echo "==> Buildando o projeto..."
npm run build

echo "==> Reiniciando processo pm2..."
pm2 restart chamados

echo "✓ Deploy concluído!"
