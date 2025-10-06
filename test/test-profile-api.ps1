# Test Profile API Integration
Write-Host "Testing Profile API Integration..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3001/api"
$testClerkId = "test_client_ps_123"

try {
    # Step 1: Create/sync a client
    Write-Host "`n1. Creating/syncing client..." -ForegroundColor Cyan
    $syncBody = @{
        clerkUserId = $testClerkId
        email = "powershell.test@example.com"
        firstName = "PowerShell"
        lastName = "TestClient"
        phoneNumber = "555-9999"
    } | ConvertTo-Json

    $syncResult = Invoke-RestMethod -Method POST -Uri "$baseUrl/sync-user" -ContentType "application/json" -Body $syncBody
    Write-Host "Sync successful! User ID: $($syncResult.user.id)" -ForegroundColor Green
    
    # Step 2: Update emergency contacts
    Write-Host "`n2. Updating emergency contacts..." -ForegroundColor Cyan
    $clientBody = @{
        userId = $syncResult.user.id
        emergencyContactName = "Emergency Contact"
        emergencyContactPhone = "911-1234"
        emergencyContactRelationship = "Parent"
    } | ConvertTo-Json

    $clientResult = Invoke-RestMethod -Method POST -Uri "$baseUrl/clients" -ContentType "application/json" -Body $clientBody
    Write-Host "Emergency contacts updated!" -ForegroundColor Green
    
    # Step 3: Verify by fetching users
    Write-Host "`n3. Verifying client was created..." -ForegroundColor Cyan
    $users = Invoke-RestMethod -Uri "$baseUrl/users"
    $createdUser = $users | Where-Object { $_.clerk_user_id -eq $testClerkId }
    
    if ($createdUser) {
        Write-Host "✅ Client found in database:" -ForegroundColor Green
        Write-Host "   Name: $($createdUser.first_name) $($createdUser.last_name)"
        Write-Host "   Email: $($createdUser.email)"
        Write-Host "   Phone: $($createdUser.phone_number)"
        Write-Host "   Role: $($createdUser.role)"
    } else {
        Write-Host "❌ Client not found!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}