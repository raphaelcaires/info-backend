#!/bin/bash

# E2E Test Runner Script
# This script ensures the API is running before executing e2e tests

set -e

echo "🚀 Starting E2E Tests..."

# Check if API is running
if ! curl -s http://localhost:3000/api/vehicles > /dev/null; then
    echo "❌ API is not running on http://localhost:3000"
    echo "Please start the API first with: npm start"
    echo "And ensure PostgreSQL and RabbitMQ are running with: docker compose up -d postgres rabbitmq"
    exit 1
fi

echo "✅ API is running"

# Check if PostgreSQL is accessible
if ! docker exec -it info-backend-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL container is not ready"
    echo "Make sure to run: docker compose up -d postgres"
fi

# Check if RabbitMQ is accessible
if ! curl -s http://localhost:15672 > /dev/null; then
    echo "⚠️  RabbitMQ is not accessible (tests will skip RabbitMQ validations)"
else
    echo "✅ RabbitMQ is running"
fi

echo ""
echo "🧪 Running E2E tests..."
npm run test:e2e

echo ""
echo "✅ E2E Tests completed!"
