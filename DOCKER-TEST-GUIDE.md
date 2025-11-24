# Docker Test Execution & Results Guide

## Quick Reference: Running All Tests

### Run All Feature Tests Sequentially
```powershell
docker-compose -f docker-compose.test.yml run --rm test-all-features
```

### Run Individual Feature Tests
```powershell
# Announcements
docker-compose -f docker-compose.test.yml run --rm test-announcements

# Appointments
docker-compose -f docker-compose.test.yml run --rm test-appointments

# Authentication
docker-compose -f docker-compose.test.yml run --rm test-auth

# Community Forum
docker-compose -f docker-compose.test.yml run --rm test-community

# Crisis Support
docker-compose -f docker-compose.test.yml run --rm test-crisis

# Home
docker-compose -f docker-compose.test.yml run --rm test-home

# Journal
docker-compose -f docker-compose.test.yml run --rm test-journal

# Messages
docker-compose -f docker-compose.test.yml run --rm test-messages

# Moods
docker-compose -f docker-compose.test.yml run --rm test-moods

# Profile
docker-compose -f docker-compose.test.yml run --rm test-profile

# Settings
docker-compose -f docker-compose.test.yml run --rm test-settings

# Resources
docker-compose -f docker-compose.test.yml run --rm test-resources

# Self Assessment
docker-compose -f docker-compose.test.yml run --rm test-self-assessment

# Video Consultations
docker-compose -f docker-compose.test.yml run --rm test-video
```

## Viewing Test Results After Execution

### Option 1: Save Output to File (Recommended)
```powershell
# Save test output to file
docker-compose -f docker-compose.test.yml run --rm test-announcements > test-results-announcements.txt 2>&1

# Save all features
docker-compose -f docker-compose.test.yml run --rm test-all-features > test-results-all.txt 2>&1

# View the file
cat test-results-announcements.txt
```

### Option 2: Enable Coverage Reports (Persisted to Host)
```powershell
# Run with coverage (creates coverage/ directory on host)
docker-compose -f docker-compose.test.yml run --rm test npm run test:coverage

# View coverage report
start coverage/lcov-report/index.html
```

### Option 3: Check Container Logs (Recent Runs)
```powershell
# List recent containers (including exited ones)
docker ps -a --filter "name=safespace-test"

# View logs from last run (get container ID from above)
docker logs <container-id>
```

### Option 4: Keep Container Running for Inspection
```powershell
# Remove --rm flag and add -d to run detached
docker-compose -f docker-compose.test.yml run -d test-announcements

# Check status
docker ps -a

# View logs
docker logs safespace-test-announcements

# Clean up when done
docker rm safespace-test-announcements
```

## Performance Test Results

Performance tests automatically save JSON reports to your host machine:

```powershell
# Run Convex performance test
$env:EXPO_PUBLIC_CONVEX_URL="https://formal-pigeon-483.convex.cloud"
docker-compose -f docker-compose.test.yml run --rm test-performance-convex

# View saved report (persists on host)
cat testing/performance/convex/announcements-load-report.json
```

## Batch Testing with Output Capture

Create a PowerShell script to run all tests and save results:

```powershell
# run-all-tests.ps1
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = "test-results-$timestamp"
New-Item -ItemType Directory -Force -Path $outputDir

$tests = @(
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

foreach ($test in $tests) {
    Write-Host "Running $test..." -ForegroundColor Cyan
    docker-compose -f docker-compose.test.yml run --rm $test > "$outputDir/$test.txt" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $test PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ $test FAILED" -ForegroundColor Red
    }
}

Write-Host "`nAll results saved to $outputDir/" -ForegroundColor Yellow
```

Run it:
```powershell
.\run-all-tests.ps1
```

## CI/CD Integration

For automated pipelines, use the aggregate runner with output redirect:

```powershell
docker-compose -f docker-compose.test.yml run --rm test-all-features 2>&1 | Tee-Object -FilePath ci-test-results.txt
exit $LASTEXITCODE
```

## Troubleshooting

### Tests Pass But Output Disappears
- **Cause**: `--rm` flag removes container after exit
- **Solution**: Save output to file or remove `--rm` flag

### Cannot Find Test Results
- **Coverage**: Check `coverage/` directory (mounted from host)
- **Performance**: Check `testing/performance/convex/*.json`
- **Logs**: Use `docker logs <container-id>` immediately after run

### View Live Output
```powershell
# Don't use -d flag, output streams to terminal in real-time
docker-compose -f docker-compose.test.yml run --rm test-announcements
```

## Summary Dashboard

After running tests, generate summary:

```powershell
# Count passed tests in output file
Select-String -Path test-results-all.txt -Pattern "PASS.*test" | Measure-Object

# Extract test suite results
Select-String -Path test-results-all.txt -Pattern "Test Suites:"
```
