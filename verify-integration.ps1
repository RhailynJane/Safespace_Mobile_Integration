#!/usr/bin/env pwsh
# SafeSpace Integration Verification Script
# Run this script to verify that mobile and web apps are properly synchronized

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SafeSpace Integration Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$mobileDir = "c:\mobile-android-safespace\SafeSpace-android"
$webDir = "c:\safespace-integration\SafeSpaceApp_Web"

# Check 1: Verify Convex deployments match
Write-Host "Checking Convex deployment configuration..." -ForegroundColor Yellow
$mobileEnv = Get-Content "$mobileDir\.env.local" | Select-String "CONVEX_DEPLOYMENT"
$webEnv = Get-Content "$webDir\.env.local" | Select-String "CONVEX_DEPLOYMENT"

if ($mobileEnv -match "dev:wandering-partridge-43" -and $webEnv -match "dev:wandering-partridge-43") {
    Write-Host "✅ Both apps use the same Convex deployment: dev:wandering-partridge-43" -ForegroundColor Green
} else {
    Write-Host "❌ Convex deployments don't match!" -ForegroundColor Red
    Write-Host "   Mobile: $mobileEnv" -ForegroundColor Red
    Write-Host "   Web: $webEnv" -ForegroundColor Red
}
Write-Host ""

# Check 2: Verify schemas are identical
Write-Host "Checking schema synchronization..." -ForegroundColor Yellow
$mobileSchemaHash = (Get-FileHash "$mobileDir\convex\schema.ts").Hash
$webSchemaHash = (Get-FileHash "$webDir\convex\schema.ts").Hash

if ($mobileSchemaHash -eq $webSchemaHash) {
    Write-Host "✅ Schemas are identical" -ForegroundColor Green
} else {
    Write-Host "❌ Schemas differ!" -ForegroundColor Red
}
Write-Host ""

# Check 3: Verify no by_user index usage
Write-Host "Checking for old index names (by_user)..." -ForegroundColor Yellow
$mobileByUser = Select-String -Path "$mobileDir\convex\*.ts" -Pattern 'withIndex\("by_user",' -SimpleMatch
$webByUser = Select-String -Path "$webDir\convex\*.ts" -Pattern 'withIndex\("by_user",' -SimpleMatch

if ($null -eq $mobileByUser -and $null -eq $webByUser) {
    Write-Host "✅ No old 'by_user' index references found" -ForegroundColor Green
} else {
    Write-Host "❌ Found old 'by_user' references:" -ForegroundColor Red
    if ($mobileByUser) {
        Write-Host "   Mobile: $($mobileByUser.Count) occurrences" -ForegroundColor Red
    }
    if ($webByUser) {
        Write-Host "   Web: $($webByUser.Count) occurrences" -ForegroundColor Red
    }
}
Write-Host ""

# Check 4: Verify Clerk configuration matches
Write-Host "Checking Clerk authentication configuration..." -ForegroundColor Yellow
$mobileClerk = Get-Content "$mobileDir\.env.local" | Select-String "CLERK_PUBLISHABLE_KEY"
$webClerk = Get-Content "$webDir\.env.local" | Select-String "CLERK_PUBLISHABLE_KEY"

if ($mobileClerk -match "pk_test_bGl2ZS1zYXdmbHktMTcuY2xlcmsuYWNjb3VudHMuZGV2JA" -and 
    $webClerk -match "pk_test_bGl2ZS1zYXdmbHktMTcuY2xlcmsuYWNjb3VudHMuZGV2JA") {
    Write-Host "✅ Both apps use the same Clerk configuration" -ForegroundColor Green
} else {
    Write-Host "❌ Clerk configurations don't match!" -ForegroundColor Red
}
Write-Host ""

# Check 5: Verify convex.json exists in mobile
Write-Host "Checking Convex configuration files..." -ForegroundColor Yellow
$mobileConvexJson = Test-Path "$mobileDir\convex.json"
$webConvexJson = Test-Path "$webDir\convex.json"

if ($mobileConvexJson -and $webConvexJson) {
    Write-Host "✅ Both apps have convex.json files" -ForegroundColor Green
} else {
    Write-Host "❌ Missing convex.json files!" -ForegroundColor Red
    if (-not $mobileConvexJson) {
        Write-Host "   Mobile: Missing" -ForegroundColor Red
    }
    if (-not $webConvexJson) {
        Write-Host "   Web: Missing" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npx convex dev' in both mobile and web directories" -ForegroundColor White
Write-Host "2. Test user creation on mobile, verify it appears on web" -ForegroundColor White
Write-Host "3. Test appointments, conversations, and mood tracking" -ForegroundColor White
Write-Host ""
