#!/bin/sh
set -e

# Sinkron skema ke Postgres yang sudah ada sebelum app start.
# Aman dijalankan berulang: hanya menerapkan migrasi yang belum ada.
echo "==> Running prisma migrate deploy..."
# Prisma CLI terisolasi di migrate-tools/ (lengkap dgn deps: effect, @prisma/config,
# wasm, schema engine). Dipanggil dari sana agar seluruh dependency-nya ketemu.
node migrate-tools/node_modules/prisma/build/index.js migrate deploy

echo "==> Starting app..."
exec "$@"
