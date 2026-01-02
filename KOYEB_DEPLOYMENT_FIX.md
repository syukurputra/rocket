# Koyeb Deployment Fix

## Problem

The Koyeb buildpack was failing with exit code 51 during the build step. This was caused by several configuration issues:

1. **Incompatible .npmrc settings** - The `.npmrc` file contained pnpm-specific settings (`shamefully-hoist`, `node-linker`) that are incompatible with npm
2. **Complex build script** - The build script was trying to run icon bundling which may fail in the build environment
3. **Missing Procfile** - No explicit process definition for Koyeb

## Changes Made

### 1. Fixed `.npmrc`

**Before:**

```
auto-install-peers=true
shamefully-hoist=true
node-linker=hoisted
```

**After:**

```
auto-install-peers=true
```

Removed pnpm-specific settings that cause issues with npm.

### 2. Simplified Build Script in `package.json`

**Before:**

```json
"build": "prisma generate && npm run build:icons && next build --no-lint"
```

**After:**

```json
"build": "prisma generate && next build"
```

Removed the icon bundling step from the main build to avoid potential failures. Icons can be generated during development or as a separate step.

### 3. Created `Procfile`

```
web: npm start
```

This explicitly tells Koyeb how to start the application.

## Next Steps

1. **Commit these changes:**

   ```bash
   git add .npmrc package.json Procfile
   git commit -m "Fix Koyeb deployment: simplify build and fix npm config"
   git push
   ```

2. **Redeploy on Koyeb** - The build should now succeed

3. **Environment Variables** - Make sure these are set in Koyeb:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
   - `JWT_SECRET` - Your JWT secret
   - `JWT_REFRESH_SECRET` - Your refresh token secret
   - `NEXT_PUBLIC_SITE_URL` - Your production URL
   - `ACCESS_TOKEN_TTL` - Token time to live (default: 900)
   - `MAIL_SERVER` - SMTP server
   - `EMAIL_USER` - Email username
   - `EMAIL_PASSWORD` - Email password

## Additional Recommendations

### 1. Run Icon Bundling Separately

If you need the icons, run this command locally before deploying:

```bash
npm run build:icons
```

Then commit the generated CSS file.

### 2. Database Migrations

Make sure to run Prisma migrations on your production database:

```bash
npx prisma migrate deploy
```

### 3. Consider Adding a Build Hook

You can add a build hook in Koyeb to run additional commands after the build completes.

## Troubleshooting

If the build still fails:

1. **Check Koyeb logs** for specific error messages
2. **Verify Node.js version** - Your package.json specifies Node 20.x
3. **Check database connectivity** - Ensure DATABASE_URL is accessible from Koyeb
4. **Verify all dependencies** - Make sure all packages in package.json are compatible

## Testing Locally

Before deploying, test the build locally:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test build
npm run build

# Test start
npm start
```
