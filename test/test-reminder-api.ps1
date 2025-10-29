param(
  [string]$BaseUrl = "http://localhost:3001",
  [Parameter(Mandatory=$true)][string]$ClerkUserId,
  [ValidateSet("mood","journaling","system")][string]$Type = "mood"
)

Write-Host "Testing reminder push via $BaseUrl for user $ClerkUserId (type=$Type)" -ForegroundColor Cyan

try {
  if ($Type -eq 'system') {
    $url = "$BaseUrl/api/test-push/$ClerkUserId"
    $body = @{ } | ConvertTo-Json
  } else {
    $url = "$BaseUrl/api/test-reminder/$ClerkUserId"
    $body = @{ type = $Type } | ConvertTo-Json
  }

  $resp = Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body $body -ErrorAction Stop
  Write-Host "Response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5
} catch {
  Write-Host "Request failed:" -ForegroundColor Red
  $_ | Out-String | Write-Host
}
