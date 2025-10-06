#Claude prompt: How can I test my settings API backend using PowerShell?
# Configuration
$baseUrl = "http://localhost:3001/api"
$testUserId = "clerk_test_user_id"

Write-Host "=== Testing Backend API ===" -ForegroundColor Cyan

# Test 1: Initialize Settings
Write-Host "`n1. Initializing settings..." -ForegroundColor Yellow
try {
    $initResponse = Invoke-RestMethod -Uri "$baseUrl/settings/$testUserId/initialize" -Method POST -ContentType "application/json"
    Write-Host "✓ Initialize successful" -ForegroundColor Green
    $initResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "✗ Initialize failed: $_" -ForegroundColor Red
}

# Test 2: Fetch Settings
Write-Host "`n2. Fetching settings..." -ForegroundColor Yellow
try {
    $fetchResponse = Invoke-RestMethod -Uri "$baseUrl/settings/$testUserId" -Method GET -ContentType "application/json"
    Write-Host "✓ Fetch successful" -ForegroundColor Green
    $fetchResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "✗ Fetch failed: $_" -ForegroundColor Red
}

# Test 3: Update Settings
Write-Host "`n3. Updating settings..." -ForegroundColor Yellow
try {
    $updateData = @{
        darkMode = $true
        textSize = "Large"
        highContrast = $true
        notificationsEnabled = $true
        crisisContact = "555-TEST"
        safeMode = $true
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/settings/$testUserId" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "✓ Update successful" -ForegroundColor Green
    $updateResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "✗ Update failed: $_" -ForegroundColor Red
}

# Test 4: Verify Update
Write-Host "`n4. Verifying update..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/settings/$testUserId" -Method GET -ContentType "application/json"
    Write-Host "✓ Verification successful" -ForegroundColor Green
    $verifyResponse | ConvertTo-Json -Depth 10
    
    # Check specific values
    if ($verifyResponse.data.dark_mode -eq $true) {
        Write-Host "✓ darkMode correctly updated" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan