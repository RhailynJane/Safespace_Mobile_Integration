# 📋 Assignment 3: Test Execution - Complete Guide

**Student:** [Your Name]  
**Student ID:** [Your ID]  
**Date:** November 17, 2025  
**Weight:** 20% (100 marks)

---

## 🎯 Assignment Overview

This guide maps your SafeSpace testing setup to Assignment 3 requirements.

---

## Part A: Test Execution (95 marks)

### 1. Test Environment Setup ✅

#### Production-Like Environment Options:

**Option 1: Docker (Recommended - Most Professional)**
```powershell
# Requires Docker Desktop to be running
npm run test:docker:build
npm run test:docker
```

**Option 2: Local Testing (If Docker Issues)**
```powershell
# Run tests locally
npm test

# Run with coverage
npm run test:coverage
```

**Option 3: CI/CD Simulation**
```powershell
# Set environment variable to simulate CI
$env:CI="true"
npm run test:coverage
```

#### Why This Simulates Production:
- ✅ Isolated environment (Docker) or CI flag
- ✅ Same Node version as deployment
- ✅ All dependencies installed fresh
- ✅ Reproducible results
- ✅ Clean state between runs

---

### 2a. Functional Testing (35 marks)

#### Test Coverage:
- **200+ test cases** across 15 test files
- **All use cases** from Assignment 2 covered
- **Functional areas tested:**
  - User authentication & onboarding
  - Mood tracking (CRUD operations)
  - Journal entries (create, read, update, delete)
  - Appointments (booking, cancellation, rescheduling)
  - Community forum (posts, replies, likes)
  - Messaging system
  - Profile management
  - Navigation and UI components

#### Running Functional Tests:

```powershell
# Option 1: In Docker
npm run test:docker

# Option 2: Locally with coverage
npm run test:coverage

# Option 3: Watch mode (during development)
npm run test:watch

# Option 4: Specific feature
npm test -- mood-tracking.test.tsx
```

#### Expected Results:
```
Test Suites: 15 passed, 15 total
Tests:       200+ passed, 200+ total
Coverage:    >70% overall
```

#### Documentation Required:
1. **Daily Test Summary** (Figure 12.1a, p. 178)
   - Location: `testing/documentation/daily-test-summary-template.md`
   - Fill out EACH DAY of testing
   
2. **Test Results Screenshot**
   - Terminal output showing all tests passing
   - Coverage report (`coverage/lcov-report/index.html`)

---

### 2b. Performance Testing (35 marks)

#### Performance Metrics to Measure:

**i. Speed Validation**

```powershell
# Run performance tests
npm run test:performance

# Run load tests
npm run test:load

# Generate load test report
npm run test:load:report
```

**ii. Test Plan Execution**

Your performance test plan from Assignment 2 includes:
- Component render times
- API response times
- Memory usage
- Load handling (concurrent users)

**iii. Document Outcomes**

Location: `testing/performance/performance-testing-guide.md`

Performance metrics to track:
- **Response Time:** < 200ms for UI interactions
- **Load Time:** < 3s for initial app load
- **Concurrent Users:** Support 100+ simultaneous users
- **Memory Usage:** < 100MB baseline
- **CPU Usage:** < 30% during normal operation

#### Performance Test Results Template:

```markdown
| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|--------------|----------|--------|-----------|-------|
| Home screen load | <200ms | [YOUR RESULT] | | |
| Mood submission | <300ms | [YOUR RESULT] | | |
| Journal save | <500ms | [YOUR RESULT] | | |
| 100 concurrent users | Success | [YOUR RESULT] | | |
```

---

### 2c. Automated Testing ✅ (Optional - Extra Credit)

You're already using automated testing!

**Tools Used:**
- ✅ **Jest** - Test framework
- ✅ **React Native Testing Library** - Component testing
- ✅ **Artillery** - Load testing
- ✅ **Docker** - Environment automation

**Automation Benefits:**
- Tests run automatically on every code change
- Consistent results
- Fast feedback
- Integration with CI/CD ready

---

### 2d. Document Testing Outcomes (10 marks)

#### Daily Test Summary (Figure 12.1a, p. 178)

Use template: `testing/documentation/daily-test-summary-template.md`

**Example Entry:**

```markdown
## Daily Test Summary - Day 1
**Date:** November 17, 2025
**Tester:** [Your Name]
**Environment:** Docker Container (Node 20)

### Tests Executed
- Total Test Cases: 200
- Passed: 185
- Failed: 15
- Blocked: 0
- Not Run: 0

### Defects Found
- Critical: 2
- Major: 5
- Minor: 8

### Notes
- All authentication tests passing
- Issues found in appointment booking flow
- Performance meets requirements
```

#### Required Documentation:
1. ✅ Screenshot of test execution
2. ✅ Coverage report
3. ✅ Daily summaries for each testing day
4. ✅ Final summary report

---

### 2e. Defect Tracking (10 marks)

#### Defect Tracking Spreadsheet

Location: `testing/documentation/defect-tracking-spreadsheet.md`

**Severity Codes:**
- **Critical (P1):** App crashes, data loss
- **Major (P2):** Feature doesn't work, major UI issues
- **Minor (P3):** Small bugs, cosmetic issues
- **Trivial (P4):** Typos, minor suggestions

#### Example Defects to Track:

| ID | Severity | Module | Description | Status | Fixed In |
|----|----------|--------|-------------|--------|----------|
| DEF-001 | Critical | Auth | Login fails with valid credentials | Open | - |
| DEF-002 | Major | Mood | Mood history not loading | Fixed | v1.1.0 |
| DEF-003 | Minor | UI | Button text truncated | Open | - |

**Your Task:**
- Track EVERY defect found during testing
- Assign severity codes
- Update status as defects are fixed
- Document which code version contains the fix

---

### 2f. Test Case Execution Progress Tracking (5 marks)

#### Progress Template (Figure 12.1b, p. 178)

```markdown
## Test Execution Progress

| Date | Total Cases | Executed | Passed | Failed | % Complete | % Pass Rate |
|------|-------------|----------|--------|--------|------------|-------------|
| Nov 17 | 200 | 50 | 45 | 5 | 25% | 90% |
| Nov 18 | 200 | 120 | 110 | 10 | 60% | 92% |
| Nov 19 | 200 | 200 | 185 | 15 | 100% | 93% |

### Analysis
- **Defect-Free Ratio:** 93% (185/200)
- **Critical Issues:** 2
- **Ready for Production:** After fixing critical defects
```

**Metrics to Calculate:**
- Attempted vs Total: Shows progress
- Pass Rate: Shows quality
- Defect Density: Defects per module
- Test Coverage: % of code tested

---

### 2g. Defect Backlog (Optional)

If you have more defects than you can fix:

**Prioritization Strategy:**
1. Fix all Critical (P1) defects first
2. Fix Major (P2) defects before release
3. Minor (P3) can be in backlog for next release
4. Trivial (P4) fix when time permits

**Document in Defect Tracking Spreadsheet:**
- Backlog section
- Target fix version
- Assigned to (developer)
- Estimated fix time

---

## Part B: Peer Assessment (5 marks)

**Template:**

| Criteria | Student 1 | Student 2 | Student 3 | Comments |
|----------|-----------|-----------|-----------|----------|
| Motivation & Engagement | /3 | /3 | /3 | |
| Timely Submission | /3 | /3 | /3 | |
| Communication & Problem Solving | /3 | /3 | /3 | |

**Rating Scale:**
- 1 = Significant improvement needed
- 2 = Acceptable with minor improvements
- 3 = Excellent contribution

---

## 🎯 Step-by-Step Execution Plan

### Day 1-2: Environment Setup
- [x] Install Docker Desktop (if using Docker approach)
- [x] Verify all tests run: `npm test`
- [x] Generate baseline coverage: `npm run test:coverage`
- [x] Set up documentation templates

### Day 3-5: Functional Testing
- [ ] Run full test suite in Docker/CI mode
- [ ] Document results in daily summary
- [ ] Track all defects found
- [ ] Take screenshots of test results

### Day 6-7: Performance Testing
- [ ] Run performance tests: `npm run test:performance`
- [ ] Run load tests: `npm run test:load`
- [ ] Document performance metrics
- [ ] Compare against requirements

### Day 8-9: Documentation
- [ ] Complete daily test summaries
- [ ] Fill defect tracking spreadsheet
- [ ] Create progress tracking report
- [ ] Calculate final metrics

### Day 10: Final Review
- [ ] Review all documentation
- [ ] Ensure all screenshots captured
- [ ] Complete peer assessments
- [ ] Submit assignment

---

## 📊 Grading Breakdown - How to Get Full Marks

### Functional Test (35 marks)
**Excellent (76-100%):**
- ✅ All 200+ test cases executed
- ✅ Clear documentation of results
- ✅ Screenshots of test runs
- ✅ Coverage report included
- ✅ No missing information

**How to achieve:**
1. Run: `npm run test:docker` (or `npm run test:coverage`)
2. Screenshot the terminal output
3. Open and screenshot `coverage/lcov-report/index.html`
4. Document in daily summary template
5. Show test cases mapped to requirements

---

### Performance Test (35 marks)
**Excellent (76-100%):**
- ✅ Performance tests executed
- ✅ Metrics documented
- ✅ Results compared to requirements
- ✅ Load test report generated
- ✅ Clear analysis of results

**How to achieve:**
1. Run: `npm run test:performance`
2. Run: `npm run test:load`
3. Generate report: `npm run test:load:report`
4. Document all metrics in template
5. Analyze results vs. requirements

---

### Document Testing Outcomes (10 marks)
**Excellent (76-100%):**
- ✅ Daily summaries for each test day
- ✅ Follow Figure 12.1a format exactly
- ✅ Complete and accurate
- ✅ Professional presentation

**How to achieve:**
1. Use template: `testing/documentation/daily-test-summary-template.md`
2. Fill out EVERY day of testing
3. Include all required fields
4. Add screenshots

---

### Defect Tracking (10 marks)
**Excellent (76-100%):**
- ✅ All defects tracked
- ✅ Severity codes assigned
- ✅ Status updated
- ✅ Fix versions documented
- ✅ Professional format

**How to achieve:**
1. Use template: `testing/documentation/defect-tracking-spreadsheet.md`
2. Track EVERY bug found
3. Assign severity (P1-P4)
4. Update status as fixed
5. Document fix version/commit

---

### Progress Tracking (5 marks)
**Excellent (76-100%):**
- ✅ Template follows Figure 12.1b
- ✅ Metrics calculated correctly
- ✅ Progress clearly shown
- ✅ Analysis included

**How to achieve:**
1. Track daily progress
2. Calculate pass/fail ratios
3. Show trend over time
4. Analyze defect-free ratio

---

### Peer Review (5 marks)
**Excellent (76-100%):**
- ✅ All team members rated
- ✅ Constructive feedback provided
- ✅ Honest assessment
- ✅ Submitted on time

---

## 🚀 Quick Commands Reference

```powershell
# === FUNCTIONAL TESTING ===

# Docker approach (if Docker Desktop running)
npm run test:docker:build        # Build container (once)
npm run test:docker              # Run all tests

# Local approach (if Docker issues)
npm run test:coverage            # Run with coverage report

# Specific tests
npm test -- mood-tracking.test.tsx
npm test -- --testPathPattern=components

# === PERFORMANCE TESTING ===

npm run test:performance         # Performance metrics
npm run test:load               # Load testing
npm run test:load:report        # Generate HTML report

# === WATCH MODE (Development) ===

npm run test:watch              # Auto-run on file changes

# === VIEW RESULTS ===

start coverage/lcov-report/index.html                    # Coverage
start testing/performance/report.html                    # Load test report
```

---

## 📸 Required Screenshots for Submission

1. **Test Execution:**
   - [ ] Terminal showing all tests passing
   - [ ] Coverage report (HTML page)
   - [ ] Docker Desktop (if using Docker)

2. **Performance Testing:**
   - [ ] Performance test output
   - [ ] Load test report
   - [ ] Metrics dashboard

3. **Documentation:**
   - [ ] Daily test summary (at least 3 days)
   - [ ] Defect tracking spreadsheet
   - [ ] Progress tracking chart

4. **Environment:**
   - [ ] Test environment setup
   - [ ] Configuration files
   - [ ] Tool versions (`node --version`, `npm --version`)

---

## ✅ Pre-Submission Checklist

- [ ] All tests executed and passing
- [ ] Coverage report generated and >70%
- [ ] Performance tests run successfully
- [ ] Daily summaries completed (minimum 3 days)
- [ ] Defect tracking spreadsheet filled
- [ ] Progress tracking with metrics
- [ ] All screenshots captured
- [ ] Peer assessment completed
- [ ] All documentation proofread
- [ ] Files organized in submission folder

---

## 🎓 Tips for Success

1. **Start Early:** Don't wait until last minute
2. **Document Daily:** Fill templates as you test, not after
3. **Track Everything:** Every bug, every result
4. **Take Screenshots:** Capture everything as you go
5. **Be Thorough:** Complete all required sections
6. **Proofread:** Check for typos and errors
7. **Professional:** Format consistently and clearly

---

## 📞 Troubleshooting

### Docker Desktop Not Running
```powershell
# Alternative: Use local testing
npm run test:coverage

# Or simulate CI environment
$env:CI="true"
npm test
```

### Tests Failing
```powershell
# Clear cache and retry
npm test -- --clearCache
npm test
```

### Performance Tests Issues
```powershell
# Install artillery globally if needed
npm install -g artillery
artillery run testing/performance/load-test-config.js
```

---

**Last Updated:** November 17, 2025  
**Status:** Ready for Execution  
**Next Step:** Start Docker Desktop and run `npm run test:docker:build`

**Good luck! 🍀**
