# Docker Testing Guide for SafeSpace

This guide explains how to run tests in Docker containers for consistent, isolated testing environments.

## Prerequisites

- Docker and Docker Compose installed
- Node.js (for local development comparison)

## Quick Start

### 1. Build the Test Environment

```bash
# Build the Docker test image
npm run test:docker:build
```

### 2. Run All Tests

```bash
# Run all tests once
npm run test:docker

# Run tests with coverage
npm run test:docker:coverage

# Run tests in watch mode (for development)
npm run test:docker:watch

# Run with debug output
npm run test:docker:debug
```

### 3. Run Specific Tests

```bash
# Run a specific test file
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern="auth/login" --watchAll=false

# Run tests matching a pattern
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testNamePattern="login" --watchAll=false
```

## Docker Services

The `docker-compose.test.yml` defines three services:

### `test` (Default)
- Runs tests once and exits
- Good for CI/CD pipelines
- Includes coverage collection

### `test-watch`
- Runs tests in watch mode
- Automatically re-runs when files change
- Good for development

### `test-coverage`
- Runs tests with detailed coverage reporting
- Generates coverage reports in `./coverage/`

## Scripts Available

### PowerShell (Windows)
```powershell
# Run the PowerShell script with different options
.\scripts\test-docker.ps1 all           # Run all tests
.\scripts\test-docker.ps1 coverage      # Run with coverage
.\scripts\test-docker.ps1 watch         # Run in watch mode
.\scripts\test-docker.ps1 specific "auth/login.test.tsx"  # Run specific test
.\scripts\test-docker.ps1 debug         # Run with debug output
```

### Bash (Linux/Mac/WSL)
```bash
# Run the bash script with different options
./scripts/test-docker.sh all            # Run all tests
./scripts/test-docker.sh coverage       # Run with coverage
./scripts/test-docker.sh watch          # Run in watch mode
./scripts/test-docker.sh specific "auth/login.test.tsx"   # Run specific test
./scripts/test-docker.sh debug          # Run with debug output
```

### NPM Scripts
```bash
npm run test:docker                      # Run all tests
npm run test:docker:build               # Build test image
npm run test:docker:coverage            # Run with coverage
npm run test:docker:watch               # Run in watch mode
npm run test:docker:debug               # Run with debug output
```

## Common Issues & Solutions

### 1. Port Conflicts
If you get port binding errors, make sure no other services are running on the same ports.

### 2. Permission Issues
On Linux/Mac, you might need to run Docker commands with `sudo` or add your user to the docker group.

### 3. Memory Issues
If tests fail due to memory constraints, you can increase Docker's memory allocation:
```bash
# Add to your docker-compose.test.yml service
deploy:
  resources:
    limits:
      memory: 2G
```

### 4. File Changes Not Detected
If watch mode isn't picking up file changes, ensure the volume mounts are correct in `docker-compose.test.yml`.

## Environment Variables

The Docker containers use these environment variables:
- `NODE_ENV=test` - Sets Node environment to test mode
- `CI=true` - Enables CI-specific test behaviors
- `EXPO_PUBLIC_CONVEX_URL=http://host.docker.internal:1` - Mock Convex URL

## Debugging Tests

### View Container Logs
```bash
# View logs from test container
docker-compose -f docker-compose.test.yml logs test

# Follow logs in real-time
docker-compose -f docker-compose.test.yml logs -f test
```

### Interactive Shell
```bash
# Open a shell in the test container
docker-compose -f docker-compose.test.yml run --rm test sh

# Then run tests manually
npm test
```

### Debug Specific Test Files
```bash
# Run with increased verbosity
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern="components/CurvedBackground" --verbose --no-cache
```

## Performance Tips

1. **Use .dockerignore**: Make sure you have a `.dockerignore` file to exclude unnecessary files
2. **Layer Caching**: Keep `package.json` copy separate from source code copy for better Docker layer caching
3. **Parallel Tests**: Jest runs tests in parallel by default, which works well in containers

## Comparing Local vs Docker

To ensure consistency between local and Docker test runs:

```bash
# Run locally first
npm test

# Then run in Docker
npm run test:docker

# Compare results
```

## CI/CD Integration

For continuous integration, use:

```yaml
# Example GitHub Actions step
- name: Run tests in Docker
  run: |
    npm run test:docker:build
    npm run test:docker:coverage
```

## Troubleshooting

If you encounter issues:

1. **Rebuild the image**: `npm run test:docker:build`
2. **Clear Docker cache**: `docker system prune`
3. **Check Docker resources**: Ensure enough memory and disk space
4. **Verify file permissions**: Especially on Linux/Mac systems
5. **Check logs**: `docker-compose -f docker-compose.test.yml logs test`

## File Structure

```
├── Dockerfile.test              # Docker image definition for testing
├── docker-compose.test.yml      # Docker Compose configuration
├── jest.config.cjs             # Jest configuration
├── jest.setup.cjs              # Jest setup and mocks
├── scripts/
│   ├── test-docker.ps1         # PowerShell test runner
│   └── test-docker.sh          # Bash test runner
└── __tests__/
    └── test-utils.tsx          # Test utilities and providers
```