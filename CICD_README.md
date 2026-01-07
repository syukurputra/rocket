# CI/CD Configuration - Branch-Based Deployment

## Quick Start

### Automatic Deployment

Push ke branch yang sesuai untuk auto-deploy:

```bash
# Development
git push origin development  # → Auto-deploy ke development environment

# Production
git push origin main  # → Auto-deploy ke production environment
```

## File Structure

```
.
├── .github/workflows/
│   ├── deploy-development.yml    # GitHub Actions untuk development
│   └── deploy-production.yml     # GitHub Actions untuk production
├── scripts/
│   ├── switch-env.sh            # Switch env (Linux/Mac)
│   ├── switch-env.bat           # Switch env (Windows)
│   ├── prebuild.sh              # Pre-build script (Linux/Mac)
│   └── prebuild.bat             # Pre-build script (Windows)
├── .env.development             # Development config (committed)
├── .env.production              # Production config (committed)
├── .env.example                 # Template untuk new developers
├── .env                         # Active env (git-ignored)
└── koyeb.yml                    # Koyeb deployment config
```

## Setup GitHub Secrets

**Repository Settings → Secrets → Actions**

### Development (prefix: `DEV_`)

- `DEV_DATABASE_URL`
- `DEV_DIRECT_URL`
- `DEV_JWT_SECRET`
- `DEV_JWT_REFRESH_SECRET`
- `DEV_SITE_URL`
- `DEV_GOOGLE_CLIENT_ID`
- `DEV_GOOGLE_CLIENT_SECRET`
- `DEV_GOOGLE_REDIRECT_URI`

### Production (prefix: `PROD_`)

- `PROD_DATABASE_URL`
- `PROD_DIRECT_URL`
- `PROD_JWT_SECRET`
- `PROD_JWT_REFRESH_SECRET`
- `PROD_SITE_URL`
- `PROD_GOOGLE_CLIENT_ID`
- `PROD_GOOGLE_CLIENT_SECRET`
- `PROD_GOOGLE_REDIRECT_URI`

### Shared

- `MAIL_SERVER`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

## Koyeb Setup

### Create Two Services:

**1. Development Service**

- Name: `rocket-dev`
- Branch: `development`
- Build: `npm run build:dev`
- Start: `npm start`

**2. Production Service**

- Name: `rocket-prod`
- Branch: `main`
- Build: `npm run build:prod`
- Start: `npm start`

## NPM Scripts

```bash
npm run build:dev      # Build dengan development env
npm run build:prod     # Build dengan production env
npm run deploy:dev     # Build + start development
npm run deploy:prod    # Build + start production
```

## Health Check

```bash
curl https://your-app.koyeb.app/api/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-07T10:00:00.000Z",
  "environment": "production"
}
```

## Dokumentasi Lengkap

Lihat file-file berikut untuk detail lengkap:

- `ENV_SETUP.md` - Environment configuration guide
- `walkthrough.md` (artifact) - Complete CI/CD setup walkthrough

## Troubleshooting

### Build gagal di CI/CD

1. Check GitHub Actions logs
2. Verify secrets sudah di-set
3. Pastikan `.env.development` / `.env.production` ada

### Deployment gagal di Koyeb

1. Check Koyeb logs
2. Verify environment variables
3. Test database connection
4. Check build command
