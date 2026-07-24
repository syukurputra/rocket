# Deployment — Bantu Sewa (Nevacloud, Docker via GitHub Actions)

Deploy branch **`production`** ke server **Nevacloud** dengan alur CI/CD:
**GitHub build image → push ke GHCR → server pull & run.**

- **App:** Next.js 15 + Prisma (PostgreSQL), `output: 'standalone'`
- **Build:** dilakukan di **GitHub Actions** (RAM besar) — server **tidak pernah build**
- **Kenapa begini:** server 1 GB **tidak kuat** `next build` (OOM → `.next/standalone` gagal terbentuk). Build dipindah ke GitHub, server cukup menjalankan image jadi.
- **Database:** PostgreSQL yang **sudah ada** (eksternal) — di-migrate otomatis saat container start (`prisma migrate deploy`).
- **Storage:** Nevacloud Object Storage (`s3.nevaobjects.id`).

```
git push ke branch production
        │
        ▼
GitHub Actions (runner RAM besar, tidak OOM)
  1. docker build  →  2. push ke ghcr.io/syukurputra/bantusewa:production
        │
        ▼
SSH ke server Nevacloud  →  docker compose pull && up -d
        │
        ▼
Server 1 GB hanya MENJALANKAN image (tidak build) ✅
```

---

## File deployment

| File | Fungsi |
|------|--------|
| `.github/workflows/deploy-nevacloud.yml` | Build image di GitHub → push GHCR → SSH deploy |
| `Dockerfile` | Multi-stage (deps → builder → runner), Debian slim + OpenSSL, output standalone, build-args untuk env build |
| `docker-entrypoint.sh` | `prisma migrate deploy` lalu start app |
| `docker-compose.yml` | Pakai `image:` GHCR — server **pull**, bukan build |
| `.dockerignore` | Exclude `node_modules`, `.env`, `.git`, `.next`, dll |
| `.env.production.example` | Template env produksi |

> `docker-entrypoint.sh` **harus** ber-line-ending **LF** (bukan CRLF) agar jalan di Linux.

---

## Setup awal (sekali saja)

### 1. GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi | Untuk |
|--------|-----|-------|
| `SSH_HOST` | IP server Nevacloud | SSH deploy |
| `SSH_USER` | `root` (atau user deploy) | SSH deploy |
| `SSH_KEY` | **private key** SSH ke server (isi lengkap, termasuk header/footer) | SSH deploy |
| `SSH_PORT` | opsional, default `22` | SSH deploy |
| `GHCR_PAT` | Personal Access Token scope **`read:packages`** | server pull image |
| `PROD_DATABASE_URL` | connection string Postgres (pooled) | build-time |
| `PROD_DIRECT_URL` | connection string Postgres (direct) | build-time |
| `PROD_SITE_URL` | `https://domain-produksi-kamu.com` | build-time |

> `PROD_*` biasanya **sudah ada** dari workflow lama — cukup dipakai ulang.
> `GHCR_PAT` dibuat di https://github.com/settings/tokens (classic, centang `read:packages`).

### 2. Provisi server Nevacloud

Dashboard → **Apps → DOCKER** → buat Cloud Server (1 GB cukup untuk runtime). Catat **IP** & pasang **SSH key**.

### 3. Siapkan server

```bash
ssh root@IP_SERVER

# Clone repo (untuk docker-compose.yml + Dockerfile + prisma)
git clone -b production https://github.com/syukurputra/rocket.git
cd rocket

# Buat env produksi, isi nilainya
cp .env.production.example .env.production
nano .env.production        # DATABASE_URL, JWT, S3, iPaymu, dll

# Test login GHCR (pakai PAT read:packages)
echo "GHCR_PAT_KAMU" | docker login ghcr.io -u syukurputra --password-stdin
```

---

## Deploy

Tiap **push ke branch `production`** otomatis build + deploy. Trigger manual juga bisa via tab **Actions → Build & Deploy to Nevacloud → Run workflow**.

```powershell
# dari lokal
git add -A
git commit -m "deploy: <deskripsi perubahan>"
git push origin production
```

Pantau progres di tab **Actions**. Step-nya:
1. Build image di GitHub → push `ghcr.io/syukurputra/bantusewa:production`
2. SSH ke server → `docker compose pull && docker compose up -d`
3. Container start → `prisma migrate deploy` → app listen `:3000`

---

## Domain + HTTPS

App listen di `:3000`. Pasang **Nginx reverse proxy** + Certbot (atau **Load Balancer** Nevacloud):

```nginx
server {
    server_name domain-produksi-kamu.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo certbot --nginx -d domain-produksi-kamu.com
```

Setelah domain aktif, set di `.env.production` lalu redeploy:
- `NEXT_PUBLIC_SITE_URL=https://domain-produksi-kamu.com`
- `GOOGLE_REDIRECT_URI=https://domain-produksi-kamu.com/api/auth/google/callback`

---

## Operasional

```bash
# di server
docker compose logs -f app          # lihat log (cek migrate deploy + listen :3000)
docker compose ps                   # status container
docker compose restart app          # restart
docker compose pull && docker compose up -d   # deploy manual image terbaru

# migrasi Prisma jalan otomatis tiap start; manual bila perlu:
docker compose exec app node_modules/.bin/prisma migrate deploy
```

### Rollback

Tiap build juga di-tag dengan commit SHA. Untuk balik ke versi lama:

```bash
# di server, edit image tag di docker-compose.yml ke SHA tertentu, atau:
docker pull ghcr.io/syukurputra/bantusewa:<SHA_LAMA>
docker tag ghcr.io/syukurputra/bantusewa:<SHA_LAMA> ghcr.io/syukurputra/bantusewa:production
docker compose up -d
```

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Build gagal, `.next/standalone` tidak ada | `next build` OOM (RAM kurang) | Build sudah di GitHub (RAM besar) — pastikan tidak build di server 1 GB |
| `docker compose pull` → `denied` / `unauthorized` | Server belum login GHCR | `docker login ghcr.io` pakai `GHCR_PAT` (scope `read:packages`) |
| Actions gagal di step SSH | Secret `SSH_*` salah / key tidak cocok | Cek `SSH_HOST/USER/KEY`, pastikan public key ada di `~/.ssh/authorized_keys` server |
| App start tapi gambar S3 ke-blok | `next.config.mjs` tidak ke-load saat build | Pastikan config `next.config.mjs` ada & `output:'standalone'` + `images.remotePatterns` terpasang |
| `migrate deploy` gagal | Postgres tidak reachable dari server | Whitelist IP server / cek `DATABASE_URL` & `DIRECT_URL` |

---

## Catatan penting

- **Config Next pakai `next.config.mjs`** (bukan `.ts`). Format `.mjs` di-load Node secara native — hindari ambiguitas loader.
- **Server tidak pernah `docker compose build`** — selalu `pull`. Kalau butuh build lokal untuk debug, `docker compose build` tetap bisa (ada `build:` di compose) tapi butuh RAM ≥ 2 GB.
- **Jangan commit `.env.production`** — hanya ada di server.

---

## Checklist go-live

- [ ] Semua GitHub Secrets terisi (`SSH_*`, `GHCR_PAT`, `PROD_*`)
- [ ] Workflow Koyeb lama sudah dihapus (`deploy-production.yml`, `deploy-development.yml`)
- [ ] Server: repo ter-clone, `.env.production` terisi, sudah `docker login ghcr.io`
- [ ] Postgres reachable dari IP server (whitelist / VPC)
- [ ] Push ke `production` → Actions hijau → container jalan
- [ ] Domain + SSL aktif, `NEXT_PUBLIC_SITE_URL` & `GOOGLE_REDIRECT_URI` = domain produksi
