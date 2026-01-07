# IMPORTANT: Environment Files with Real Secrets

## ⚠️ SECURITY WARNING

The following files should **NEVER** be committed to Git:

- `.env`
- `.env.development` (with real credentials)
- `.env.production` (with real credentials)

## Files in Git Repository

### ✅ Safe to Commit

- `.env.example` - Template with placeholders only
- `.env.development` - Template with placeholders (NO REAL SECRETS)
- `.env.production` - Template with placeholders (NO REAL SECRETS)

### ❌ Never Commit

- `.env` - Your active environment file
- `.env.local` - Local overrides
- Any file with real database passwords, API keys, or OAuth secrets

## Setup for Developers

1. **Copy the template:**

   ```bash
   cp .env.development .env.development.local
   ```

2. **Add your real credentials to `.env.development.local`:**

   - Database credentials
   - Google OAuth Client ID & Secret
   - Email password
   - JWT secrets

3. **Use the local file:**
   ```bash
   cp .env.development.local .env
   ```

## For CI/CD

Use **GitHub Secrets** and **Koyeb Environment Variables** for real credentials.
Never store real secrets in files committed to Git.

## Current Setup

- `.env.development` = Template with placeholders (committed to Git)
- `.env.development.local` = Your real dev secrets (git-ignored)
- `.env.production` = Template with placeholders (committed to Git)
- `.env.production.local` = Your real prod secrets (git-ignored)

## If You Accidentally Committed Secrets

1. **Immediately rotate all exposed credentials:**

   - Change database passwords
   - Regenerate Google OAuth credentials
   - Update email passwords
   - Generate new JWT secrets

2. **Clean Git history:**

   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.development" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (⚠️ dangerous):**
   ```bash
   git push origin --force --all
   ```
