#!/bin/sh
set -e

# Sinkron skema ke Postgres yang sudah ada sebelum app start.
# Aman dijalankan berulang: hanya menerapkan migrasi yang belum ada.
echo "==> Running prisma migrate deploy..."
node_modules/.bin/prisma migrate deploy

echo "==> Starting app..."
exec "$@"
