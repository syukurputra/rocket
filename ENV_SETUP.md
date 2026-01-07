# Environment Configuration Guide

## Overview

This project uses different environment configurations for development and production branches.

## Files Structure

- `.env` - Active environment file (git-ignored, auto-generated)
- `.env.development` - Development configuration (committed to git)
- `.env.production` - Production configuration template (committed to git)
- `.env.example` - Example template for new developers (committed to git)

## Setup Instructions

### For New Developers

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your actual values in `.env`
3. Or use the switch script (see below)

### Automatic Environment Switching

#### Windows (PowerShell/CMD)

```bash
.\scripts\switch-env.bat
```

#### Linux/Mac (Bash)

```bash
source ./scripts/switch-env.sh
```

This will automatically copy the correct `.env.*` file based on your current git branch:

- `development` branch → uses `.env.development`
- `main`/`master`/`production` branch → uses `.env.production`

## Branch-Specific Configuration

### Development Branch

- Database: `project-dev`
- Site URL: `http://localhost:3000`
- Google OAuth: Development credentials
- JWT Secrets: Development keys

### Production Branch

- Database: Production database (configure in `.env.production`)
- Site URL: Your production domain
- Google OAuth: Production credentials (create separate OAuth app)
- JWT Secrets: Strong production keys

## Important Notes

### Security

- ✅ `.env.development` and `.env.production` are committed to git
- ❌ `.env` is git-ignored (contains active secrets)
- ⚠️ **Never commit sensitive production secrets to git**
- 🔒 Use environment variables in your hosting platform for production

### Production Setup

Before deploying to production:

1. Create separate Google OAuth credentials for production domain
2. Generate strong JWT secrets (use a password generator)
3. Update `.env.production` with actual production values
4. In your hosting platform (Koyeb/Vercel/etc), set environment variables from `.env.production`

### Google OAuth Setup

You need **separate** OAuth credentials for each environment:

**Development:**

- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

**Production:**

- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`

## Environment Variables Reference

| Variable               | Description                                   | Example                                          |
| ---------------------- | --------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string (with pgbouncer) | `postgres://user:pass@host/db?pgbouncer=true`    |
| `DIRECT_URL`           | Direct PostgreSQL connection (for migrations) | `postgres://user:pass@host/db`                   |
| `JWT_SECRET`           | Secret key for access tokens                  | Random 64+ character string                      |
| `JWT_REFRESH_SECRET`   | Secret key for refresh tokens                 | Random 64+ character string                      |
| `NEXT_PUBLIC_SITE_URL` | Your site URL                                 | `http://localhost:3000`                          |
| `ACCESS_TOKEN_TTL`     | Access token lifetime (seconds)               | `900` (15 minutes)                               |
| `REFRESH_TOKEN_TTL`    | Refresh token lifetime (seconds)              | `604800` (7 days)                                |
| `MAIL_SERVER`          | SMTP server                                   | `smtp.hostinger.com`                             |
| `EMAIL_USER`           | Email username                                | `notif@bantusewa.com`                            |
| `EMAIL_PASSWORD`       | Email password                                | Your email password                              |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                        | From Google Cloud Console                        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                    | From Google Cloud Console                        |
| `GOOGLE_REDIRECT_URI`  | OAuth callback URL                            | `http://localhost:3000/api/auth/google/callback` |
| `NODE_ENV`             | Node environment                              | `development` or `production`                    |

## Troubleshooting

### "Missing environment variables" error

Run the switch script for your current branch:

```bash
.\scripts\switch-env.bat  # Windows
source ./scripts/switch-env.sh  # Linux/Mac
```

### Google OAuth not working

1. Check that `GOOGLE_REDIRECT_URI` matches your Google Cloud Console settings
2. Ensure you're using the correct credentials for your environment
3. Verify the redirect URI is exactly: `http://localhost:3000/api/auth/google/callback` (dev) or `https://yourdomain.com/api/auth/google/callback` (prod)

### Database connection issues

1. Verify `DATABASE_URL` and `DIRECT_URL` are correct
2. Check database is accessible from your network
3. Ensure `sslmode=require` is present for remote databases
