# cleanup-test-containers.ps1
# Removes all SafeSpace test containers

Write-Host "Cleaning up all SafeSpace test containers..." -ForegroundColor Yellow

$containers = docker ps -a -q --filter "name=safespace-test" --filter "name=safespace-perf"

if ($containers) {
    docker rm -f $containers
    Write-Host "✅ Cleaned up $($containers.Count) containers" -ForegroundColor Green
} else {
    Write-Host "No test containers found" -ForegroundColor Gray
}
