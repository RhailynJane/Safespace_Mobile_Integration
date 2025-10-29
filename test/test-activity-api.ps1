# Test script for activity endpoints
param(
  [string]$BaseUrl,
  [string]$ClerkUserId
)

if (-not $BaseUrl) {
  $BaseUrl = if ($env:EXPO_PUBLIC_API_URL) { $env:EXPO_PUBLIC_API_URL } else { 'http://localhost:3001' }
}

if (-not $ClerkUserId) {
  Write-Host "Usage: .\\test-activity-api.ps1 -ClerkUserId <id> [-BaseUrl <url>]" -ForegroundColor Yellow
  exit 1
}

function Invoke-JsonPost($Url, $Body) {
  $json = $Body | ConvertTo-Json -Depth 5
  return Invoke-RestMethod -Uri $Url -Method Post -ContentType 'application/json' -Body $json
}

try {
  Write-Host "Testing login-activity..." -ForegroundColor Cyan
  $loginRes = Invoke-JsonPost "$BaseUrl/api/users/login-activity" @{ clerkUserId = $ClerkUserId }
  $loginRes | ConvertTo-Json -Depth 5 | Write-Output

  Start-Sleep -Seconds 1

  Write-Host "Testing heartbeat..." -ForegroundColor Cyan
  $hbRes = Invoke-JsonPost "$BaseUrl/api/users/heartbeat" @{ clerkUserId = $ClerkUserId }
  $hbRes | ConvertTo-Json -Depth 5 | Write-Output

  Write-Host "Fetching status..." -ForegroundColor Cyan
  $status = Invoke-RestMethod -Uri "$BaseUrl/api/users/status/$ClerkUserId" -Method Get
  $status | ConvertTo-Json -Depth 5 | Write-Output

  Write-Host "Testing logout-activity..." -ForegroundColor Cyan
  $logoutRes = Invoke-JsonPost "$BaseUrl/api/users/logout-activity" @{ clerkUserId = $ClerkUserId }
  $logoutRes | ConvertTo-Json -Depth 5 | Write-Output

  Write-Host "Fetching status after logout..." -ForegroundColor Cyan
  $status2 = Invoke-RestMethod -Uri "$BaseUrl/api/users/status/$ClerkUserId" -Method Get
  $status2 | ConvertTo-Json -Depth 5 | Write-Output
}
catch {
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}
