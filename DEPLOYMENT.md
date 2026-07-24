# Deployment — Bantu Sewa (Nevacloud, Docker)

Panduan deploy branch **`production`** ke **Nevacloud** menggunakan Docker.

- **App:** Next.js 15 + Prisma (PostgreSQL), `output: 'standalone'`
- **Metode:** Docker (App "DOCKER" di Nevacloud = Cloud Server + Docker preinstalled)
- **Database:** PostgreSQL yang **sudah ada** (Nevacloud managed / server lain) — hanya perlu `prisma migrate deploy`
- **Storage:** Nevacloud Object Storage (`s3.nevaobjects.id`)

> ⚠️ Nevacloud **Apps bukan git-push PaaS** seperti Koyeb. Setiap App memprovisi sebuah Cloud Server (VPS). Deploy = provisi server → tarik branch `production` dari GitHub → build → jalankan.

---

## File deployment

| File | Fungsi |
|------|--------|
| `Dockerfile` | Multi-stage (deps → builder → runner), Debian slim + OpenSSL, output standalone |
| `docker-entrypoint.sh` | Jalankan `prisma migrate deploy` lalu start app |
| `docker-compose.yml` | Service app, connect ke Postgres eksternal via env |
| `.dockerignore` | Exclude `node_modules`, `.env`, `.git`, dll |
| `.env.production.example` | Template semua env produksi |

> `docker-entrypoint.sh` **harus** ber-line-ending **LF** (bukan CRLF) agar jalan di Linux.

---

## 1. Commit file Docker ke branch `production`

Server meng-`clone` dari GitHub, jadi semua file deploy harus ada di branch `production`.

```powershell
cd d:\Code\Koyeb\rocket
git checkout production
git add Dockerfile docker-entrypoint.sh docker-compose.yml .dockerignore .env.production.example DEPLOYMENT.md
git commit -m "chore: add Docker deploy config for Nevacloud"
git push origin production
```

---

## 2. Provisi server di Nevacloud

Dashboard → **Apps** → **DOCKER** → buat Cloud Server. Catat **IP** & **SSH key**.

**Ukuran RAM menentukan cara build** (lihat bagian [Catatan RAM](#catatan-ram-penting)):

| RAM server | Cara build |
|-----------|------------|
| ≥ 2 GB | Build langsung di server (`docker compose up -d --build`) |
| **1 GB** | **Jangan build di server** — pakai Opsi A (registry) atau Opsi B (swap) |

---

## 3. Deploy di server (SSH)

### 3a. Kalau server ≥ 2 GB (build di server)

```bash
ssh root@IP_SERVER
git clone -b production https://github.com/syukurputra/rocket.git
cd rocket

# Buat env produksi dari template, lalu isi nilainya
cp .env.production.example .env.production
nano .env.production          # isi DATABASE_URL, JWT, S3, iPaymu, dll

# Build & jalankan
docker compose up -d --build
docker compose logs -f app    # pastikan "migrate deploy" sukses & app listen :3000
```

### 3b. Kalau server 1 GB → lihat [Catatan RAM](#catatan-ram-penting)

---

## 4. Domain + HTTPS

App listen di `:3000`. Pasang **Nginx reverse proxy** + Certbot (atau **Load Balancer** Nevacloud) untuk arahkan domain ke port 3000 dengan SSL.

Contoh Nginx:

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

Setelah domain aktif, update di `.env.production` lalu `docker compose up -d`:
- `NEXT_PUBLIC_SITE_URL=https://domain-produksi-kamu.com`
- `GOOGLE_REDIRECT_URI=https://domain-produksi-kamu.com/api/auth/google/callback`

---

## Catatan RAM (PENTING)

RAM **1 GB tidak cukup untuk `next build`** — app ini berat (MUI, ApexCharts, FullCalendar, swagger-ui). Build gampang kena **OOM** (proses ke-kill di tengah). Pilih salah satu:

### Opsi A — Build di lokal, server cuma *pull & run* (paling aman) ✅

Server 1 GB tidak pernah build; runtime standalone ringan & muat.

```powershell
# --- di lokal (Docker Desktop) ---
cd d:\Code\Koyeb\rocket
echo $env:GHCR_PAT | docker login ghcr.io -u syukurputra --password-stdin   # PAT: write:packages
docker build -t ghcr.io/syukurputra/bantusewa:production .
docker push ghcr.io/syukurputra/bantusewa:production
```

Di server, ubah `docker-compose.yml` → pakai `image:` (tanpa `build:`):

```yaml
services:
  app:
    image: ghcr.io/syukurputra/bantusewa:production
    container_name: bantusewa
    restart: unless-stopped
    env_file: [.env.production]
    ports: ["3000:3000"]
```

```bash
# --- di server ---
docker login ghcr.io -u syukurputra          # PAT: read:packages
cp .env.production.example .env.production && nano .env.production
docker compose pull && docker compose up -d
docker compose logs -f app
```

> Update berikutnya: build+push di lokal → `docker compose pull && docker compose up -d` di server.

### Opsi B — Build di server, tambah swap 4 GB

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # permanen
free -h                                                       # cek swap aktif
```

Lalu lanjut seperti [3a](#3a-kalau-server--2-gb-build-di-server). Build lebih lambat (~5–15 mnt) tapi tidak OOM.

### Opsi C — Upgrade RAM sementara

Naikin ke 2 GB saat build pertama, turunin lagi ke 1 GB untuk runtime.

---

## Operasional harian

```bash
docker compose logs -f app          # lihat log
docker compose restart app          # restart
docker compose down                 # stop
git pull && docker compose up -d --build   # deploy versi baru (server ≥2GB)

# Migrasi Prisma dijalankan otomatis oleh entrypoint tiap start.
# Jalankan manual bila perlu:
docker compose exec app node_modules/.bin/prisma migrate deploy
```

---

## Checklist sebelum go-live

- [ ] File deploy sudah di-commit & push ke branch `production`
- [ ] Postgres bisa diakses dari IP server baru (whitelist / VPC)
- [ ] `.env.production` terisi lengkap di server (JANGAN di-commit)
- [ ] `prisma migrate deploy` sukses (cek log entrypoint)
- [ ] Domain diarahkan ke server + SSL aktif
- [ ] `NEXT_PUBLIC_SITE_URL` & `GOOGLE_REDIRECT_URI` = domain produksi
