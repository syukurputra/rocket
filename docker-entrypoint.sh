#!/bin/sh
set -e

# Sinkron skema ke Postgres yang sudah ada sebelum app start.
# Aman dijalankan berulang: hanya menerapkan migrasi yang belum ada.
echo "==> Running prisma migrate deploy..."
# Panggil Prisma dari package-nya langsung (bukan symlink .bin/prisma yang
# ke-dereference), agar asset pendukung (mis. *.wasm) di prisma/build/ ketemu.
node node_modules/prisma/build/index.js migrate deploy

echo "==> Starting app..."
exec "$@"
