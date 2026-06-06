#!/bin/bash

# ============================================================
# EDITE APENAS ESTAS 3 LINHAS ANTES DE RODAR
# ============================================================
GITHUB_URL="https://github.com/SEU_USUARIO/chamados.git"
AUTH_SECRET="gere-uma-chave-em-https://generate-secret.vercel.app/32"
IP_OU_DOMINIO="http://SEU_IP"
# ============================================================

set -e
echo ""
echo "🚀 Iniciando instalação do Sistema de Chamados..."
echo ""

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs nginx git > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1
echo "✅ Node.js e ferramentas instalados"

# Projeto
rm -rf /var/www/chamados
mkdir -p /var/www
cd /var/www
git clone "$GITHUB_URL" chamados
cd chamados
echo "✅ Projeto baixado"

# .env
cat > .env << EOF
DATABASE_URL="file:./dev.db"
AUTH_SECRET="$AUTH_SECRET"
NEXTAUTH_URL="$IP_OU_DOMINIO"
EOF
echo "✅ Configurações criadas"

# Build
npm install > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1
npm run seed > /dev/null 2>&1
npm run build > /dev/null 2>&1
mkdir -p uploads
echo "✅ Sistema construído"

# PM2
pm2 delete chamados 2>/dev/null || true
pm2 start npm --name "chamados" -- start
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root > /dev/null 2>&1
echo "✅ Sistema iniciado"

# Nginx
cat > /etc/nginx/sites-available/chamados << 'NGINX'
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/chamados /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl reload nginx
echo "✅ Nginx configurado"

echo ""
echo "============================================"
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "============================================"
echo ""
echo "Acesse: $IP_OU_DOMINIO"
echo ""
echo "Login: admin@empresa.com"
echo "Senha: admin123"
echo ""
