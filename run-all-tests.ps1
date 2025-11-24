# run-all-tests.ps1
# Batch runner for all Docker test suites with persistent output

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = "test-results-$timestamp"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

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

$passed = 0
$failed = 0
$results = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeSpace Docker Test Suite Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($test in $tests) {
    Write-Host "Running $test..." -ForegroundColor Yellow
    $outputFile = "$outputDir\$test.txt"
    
    docker-compose -f docker-compose.test.yml run --rm $test > $outputFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $test PASSED" -ForegroundColor Green
        $passed++
        $results += [PSCustomObject]@{
            Suite = $test
            Status = "PASS"
            Output = $outputFile
        }
    } else {
        Write-Host "❌ $test FAILED (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        $failed++
        $results += [PSCustomObject]@{
            Suite = $test
            Status = "FAIL"
            Output = $outputFile
        }
    }
    Write-Host ""
}

# Generate summary report
$summaryFile = "$outputDir\summary.txt"
$summary = @"
SafeSpace Test Results Summary
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

Total Suites: $($tests.Count)
Passed: $passed
Failed: $failed
Success Rate: $([math]::Round(($passed / $tests.Count) * 100, 2))%

Details:
========================================
"@

$summary | Out-File -FilePath $summaryFile

foreach ($result in $results) {
    $line = "$($result.Status.PadRight(6)) $($result.Suite.PadRight(30)) -> $($result.Output)"
    $line | Out-File -FilePath $summaryFile -Append
}

# Display summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Suites: $($tests.Count)"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed / $tests.Count) * 100, 2))%" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "All results saved to: $outputDir\" -ForegroundColor Cyan
Write-Host "Summary report: $summaryFile" -ForegroundColor Cyan

# Return non-zero exit code if any tests failed
if ($failed -gt 0) {
    exit 1
}
