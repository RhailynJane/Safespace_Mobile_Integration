# PowerShell script to run tests in Docker
# Usage: .\scripts\test-docker.ps1 [test-type]
# test-type can be: all, coverage, watch, specific

param(
    [string]$TestType = "all",
    [string]$TestFile = ""
)

Write-Host "🐳 Running SafeSpace tests in Docker..." -ForegroundColor Blue

# Build the Docker image first
Write-Host "📦 Building Docker test image..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml build test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Run tests based on type
switch ($TestType.ToLower()) {
    "all" {
        Write-Host "🧪 Running all tests..." -ForegroundColor Cyan
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --verbose
    }
    "coverage" {
        Write-Host "📊 Running tests with coverage..." -ForegroundColor Cyan
        docker-compose -f docker-compose.test.yml run --rm test npm run test:coverage
    }
    "watch" {
        Write-Host "👀 Running tests in watch mode..." -ForegroundColor Cyan
        docker-compose -f docker-compose.test.yml run --rm test npm run test:watch
    }
    "specific" {
        if ([string]::IsNullOrEmpty($TestFile)) {
            Write-Host "❌ Please provide a test file when using 'specific' type" -ForegroundColor Red
            Write-Host "Usage: .\scripts\test-docker.ps1 specific 'auth/login.test.tsx'" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "🎯 Running specific test: $TestFile" -ForegroundColor Cyan
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --testPathPattern="$TestFile" --verbose
    }
    "debug" {
        Write-Host "🐛 Running tests with debug output..." -ForegroundColor Cyan
        docker-compose -f docker-compose.test.yml run --rm test npm test -- --watchAll=false --verbose --no-cache
    }
    default {
        Write-Host "❌ Unknown test type: $TestType" -ForegroundColor Red
        Write-Host "Available types: all, coverage, watch, specific, debug" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🏁 Test execution completed!" -ForegroundColor Green