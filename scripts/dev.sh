#!/bin/bash
echo "🚀 Starting MathStream local development environment..."

# Start Docker services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for MongoDB and Redis..."
sleep 3

# Run development servers
pnpm dev

