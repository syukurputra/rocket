#!/bin/bash

# Script to switch environment based on git branch
# Usage: source ./scripts/switch-env.sh

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "production" ]; then
    echo "Switching to PRODUCTION environment..."
    cp .env.production .env
    echo "✓ Using .env.production"
elif [ "$BRANCH" = "development" ] || [ "$BRANCH" = "dev" ]; then
    echo "Switching to DEVELOPMENT environment..."
    cp .env.development .env
    echo "✓ Using .env.development"
else
    echo "Unknown branch: $BRANCH"
    echo "Using default .env (if exists)"
fi

echo "Current branch: $BRANCH"
echo "NODE_ENV: $(grep NODE_ENV .env | cut -d '=' -f2)"
