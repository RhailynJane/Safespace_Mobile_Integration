# Quick Test Commands for Docker Screenshots

## Functional Tests (Keep Containers)

### Run ALL Functional Tests at Once
```powershell
# Launch all 14 functional test suites (containers persist)
docker-compose -f docker-compose.test.yml run -d --name safespace-test-announcements-result test-announcements
docker-compose -f docker-compose.test.yml run -d --name safespace-test-appointments-result test-appointments
docker-compose -f docker-compose.test.yml run -d --name safespace-test-auth-result test-auth
docker-compose -f docker-compose.test.yml run -d --name safespace-test-community-result test-community
docker-compose -f docker-compose.test.yml run -d --name safespace-test-crisis-result test-crisis
docker-compose -f docker-compose.test.yml run -d --name safespace-test-home-result test-home
docker-compose -f docker-compose.test.yml run -d --name safespace-test-journal-result test-journal
docker-compose -f docker-compose.test.yml run -d --name safespace-test-messages-result test-messages
docker-compose -f docker-compose.test.yml run -d --name safespace-test-moods-result test-moods
docker-compose -f docker-compose.test.yml run -d --name safespace-test-profile-result test-profile
docker-compose -f docker-compose.test.yml run -d --name safespace-test-settings-result test-settings
docker-compose -f docker-compose.test.yml run -d --name safespace-test-resources-result test-resources
docker-compose -f docker-compose.test.yml run -d --name safespace-test-self-assessment-result test-self-assessment
docker-compose -f docker-compose.test.yml run -d --name safespace-test-video-result test-video
```

### Or Use Automated Script
```powershell
.\run-tests-docker-persist.ps1
```

## Performance Tests (Keep Containers)

```powershell
# Convex Announcements Performance
$env:EXPO_PUBLIC_CONVEX_URL="https://formal-pigeon-483.convex.cloud"
docker-compose -f docker-compose.test.yml run -d --name safespace-perf-announcements test-performance-convex

# Artillery Performance
docker-compose -f docker-compose.test.yml run -d --name safespace-perf-artillery test-performance-artillery

# k6 Smoke Test
docker-compose -f docker-compose.test.yml run -d --name safespace-perf-k6 k6-smoke
```

## View Results in Docker Desktop

1. **Open Docker Desktop**
2. **Navigate to Containers tab**
3. **Look for containers with names:**
   - `safespace-test-*-result` (functional tests)
   - `safespace-perf-*` (performance tests)
4. **Click on any container**
5. **Go to "Logs" tab to see full test output**
6. **Take screenshot** of the logs

## View Logs in Terminal

```powershell
# View specific test output
docker logs safespace-test-announcements-result

# View performance test output
docker logs safespace-perf-announcements

# List all test containers
docker ps -a --filter "name=safespace-"
```

## Check Test Status

```powershell
# See which tests completed successfully (exit code 0)
docker ps -a --filter "name=safespace-" --format "table {{.Names}}\t{{.Status}}"
```

## Cleanup After Screenshots

```powershell
# Remove all test containers
docker rm -f $(docker ps -a -q --filter "name=safespace-")

# Or use cleanup script
.\cleanup-test-containers.ps1
```

## Tips for Best Screenshots

1. **Wait for completion:** Let tests run for ~60 seconds before opening Docker Desktop
2. **Expand logs view:** Click container → Logs tab → Maximize window
3. **Search in logs:** Use search box to find "PASS" or "Test Suites:" 
4. **Capture summary:** Scroll to bottom for final test count
5. **Performance results:** Look for JSON report in logs with metrics

## Example: Screenshot Workflow

```powershell
# 1. Launch all tests
.\run-tests-docker-persist.ps1

# 2. Wait for completion message (script will pause)

# 3. Open Docker Desktop and capture screenshots

# 4. View specific results if needed
docker logs safespace-test-announcements-result | Select-String "Test Suites:"

# 5. Clean up
.\cleanup-test-containers.ps1
```
