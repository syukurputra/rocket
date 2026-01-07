#!/bin/bash

# Pre-build script for CI/CD
# Automatically selects the correct environment based on branch

BRANCH=${GITHUB_REF_NAME:-$(git branch --show-current)}

echo "🔍 Detected branch: $BRANCH"

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "production" ]; then
    echo "🚀 Setting up PRODUCTION environment..."
    cp .env.production .env
    export NODE_ENV=production
    echo "✅ Using .env.production"
elif [ "$BRANCH" = "development" ] || [ "$BRANCH" = "dev" ]; then
    echo "🔧 Setting up DEVELOPMENT environment..."
    cp .env.development .env
    export NODE_ENV=development
    echo "✅ Using .env.development"
else
    echo "⚠️  Unknown branch: $BRANCH"
    echo "📝 Using existing .env file"
fi

# Display current environment
echo ""
echo "📊 Environment Summary:"
echo "   Branch: $BRANCH"
echo "   NODE_ENV: $NODE_ENV"
echo ""
