@echo off
REM Pre-build script for CI/CD (Windows)
REM Automatically selects the correct environment based on branch

for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

echo 🔍 Detected branch: %BRANCH%

if "%BRANCH%"=="main" goto production
if "%BRANCH%"=="master" goto production
if "%BRANCH%"=="production" goto production
if "%BRANCH%"=="development" goto development
if "%BRANCH%"=="dev" goto development
goto unknown

:production
echo 🚀 Setting up PRODUCTION environment...
copy /Y .env.production .env >nul
set NODE_ENV=production
echo ✅ Using .env.production
goto summary

:development
echo 🔧 Setting up DEVELOPMENT environment...
copy /Y .env.development .env >nul
set NODE_ENV=development
echo ✅ Using .env.development
goto summary

:unknown
echo ⚠️  Unknown branch: %BRANCH%
echo 📝 Using existing .env file
goto summary

:summary
echo.
echo 📊 Environment Summary:
echo    Branch: %BRANCH%
echo    NODE_ENV: %NODE_ENV%
echo.
