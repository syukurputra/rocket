#!/bin/sh
set -e

# Auto-migrate saat startup. Prisma CLI terisolasi di migrate-tools/ (lengkap
# dgn deps: effect, @prisma/config, wasm, schema engine).
#
# DIBUAT NON-FATAL: kalau migrate gagal (mis. DB sementara tak reachable, atau
# P3005 "schema not empty" karena DB lama belum di-baseline), app TETAP jalan —
# tidak crash-loop. Warning tetap ditampilkan supaya kelihatan di log.
echo "==> Running prisma migrate deploy..."
if node migrate-tools/node_modules/prisma/build/index.js migrate deploy; then
  echo "==> Migrate OK."
else
  echo "!! WARNING: 'migrate deploy' GAGAL (lihat error di atas). App tetap dijalankan."
  echo "!! Kalau errornya P3005 (schema not empty): baseline DB SEKALI supaya migrasi"
  echo "!! yang sudah ada ditandai 'applied'. Lihat DEPLOYMENT.md bagian baseline."
fi

echo "==> Starting app..."
exec "$@"
