# Performance Testing Guide for SafeSpace App

## Overview
This guide covers performance testing for the SafeSpace mobile application, including tools, metrics, and test scenarios.

---

## Performance Testing Tools

### 1. React Native Performance Monitor (Built-in)
**Setup:** Already available in development builds
**Usage:**
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Select "Show Perf Monitor"
- Monitor: RAM, JS heap, Views, FPS

### 2. Flipper (Recommended)
**Installation:**
```bash
npm install --save-dev react-native-flipper
```

**Features:**
- Network inspection
- Redux state monitoring
- Layout inspection
- Performance profiling
- Database inspection

### 3. React DevTools Profiler
**Installation:**
```bash
npm install --save-dev react-devtools
```

**Usage:**
```bash
npx react-devtools
```

### 4. Detox with Performance Monitoring
Already configured in E2E tests.

---

## Key Performance Metrics

### 1. Load Time Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **App Launch Time (Cold)** | < 3 seconds | From tap to interactive |
| **App Launch Time (Warm)** | < 1 second | From background to foreground |
| **Screen Transition Time** | < 300ms | Between navigation |
| **API Response Time** | < 2 seconds | From request to response |
| **Image Load Time** | < 1 second | For optimized images |

### 2. Runtime Performance Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Frame Rate (FPS)** | 60 FPS (minimum 55) | React Native Perf Monitor |
| **JS Thread Utilization** | < 70% | Flipper Performance |
| **UI Thread Utilization** | < 50% | Flipper Performance |
| **Memory Usage (Idle)** | < 150 MB | Device monitor |
| **Memory Usage (Active)** | < 300 MB | Device monitor |
| **Battery Drain** | < 5% per hour | Device battery stats |

### 3. Network Performance
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **API Endpoint Response** | < 500ms | Network inspection |
| **Data Transfer Size** | Minimize | Flipper Network |
| **Failed Requests** | 0% | Error monitoring |
| **Offline Functionality** | Graceful degradation | Manual testing |

---

## Performance Test Scenarios

### Scenario 1: App Launch Performance
**Objective:** Measure cold and warm start times

**Test Steps:**
1. Close app completely (remove from memory)
2. Start timer
3. Launch app
4. Stop timer when home screen is interactive
5. Record time

**Cold Start Target:** < 3 seconds  
**Warm Start Target:** < 1 second

---

### Scenario 2: Screen Navigation Performance
**Objective:** Ensure smooth transitions between screens

**Test Steps:**
1. Open app to home screen
2. Navigate to Mood Tracking
3. Measure transition time
4. Navigate to Journal
5. Measure transition time
6. Test all major navigation paths

**Target:** < 300ms per transition  
**FPS Target:** 60 FPS during transition

---

### Scenario 3: List Scrolling Performance
**Objective:** Test performance with large datasets

**Test Cases:**
- Mood History with 100+ entries
- Journal History with 50+ entries
- Community Forum with 100+ posts
- Resource Library with 200+ items

**Metrics:**
- Scroll FPS should maintain 60 FPS
- No janky scrolling
- Smooth loading of items

---

### Scenario 4: Form Submission Performance
**Objective:** Measure time from submission to confirmation

**Test Forms:**
- Mood logging
- Journal creation
- Appointment booking
- Profile update
- Self-assessment submission

**Target:** < 2 seconds for submission + confirmation

---

### Scenario 5: Image Handling Performance
**Objective:** Test image loading and caching

**Test Cases:**
1. **Profile Picture Upload**
   - Upload 1MB image: < 3 seconds
   - Upload 5MB image: < 5 seconds
   - Image compression working

2. **Gallery Loading**
   - Load 20 images: < 2 seconds
   - Proper lazy loading
   - Caching working

---

### Scenario 6: Stress Testing
**Objective:** Test app under heavy load

**Test Cases:**
1. **Rapid Navigation**
   - Navigate between screens rapidly (10 times)
   - No crashes or memory leaks

2. **Concurrent Operations**
   - Log mood while loading journal history
   - Book appointment while browsing resources

3. **Memory Leak Testing**
   - Navigate through all screens 5 times
   - Memory should not continuously increase
   - Return to baseline after GC

---

### Scenario 7: Network Conditions Testing
**Objective:** Test performance under various network conditions

**Test Conditions:**
1. **Fast 3G** (Network Link Conditioner)
   - Download: 1.6 Mbps
   - Upload: 768 Kbps
   - Latency: 150ms

2. **Slow 3G**
   - Download: 400 Kbps
   - Upload: 400 Kbps
   - Latency: 400ms

3. **Offline Mode**
   - Test offline functionality
   - Data persistence
   - Sync when back online

**Success Criteria:**
- App remains responsive
- Proper loading indicators
- No crashes
- Data syncs correctly

---

### Scenario 8: Database Performance
**Objective:** Test local database operations

**Test Cases:**
1. **Read Performance**
   - Query 100 journal entries: < 100ms
   - Query 500 mood logs: < 200ms

2. **Write Performance**
   - Save journal entry: < 50ms
   - Batch insert 50 moods: < 500ms

3. **Complex Queries**
   - Filter + sort + pagination: < 150ms

---

## Performance Testing Checklist

### Pre-Test Setup
- [ ] Ensure device is fully charged
- [ ] Close all background apps
- [ ] Clear app cache and data
- [ ] Reset to known state
- [ ] Document device specifications
- [ ] Document OS version
- [ ] Document network conditions

### During Testing
- [ ] Record all metrics
- [ ] Take screenshots/videos if issues found
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Monitor network requests
- [ ] Check for memory leaks
- [ ] Verify FPS during animations

### Post-Test Analysis
- [ ] Compare results against targets
- [ ] Identify bottlenecks
- [ ] Document performance issues
- [ ] Create optimization recommendations
- [ ] Update defect tracker if needed

---

## Performance Test Results Template

```markdown
# Performance Test Results - [Date]

## Test Environment
- **Device:** [Model]
- **OS:** [Version]
- **App Version:** [Version]
- **Network:** [WiFi/4G/5G or simulated]
- **Battery:** [Percentage at start]

## Test Results

### 1. App Launch Performance
| Test | Target | Actual | Status | Notes |
|------|--------|--------|--------|-------|
| Cold Start | < 3s | 2.8s | ✅ Pass | |
| Warm Start | < 1s | 0.7s | ✅ Pass | |

### 2. Screen Navigation
| From → To | Target | Actual | FPS | Status |
|-----------|--------|--------|-----|--------|
| Home → Mood | < 300ms | 250ms | 60 | ✅ Pass |
| Mood → Journal | < 300ms | 280ms | 60 | ✅ Pass |
| Journal → Appointments | < 300ms | 320ms | 58 | ⚠️ Marginal |

### 3. List Scrolling
| List | Entries | FPS | Jank | Status |
|------|---------|-----|------|--------|
| Mood History | 150 | 60 | No | ✅ Pass |
| Journal History | 75 | 59 | No | ✅ Pass |

### 4. Memory Usage
| State | Memory | Target | Status |
|-------|--------|--------|--------|
| Idle | 145 MB | < 150 MB | ✅ Pass |
| Active Use | 280 MB | < 300 MB | ✅ Pass |
| Peak | 310 MB | < 350 MB | ✅ Pass |

### 5. API Performance
| Endpoint | Avg Time | Target | Status |
|----------|----------|--------|--------|
| GET /api/mood | 450ms | < 500ms | ✅ Pass |
| POST /api/journal | 380ms | < 500ms | ✅ Pass |
| GET /api/appointments | 520ms | < 500ms | ❌ Fail |

## Issues Found
1. **DEF-XXX:** Appointments API exceeds target response time
2. **Observation:** Minor frame drops during journal → appointments transition

## Recommendations
1. Optimize appointments endpoint query
2. Investigate journal → appointments navigation animation
3. Implement query result caching for frequently accessed data

**Tested By:** [Name]  
**Date:** [Date]
```

---

## Automated Performance Testing Script

See `performance-test-runner.ts` for automated test execution.

---

## Tools Installation Commands

```bash
# Install Flipper (if not already installed)
# Download from: https://fbflipper.com/

# Install React DevTools
npm install --save-dev react-devtools

# Install performance monitoring libraries
npm install --save-dev @react-native-community/cli
npm install --save-dev react-native-performance

# For backend API performance testing
npm install --save-dev artillery
npm install --save-dev autocannon
```

---

## Continuous Performance Monitoring

### Setup Baseline Metrics
1. Run performance tests on stable build
2. Document baseline metrics
3. Set alerts for regressions

### Regular Performance Testing Schedule
- **Daily:** Automated smoke performance tests
- **Weekly:** Full performance test suite
- **Before Release:** Comprehensive performance validation

### Performance Regression Detection
- Compare new builds against baseline
- Alert if metrics degrade by > 10%
- Block releases with critical regressions

---

**Last Updated:** November 1, 2025  
**Updated By:** QA Team
