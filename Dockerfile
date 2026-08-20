# Dockerfile para Web e Worker

# --- Stage 1: Build Web App (TanStack Start) ---
FROM node:20-slim AS web-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Build Worker ---
FROM node:20-slim AS worker-builder
WORKDIR /app/worker
COPY worker/package*.json ./
RUN npm install
COPY worker/ ./
COPY src/lib/email-logic/ ../src/lib/email-logic/
RUN npm run build

# --- Stage 3: Final Production Image ---
FROM node:20-slim AS production
WORKDIR /app

# Instalar utilitários de rede para diagnóstico na VPS
RUN apt-get update && apt-get install -y iputils-ping curl netcat-traditional dnsutils && rm -rf /var/lib/apt/lists/*

# Copiar Web App
COPY --from=web-builder /app/.output ./.output
COPY --from=web-builder /app/package.json ./package.json

# Copiar Worker
WORKDIR /app/worker
COPY --from=worker-builder /app/worker/dist ./dist
COPY --from=worker-builder /app/worker/package*.json ./

# Script de entrada para decidir o que rodar
WORKDIR /app
COPY <<EOF ./entrypoint.sh
#!/bin/sh
if [ "$MODE" = "worker" ]; then
  cd /app/worker && npm start
else
  npm start
fi
EOF
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
