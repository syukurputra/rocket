@echo off
REM Script to switch environment based on git branch
REM Usage: scripts\switch-env.bat

for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

if "%BRANCH%"=="main" goto production
if "%BRANCH%"=="master" goto production
if "%BRANCH%"=="production" goto production
if "%BRANCH%"=="development" goto development
if "%BRANCH%"=="dev" goto development
goto unknown

:production
echo Switching to PRODUCTION environment...
copy /Y .env.production .env >nul
echo ✓ Using .env.production
goto end

:development
echo Switching to DEVELOPMENT environment...
copy /Y .env.development .env >nul
echo ✓ Using .env.development
goto end

:unknown
echo Unknown branch: %BRANCH%
echo Using default .env (if exists)
goto end

:end
echo Current branch: %BRANCH%
findstr "NODE_ENV" .env
