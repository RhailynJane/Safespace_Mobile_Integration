#!/bin/bash
# Script to run tests in Docker
# Usage: ./scripts/test-docker.sh [test-type] [test-file]
# test-type can be: all, coverage, watch, specific, debug

TEST_TYPE=${1:-"all"}
TEST_FILE=${2:-""}

echo "🐳 Running SafeSpace tests in Docker..."

# Build the Docker image first
echo "📦 Building Docker test image..."
docker-compose -f docker-compose.test.yml build test

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo "✅ Docker image built successfully"

# Run tests based on type
case $TEST_TYPE in
    "all")
        echo "🧪 Running all tests..."
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --verbose
        ;;
    "coverage")
        echo "📊 Running tests with coverage..."
        docker-compose -f docker-compose.test.yml run --rm test npm run test:coverage
        ;;
    "watch")
        echo "👀 Running tests in watch mode..."
        docker-compose -f docker-compose.test.yml run --rm test npm run test:watch
        ;;
    "specific")
        if [ -z "$TEST_FILE" ]; then
            echo "❌ Please provide a test file when using 'specific' type"
            echo "Usage: ./scripts/test-docker.sh specific 'auth/login.test.tsx'"
            exit 1
        fi
        echo "🎯 Running specific test: $TEST_FILE"
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --testPathPattern="$TEST_FILE" --verbose
        ;;
    "debug")
        echo "🐛 Running tests with debug output..."
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --verbose --no-cache
        ;;
    *)
        echo "❌ Unknown test type: $TEST_TYPE"
        echo "Available types: all, coverage, watch, specific, debug"
        exit 1
        ;;
esac

echo "🏁 Test execution completed!"