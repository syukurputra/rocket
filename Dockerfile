# syntax=docker/dockerfile:1

# ---- Base ---------------------------------------------------------------
# Debian slim (glibc) + OpenSSL → paling stabil untuk Prisma.
FROM node:20-slim AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies -------------------------------------------------------
# Install semua dependency (termasuk devDeps: tsx, prisma, iconify, next).
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# `prisma generate` dipanggil oleh postinstall — schema harus sudah ada.
RUN npm ci

# ---- Builder ------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# build = prisma generate && build:icons && next build (output: standalone)
RUN npm run build

# Guard: pastikan output standalone benar-benar terbentuk sebelum lanjut.
RUN test -f .next/standalone/server.js \
  || (echo "!! .next/standalone/server.js TIDAK ADA — next.config tidak diterapkan saat build" && ls -la .next && exit 1)

# ---- Runner -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Output standalone Next.js (server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma CLI + engine + schema → untuk `prisma migrate deploy` saat startup.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
