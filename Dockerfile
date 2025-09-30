# Dockerfile para Next.js no Easypanel
FROM node:20-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./
RUN npm ci

# Rebuild o código-fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilitar telemetria do Next.js durante o build
ENV NEXT_TELEMETRY_DISABLED=1

# Variáveis de ambiente necessárias para o build do Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build da aplicação
RUN npm run build

# Imagem de produção, copiar todos os arquivos e rodar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos estáticos do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]