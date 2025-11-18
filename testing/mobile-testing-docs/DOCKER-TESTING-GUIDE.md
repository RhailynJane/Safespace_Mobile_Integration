# 🐳 Docker Testing Guide for SafeSpace

## Overview
This guide explains how to run your Jest tests inside Docker containers, as required by your professor.

---

## 📋 Prerequisites

1. **Docker Desktop** installed on Windows
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running (check system tray)

2. **Files Created:**
   - ✅ `Dockerfile.test` - Container configuration
   - ✅ `docker-compose.test.yml` - Service orchestration
   - ✅ `.dockerignore` - Optimize build

---

## 🚀 Quick Start

### Option 1: Run All Tests (Recommended for Submission)

```powershell
# Build and run tests with coverage
docker-compose -f docker-compose.test.yml up test-coverage

# View coverage report after completion
# Check ./coverage/lcov-report/index.html
```

### Option 2: Run Tests Without Coverage

```powershell
# Build and run all tests
docker-compose -f docker-compose.test.yml up test
```

### Option 3: Run Tests in Watch Mode (Development)

```powershell
# Run tests in watch mode
docker-compose -f docker-compose.test.yml up test-watch
```

---

## 📝 Common Commands

### First Time Setup

```powershell
# Build the Docker image
docker-compose -f docker-compose.test.yml build test
```

### Run Specific Test File

```powershell
# Run a specific test file
docker-compose -f docker-compose.test.yml run test npm test -- home.test.tsx

# Run tests matching a pattern
docker-compose -f docker-compose.test.yml run test npm test -- --testPathPattern=components
```

### Run Tests and Save Results

```powershell
# Run tests with JSON output
docker-compose -f docker-compose.test.yml run test npm test -- --json --outputFile=test-results/results.json
```

### Clean Up Containers

```powershell
# Stop all containers
docker-compose -f docker-compose.test.yml down

# Remove containers and volumes
docker-compose -f docker-compose.test.yml down -v

# Remove all test images
docker rmi safespace-prototype-test
```

---

## 🎯 For Assignment Submission

### Step 1: Build the Container

```powershell
docker-compose -f docker-compose.test.yml build test-coverage
```

### Step 2: Run All Tests

```powershell
docker-compose -f docker-compose.test.yml up test-coverage
```

### Step 3: Collect Results

After tests complete, you'll have:
- **Coverage Report:** `coverage/lcov-report/index.html`
- **Console Output:** Visible in terminal
- **Test Results:** Can be exported with `--json` flag

### Step 4: Take Screenshots for Submission

1. **Terminal output** showing tests passing
2. **Coverage report** (open `coverage/lcov-report/index.html` in browser)
3. **Docker Desktop** showing the container ran

---

## 🔧 Troubleshooting

### Issue: "docker-compose: command not found"

**Solution:**
```powershell
# Use docker compose (space instead of hyphen) on newer Docker versions
docker compose -f docker-compose.test.yml up test
```

### Issue: Tests failing in Docker but passing locally

**Possible causes:**
1. **Node modules mismatch:** Delete `node_modules` and rebuild
   ```powershell
   docker-compose -f docker-compose.test.yml build --no-cache test
   ```

2. **Environment variables:** Check if tests need specific env vars
   ```powershell
   # Add to docker-compose.test.yml under environment:
   - EXPO_PUBLIC_CONVEX_URL=your_url
   ```

### Issue: Container exits immediately

**Solution:** Check container logs
```powershell
docker-compose -f docker-compose.test.yml logs test
```

### Issue: Permission errors on Windows

**Solution:** Run PowerShell as Administrator or enable file sharing in Docker Desktop settings

---

## 📊 Understanding the Output

### Successful Test Run

```
Test Suites: 15 passed, 15 total
Tests:       200 passed, 200 total
Snapshots:   0 total
Time:        45.123 s
```

### Coverage Report

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   75.5  |   65.2   |   70.8  |   75.1
 components/        |   80.2  |   70.5   |   75.3  |   80.0
 app/(app)/(tabs)/  |   70.8  |   60.1   |   66.2  |   70.5
```

---

## 🎓 Why Docker for Testing?

### Benefits for Your Assignment:

1. **Reproducibility:** Tests run the same way every time
2. **Clean Environment:** No local machine conflicts
3. **Professional Practice:** Industry-standard approach
4. **Easy Grading:** Professor can run tests exactly as you did

### What Docker Does:

1. Creates isolated container with Node.js 20
2. Installs all dependencies fresh
3. Runs tests in clean environment
4. Outputs results to your local filesystem
5. Destroys container when done (no pollution)

---

## 📁 File Structure

```
SafeSpace-prototype/
├── Dockerfile.test              # Docker image configuration
├── docker-compose.test.yml      # Service definitions
├── .dockerignore               # Files to exclude from image
├── __tests__/                  # Your test files
├── coverage/                   # Generated after test run
│   └── lcov-report/
│       └── index.html          # Open this in browser
└── test-results/               # JSON results (if configured)
```

---

## 🔍 Advanced Usage

### Run Interactive Shell in Container

```powershell
# Get shell access to debug
docker-compose -f docker-compose.test.yml run test sh

# Inside container, you can:
npm test
npm run test:coverage
ls -la
exit
```

### Run Tests with Different Node Versions

Edit `Dockerfile.test`:
```dockerfile
# Change first line to:
FROM node:18-alpine  # or node:16-alpine
```

Then rebuild:
```powershell
docker-compose -f docker-compose.test.yml build --no-cache test
```

### Export Test Results

```powershell
# Run with JSON output
docker-compose -f docker-compose.test.yml run test npm test -- --json --outputFile=/app/test-results/results.json

# Results will be in ./test-results/results.json
```

---

## ✅ Checklist for Professor's Requirements

- [ ] Docker installed and running
- [ ] All test files in `__tests__/` directory
- [ ] Dockerfile.test created
- [ ] docker-compose.test.yml created
- [ ] Tests passing: `docker-compose -f docker-compose.test.yml up test`
- [ ] Coverage generated: `docker-compose -f docker-compose.test.yml up test-coverage`
- [ ] Screenshots taken of:
  - [ ] Terminal output
  - [ ] Coverage report
  - [ ] Docker Desktop showing container
- [ ] Documentation updated in submission

---

## 🎬 Quick Demo for Your Professor

Create a file `RUN-TESTS.md` with these exact commands:

```markdown
# Running SafeSpace Tests in Docker

## Prerequisites
- Docker Desktop installed and running

## Commands to Run Tests

### 1. Build Test Container
``‌`powershell
docker-compose -f docker-compose.test.yml build test-coverage
``‌`

### 2. Run All Tests with Coverage
``‌`powershell
docker-compose -f docker-compose.test.yml up test-coverage
``‌`

### 3. View Results
- Console output: See terminal
- Coverage report: Open `coverage/lcov-report/index.html` in browser

## Expected Output
- All tests should pass
- Coverage report generated
- No errors in terminal
```

---

## 📞 Support

If you encounter issues:
1. Check Docker Desktop is running
2. Try rebuilding: `docker-compose -f docker-compose.test.yml build --no-cache test`
3. Check logs: `docker-compose -f docker-compose.test.yml logs test`
4. Verify files exist: `Dockerfile.test`, `docker-compose.test.yml`

---

**Generated:** November 17, 2025  
**For:** SafeSpace Mobile Testing Assignment  
**Status:** ✅ Ready for Use
