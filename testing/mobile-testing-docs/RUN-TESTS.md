# 🧪 Running SafeSpace Tests in Docker

## Quick Start for Professor

This document provides the exact commands to run the Jest test suite in Docker.

---

## Prerequisites

✅ Docker Desktop installed and running on Windows  
✅ PowerShell terminal open in project directory

---

## Step-by-Step Instructions

### 1️⃣ Build the Test Container

```powershell
docker-compose -f docker-compose.test.yml build test-coverage
```

**Expected Output:**
```
[+] Building 45.2s (12/12) FINISHED
 => [internal] load build definition from Dockerfile.test
 => => transferring dockerfile: 512B
 => [internal] load .dockerignore
 => ...
 => => naming to docker.io/library/safespace-prototype-test-coverage
```

---

### 2️⃣ Run All Tests with Coverage

```powershell
docker-compose -f docker-compose.test.yml up test-coverage
```

**Expected Output:**
```
safespace-test-coverage | PASS __tests__/components/SafeSpaceLogo.test.tsx
safespace-test-coverage | PASS __tests__/screens/mood-tracking.test.tsx
safespace-test-coverage | PASS __tests__/screens/journal.test.tsx
...
safespace-test-coverage | Test Suites: 15 passed, 15 total
safespace-test-coverage | Tests:       200 passed, 200 total
safespace-test-coverage | Coverage:    75% statements, 70% branches
```

---

### 3️⃣ View Coverage Report

Open in browser:
```
coverage/lcov-report/index.html
```

Or from PowerShell:
```powershell
start coverage/lcov-report/index.html
```

---

## Alternative: Run Tests Without Coverage

```powershell
# Build and run
docker-compose -f docker-compose.test.yml up test
```

---

## Alternative: Run Specific Test File

```powershell
# Run only home tab tests
docker-compose -f docker-compose.test.yml run test npm test -- home.test.tsx

# Run only component tests
docker-compose -f docker-compose.test.yml run test npm test -- --testPathPattern=components
```

---

## Clean Up After Testing

```powershell
# Stop containers
docker-compose -f docker-compose.test.yml down

# Remove containers and images (optional)
docker-compose -f docker-compose.test.yml down --rmi all
```

---

## Verification Checklist

After running tests, you should have:

- [x] Terminal output showing test results
- [x] `coverage/` folder with HTML report
- [x] Container visible in Docker Desktop
- [x] No error messages in console

---

## Troubleshooting

### If command not found:
```powershell
# Use space instead of hyphen
docker compose -f docker-compose.test.yml up test-coverage
```

### If tests fail:
```powershell
# Rebuild without cache
docker-compose -f docker-compose.test.yml build --no-cache test-coverage
```

### If permission errors:
```powershell
# Run PowerShell as Administrator
```

---

## Expected Test Results

```
Test Suites: 15 passed, 15 total
Tests:       200+ passed, 200+ total
Snapshots:   0 total
Time:        ~45s
Coverage:    >70% overall
```

---

## Files Generated

After successful run:
- `coverage/lcov-report/index.html` - Interactive coverage report
- `coverage/coverage-final.json` - Raw coverage data
- `coverage/lcov.info` - LCOV format for CI tools

---

**Last Updated:** November 17, 2025  
**Docker Image:** Node 20 Alpine  
**Test Framework:** Jest + React Native Testing Library
