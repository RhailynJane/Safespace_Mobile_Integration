# run-tests-docker-persist.ps1
# Runs all tests and keeps containers for Docker Desktop inspection/screenshot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeSpace Test Runner (Persist Mode)" -ForegroundColor Cyan
Write-Host "  Containers will remain for inspection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Functional Tests
Write-Host "FUNCTIONAL TESTS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$functionalTests = @(
    "test-announcements",
    "test-appointments",
    "test-auth",
    "test-community",
    "test-crisis",
    "test-home",
    "test-journal",
    "test-messages",
    "test-moods",
    "test-profile",
    "test-settings",
    "test-resources",
    "test-self-assessment",
    "test-video"
)

foreach ($test in $functionalTests) {
    Write-Host "Starting $test..." -ForegroundColor Cyan
    docker-compose -f docker-compose.test.yml run -d --name "safespace-$test-result" $test
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "PERFORMANCE TESTS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Set Convex URL for performance tests
$env:EXPO_PUBLIC_CONVEX_URL = "https://formal-pigeon-483.convex.cloud"

# Performance - Announcements (Convex)
Write-Host "Starting performance test (Convex Announcements)..." -ForegroundColor Cyan
docker-compose -f docker-compose.test.yml run -d --name "safespace-perf-announcements-convex" test-performance-convex

# Performance - Artillery
Write-Host "Starting performance test (Artillery)..." -ForegroundColor Cyan
docker-compose -f docker-compose.test.yml run -d --name "safespace-perf-artillery" test-performance-artillery

# Performance - k6
Write-Host "Starting performance test (k6 Smoke)..." -ForegroundColor Cyan
docker-compose -f docker-compose.test.yml run -d --name "safespace-perf-k6-smoke" k6-smoke

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All tests launched!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for tests to complete (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker ps -a --filter "name=safespace-" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Open Docker Desktop" -ForegroundColor White
Write-Host "2. Go to Containers tab" -ForegroundColor White
Write-Host "3. Find containers starting with safespace-" -ForegroundColor White
Write-Host "4. Click on any container to view logs/output" -ForegroundColor White
Write-Host "5. Take screenshots of the results" -ForegroundColor White
Write-Host ""
Write-Host "To view logs for a specific test:" -ForegroundColor Yellow
Write-Host "  docker logs safespace-test-announcements-result" -ForegroundColor Gray
Write-Host "  docker logs safespace-perf-announcements-convex" -ForegroundColor Gray
Write-Host ""
Write-Host "To clean up all test containers:" -ForegroundColor Yellow
Write-Host '  docker rm -f $(docker ps -a -q --filter "name=safespace-")' -ForegroundColor Gray
Write-Host ""
