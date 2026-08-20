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
# O worker depende da lógica compartilhada
COPY src/lib/email-logic/ ../src/lib/email-logic/
RUN npm run build

# --- Stage 3: Base for Production (Shared Utilities) ---
FROM node:20-slim AS production-base
RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    netcat-traditional \
    dnsutils \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# --- Stage 4: Web Production Target ---
FROM production-base AS web-production
WORKDIR /app
COPY --from=web-builder /app/.output ./.output
COPY --from=web-builder /app/package.json ./package.json
# TanStack Start needs node_modules in production for some setups, 
# or at least the ones required by the generated output.
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "start"]

# --- Stage 5: Worker Production Target ---
FROM production-base AS worker-production
WORKDIR /app/worker
COPY --from=worker-builder /app/worker/dist ./dist
COPY --from=worker-builder /app/worker/package*.json ./
# Instalar dependências de produção do worker
RUN npm install --omit=dev
CMD ["npm", "start"]
