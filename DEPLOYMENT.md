# Deployment — Bantu Sewa (Koyeb + Nevacloud, satu branch)

**Satu branch (`development` atau `production` — keduanya identik) memicu DUA deploy sekaligus**:
- **Koyeb** — build via buildpack (`koyeb.yml`), environment development
- **Nevacloud** — GitHub Actions build image Docker → push ke GHCR → server pull & run

> Kedua branch sengaja dijaga **selalu identik** (kode sama persis) sejak unifikasi.
> Jangan lagi memisahkan konten branch — cukup push, kedua workflow akan trigger.

- **App:** Next.js 15 + Prisma (PostgreSQL), `output: 'standalone'`
- **Build Nevacloud:** di **GitHub Actions** (RAM besar) — server Nevacloud **tidak pernah build** (RAM 1 GB tidak kuat `next build`)
- **Registry:** GitHub Container Registry (`ghcr.io/syukurputra/bantusewa`)
- **Database:** PostgreSQL **eksternal** yang sudah ada per environment (DEV_* vs PROD_* secrets)
- **Storage:** Nevacloud Object Storage (`s3.nevaobjects.id`)

```
push ke development ATAU production (kontennya sama)
        │
        ├──► deploy-development.yml → Koyeb (buildpack, env development)
        │
        └──► deploy-nevacloud.yml (environment: production)
                1. docker build → push ghcr.io/syukurputra/bantusewa:production
                2. SSH ke server → docker compose pull && up -d
                        │
                        ▼
              Server Nevacloud 1 GB: hanya MENJALANKAN image ✅
```

> ⚠️ **Insiden 2026-07-25**: kedua branch sempat ter-merge tak sengaja lewat `git pull`
> manual, yang menghapus semua file Docker dari `production`. Sudah dipulihkan dan
> di-desain ulang jadi strategi satu-branch permanen supaya insiden serupa tidak terulang.
> **Jangan** `git merge`/`git pull` antar branch `development`↔`production` lagi — cukup
> commit & push ke salah satu, lalu (kalau masih pakai 2 nama branch) fast-forward yang
> lain ke commit yang sama.

---

## File deployment

| File | Fungsi |
|------|--------|
| `.github/workflows/deploy-nevacloud.yml` | Build → push GHCR → SSH deploy (trigger: push ke `development` ATAU `production`) |
| `Dockerfile` | Multi-stage, Debian slim + OpenSSL, output standalone, build-args env |
| `docker-entrypoint.sh` | `prisma migrate deploy` lalu start app (LF line-ending) |
| `docker-compose.yml` | Pakai `image:` GHCR — server **pull**, bukan build |
| `.dockerignore` | Exclude `node_modules`, `.env`, `.git`, `.next`, dll |
| `.env.production.example` | Template env produksi |

---

## Setup awal (sekali saja)

### 1. Environment secrets di GitHub

Repo → **Settings → Environments → `production`** → **Environment secrets**.
(Wajib environment `production`, karena workflow pakai `environment: production`.)

| Secret | Isi |
|--------|-----|
| `SSH_HOST` | IP server Nevacloud |
| `SSH_USER` | `root` (harus cocok dgn pemilik `authorized_keys`) |
| `SSH_KEY` | **private key** SSH (utuh, `-----BEGIN…-----END-----`) |
| `SSH_PORT` | opsional, default `22` |
| `GHCR_PAT` | PAT **classic** scope **`read:packages`** (server pull image) |
| `PROD_DATABASE_URL` | Postgres URL (build-time) |
| `PROD_DIRECT_URL` | Postgres URL direct (build-time) |
| `PROD_SITE_URL` | `https://domain-produksi-kamu.com` (build-time) |

### 2. SSH key untuk deploy

Di server (sebagai user `SSH_USER`, mis. `root`):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gh_deploy -N ""

# daftarkan PUBLIC key ke server ini
cat ~/.ssh/gh_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# tampilkan PRIVATE key → copy UTUH ke secret SSH_KEY
cat ~/.ssh/gh_deploy
```

> `SSH_KEY` = isi file **`gh_deploy`** (private), BUKAN `gh_deploy.pub`.
> Kalau `SSH_USER=root`, pastikan `PermitRootLogin` di `/etc/ssh/sshd_config` bukan `no`.

### 3. Provisi & siapkan server

Nevacloud → **Apps → DOCKER** → buat Cloud Server (1 GB cukup untuk runtime).

```bash
ssh root@IP_SERVER
git clone -b production https://github.com/syukurputra/rocket.git
cd rocket

cp .env.production.example .env.production
nano .env.production        # isi DATABASE_URL, JWT, S3, iPaymu, dll

# login GHCR (biar bisa pull image private)
echo "GHCR_PAT_KAMU" | docker login ghcr.io -u syukurputra --password-stdin
```

---

## Deploy

Tiap **push ke `development` atau `production`** = auto build + deploy ke Nevacloud (Koyeb juga ikut ter-trigger dari `development`). Manual: **Actions → Build & Deploy to Nevacloud → Run workflow**.

```powershell
git add -A
git commit -m "deploy: <deskripsi>"
git push origin production
```

Pantau tab **Actions** — semua step harus hijau (Build & Push image → Deploy ke server (SSH)).

---

## Verifikasi di server

```bash
cd ~/rocket
docker compose ps                    # service app harus "Up", port 0.0.0.0:3000->3000
docker compose logs --tail=80 app    # cek migrate + app ready
```

Log yang diharapkan:
```
==> Running prisma migrate deploy...
No pending migrations to apply.        (atau: Applied migration ...)
==> Starting app...
▲ Next.js 15.1.2
- Local:  http://localhost:3000
✓ Ready in ...
```

Tes HTTP:
```bash
curl -I http://localhost:3000
curl http://localhost:3000/api/health
```

---

## Domain + HTTPS

App listen di `:3000`. Pasang **Nginx reverse proxy** + Certbot (atau **Load Balancer** Nevacloud):

```nginx
server {
    server_name domain-produksi-kamu.com;

    # Upload gambar (banner promo, foto aset, bukti transfer) sampai 5MB.
    # Default Nginx cuma 1MB → upload gagal dengan 413 Request Entity Too Large.
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Token JWT + menus JSON bikin header redirect besar → default buffer jebol (502)
        proxy_buffer_size       64k;
        proxy_buffers         8 64k;
        proxy_busy_buffers_size 128k;
    }
}
```

Setelah diubah:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

```bash
sudo certbot --nginx -d domain-produksi-kamu.com
```

Lalu update `.env.production` + redeploy:
- `NEXT_PUBLIC_SITE_URL=https://domain-produksi-kamu.com`
- `GOOGLE_REDIRECT_URI=https://domain-produksi-kamu.com/api/auth/google/callback`

---

## Operasional

```bash
docker compose ps
docker compose logs -f app
docker compose restart app                           # restart proses saja (env TIDAK dibaca ulang)
docker compose pull && docker compose up -d          # deploy manual image terbaru
docker compose exec app node node_modules/prisma/build/index.js migrate deploy   # migrate manual
```

### Setelah mengubah `.env.production`

`env_file` hanya diproses saat container **dibuat**, jadi `restart` tidak cukup —
container harus dibuat ulang:

```bash
docker compose up -d --force-recreate
docker compose exec app printenv | grep NEXT_PUBLIC_APP_URL   # pastikan nilainya masuk
```

Variabel `NEXT_PUBLIC_*` yang dipakai di **komponen client** dibakar saat build,
jadi perubahannya butuh build ulang lewat GitHub Actions, bukan sekadar recreate.
Yang dipakai di sisi server (route handler, sitemap, metadata) cukup recreate.

### Rollback (tiap build juga di-tag SHA)
```bash
docker pull ghcr.io/syukurputra/bantusewa:<SHA_LAMA>
docker tag ghcr.io/syukurputra/bantusewa:<SHA_LAMA> ghcr.io/syukurputra/bantusewa:production
docker compose up -d
```

---

## Troubleshooting (masalah nyata yang pernah terjadi)

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Build gagal: `Failed to collect page data for /api/...`, `Missing MAIL_SERVER...` | Modul di-import validasi env di **level module** → throw saat `next build` | Jadikan **lazy** (validasi env saat runtime, bukan import). Cth: `getTransporter()` di `src/libs/mailer.ts` |
| Build gagal, `.next/standalone` tak ada | `next build` berhenti (mis. error di atas), atau OOM di server | Build sudah di GitHub (RAM besar); pastikan tidak build di server 1 GB |
| Container crash-loop: `ENOENT ... prisma_schema_build_bg.wasm` | Prisma dipanggil via symlink `.bin/prisma` yang ke-dereference → path wasm salah | Panggil `node node_modules/prisma/build/index.js migrate deploy` |
| Actions SSH: `missing server host` | Secret disimpan sbg **Environment secret** tapi job tak set environment | Tambah `environment: production` di job |
| Actions SSH: `ParsePrivateKey: no key found` | `SSH_KEY` berisi public key / kepotong | Paste **private key** (`gh_deploy`) utuh dgn BEGIN/END |
| Upload gambar gagal: `413 Request Entity Too Large` | Nginx host batasi body 1MB (default), app izinkan 5MB. **Bukan** setelan Docker | `client_max_body_size 10M;` di server block Nginx, lalu `nginx -t && systemctl reload nginx` |
| `502 Bad Gateway` saat login/redirect | Header respons besar (JWT + menus JSON) melebihi proxy buffer default | `proxy_buffer_size 64k; proxy_buffers 8 64k; proxy_busy_buffers_size 128k;` di block `location /` |
| `docker login`/pull: `denied: denied` | `GHCR_PAT` kurang scope | PAT classic scope `read:packages` |
| Migrate: `Can't reach database server` | DB tak reachable dari server | Cek `DATABASE_URL`/`DIRECT_URL`, whitelist IP server di Postgres |
| `P2022: column ... does not exist` (mis. saat login) | Field baru ditambah ke `schema.prisma` **tanpa** membuat file migration di `prisma/migrations/` — `migrate deploy` tak punya apa pun untuk diterapkan | Selalu buat migration resmi (folder + `migration.sql`) untuk tiap perubahan schema, jangan cuma edit `schema.prisma` |
| 2 branch ter-merge tak sengaja (`git pull` manual antar branch) → file Docker hilang | Development tak pakai `prisma migrate deploy` sama sekali (Koyeb cuma buildpack); merge manual menyatukan history dan menghapus file yang cuma ada di satu sisi | Jangan `git merge`/`pull` silang antar branch; kalau memang mau disatukan, lakukan sekali secara sengaja (lihat catatan insiden di atas) |

---

## Catatan penting

- **Config Next = `next.config.mjs`** (bukan `.ts`) — format ESM di-load native, hindari ambiguitas loader.
- **Server tidak pernah `docker compose build`** — selalu `pull`. Build butuh RAM ≥ 2 GB (dilakukan GitHub).
- **`docker-entrypoint.sh` harus LF** (bukan CRLF) agar jalan di Linux.
- **Jangan commit `.env.production`** — hanya ada di server. (Disarankan tambahkan ke `.gitignore`.)

---

## Checklist go-live

- [ ] Environment `production` berisi semua secret (`SSH_*`, `GHCR_PAT`, `PROD_*`)
- [ ] SSH key: private → `SSH_KEY`, public → `authorized_keys` server
- [ ] Server: repo ter-clone, `.env.production` terisi, sudah `docker login ghcr.io`
- [ ] Postgres reachable dari IP server (whitelist / VPC)
- [ ] Push ke `production` → Actions semua hijau
- [ ] `docker compose ps` = Up, `logs` = migrate sukses + Ready, `curl` = 200
- [ ] Domain + SSL aktif, `NEXT_PUBLIC_SITE_URL` & `GOOGLE_REDIRECT_URI` = domain produksi
