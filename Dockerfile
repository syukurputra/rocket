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

# Env yang mungkin dibutuhkan saat `next build` (mirror workflow lama).
# Nilainya di-inject sebagai build-arg dari GitHub Actions (secrets PROD_*).
# Hanya dipakai di stage builder ini — TIDAK ikut ke image runner final.
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# build = prisma generate && build:icons && next build (output: standalone)
RUN npm run build

# Guard: pastikan output standalone benar-benar terbentuk sebelum lanjut.
RUN test -f .next/standalone/server.js \
  || (echo "!! standalone tidak terbentuk — cek log next build (kemungkinan OOM/env)" && ls -la .next && exit 1)

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

# Prisma Client + query engine → untuk APP runtime (query DB).
# CATATAN: migrasi TIDAK dijalankan otomatis. Skema DB dikelola manual di luar app.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
