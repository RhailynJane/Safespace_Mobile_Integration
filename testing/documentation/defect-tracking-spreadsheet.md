# SafeSpace App - Defect Tracking Spreadsheet

## Instructions:
- Fill in all fields for each defect discovered during testing
- Update status regularly as defects are addressed
- Assign severity codes according to the definitions below

---

## Severity Definitions

| Code | Severity | Definition | Examples |
|------|----------|------------|----------|
| S1 | **Critical** | Complete system failure, data loss, security breach, app crash that prevents core functionality | - App crashes on launch<br>- User data deleted<br>- Cannot login at all<br>- Security vulnerability |
| S2 | **High** | Major functionality broken, significant user impact, no workaround available | - Cannot create journal entries<br>- Mood tracking not saving<br>- Appointments not booking<br>- Payment processing failure |
| S3 | **Medium** | Feature partially works, workaround exists, moderate user impact | - Search function slow<br>- Incorrect data display<br>- Minor UI issues<br>- Notification delays |
| S4 | **Low** | Minor issue, cosmetic, minimal user impact | - Typos in text<br>- Alignment issues<br>- Color inconsistencies<br>- Minor performance lag |

---

## Priority Definitions

| Priority | Definition | Action Required |
|----------|------------|-----------------|
| P1 | Fix immediately | Must be fixed before next release |
| P2 | Fix soon | Should be fixed in current sprint |
| P3 | Fix when possible | Can be fixed in future sprint |
| P4 | Fix if time permits | Nice to have, low impact |

---

## Defect Tracking Table

| Defect ID | Date Found | Module/Feature | Test Case ID | Severity | Priority | Status | Description | Steps to Reproduce | Expected Result | Actual Result | Environment | Assigned To | Date Fixed | Fix Version | Verified By | Verification Date | Reopened | Notes |
|-----------|------------|----------------|--------------|----------|----------|--------|-------------|-------------------|----------------|---------------|-------------|-------------|------------|-------------|-------------|-------------------|----------|-------|
| DEF-001 | 2025-11-01 | Authentication | AU-001 | S2 | P1 | Open | Cannot sign up with valid email | 1. Open app<br>2. Navigate to signup<br>3. Enter valid email and password<br>4. Tap signup button | User account created successfully | Error message "Signup failed" appears | iOS 17.0, iPhone 15 Pro | Dev Team | | | | | No | Initial discovery |
| DEF-002 | 2025-11-01 | Mood Tracking | MT-002 | S3 | P2 | In Progress | Mood history shows incorrect dates | 1. Log multiple moods over several days<br>2. Navigate to mood history<br>3. Check dates displayed | Dates should match actual entry dates | Dates are off by one day | Android 14, Pixel 7 | Dev Team | | | | | No | Timezone issue suspected |
| DEF-003 | 2025-11-02 | Journal | JR-001 | S4 | P3 | Open | Title text field allows only 20 characters | 1. Create new journal entry<br>2. Try to enter title longer than 20 characters | Should allow at least 50 characters | Cuts off at 20 characters | iOS 17.0, iPhone 15 Pro | Dev Team | | | | | No | UX concern |
| DEF-004 | 2025-11-02 | Appointments | AP-001 | S1 | P1 | Open | App crashes when booking appointment | 1. Navigate to appointments<br>2. Select date and time<br>3. Tap confirm | Appointment booked successfully | App crashes to home screen | Android 14, Pixel 7 | Dev Team | | | | | No | Critical - blocking testing |
| DEF-005 | 2025-11-03 | Profile | PR-002 | S3 | P2 | Fixed | Profile picture upload fails for large images | 1. Go to edit profile<br>2. Upload image >5MB<br>3. Save profile | Error message about file size | Silent failure, no error shown | iOS 17.0, iPhone 15 Pro | Dev Team | 2025-11-04 | 1.0.1 | QA Team | 2025-11-04 | No | Added validation message |
| DEF-006 | 2025-11-03 | Crisis Support | CS-001 | S2 | P1 | Open | Emergency contact numbers not clickable | 1. Navigate to crisis support<br>2. Tap phone number | Should initiate phone call | Nothing happens | Both iOS & Android | Dev Team | | | | | No | Accessibility issue |
| DEF-007 | 2025-11-04 | Resources | RS-002 | S4 | P4 | Open | Category filter animation glitchy | 1. Open resources<br>2. Tap category filter<br>3. Observe animation | Smooth animation | Stutters during transition | iOS 17.0 only | Dev Team | | | | | No | Performance optimization needed |
| DEF-008 | 2025-11-04 | Self-Assessment | SA-001 | S3 | P2 | In Progress | PHQ-9 score calculation incorrect | 1. Complete PHQ-9 assessment<br>2. Answer all questions with "2"<br>3. View results | Total score should be 18 | Shows 16 | Both iOS & Android | Dev Team | | | | | No | Logic error in calculation |
| DEF-009 | 2025-11-05 | Notifications | NT-001 | S2 | P1 | Open | Push notifications not received | 1. Book appointment<br>2. Wait for reminder time<br>3. Check for notification | Notification appears at reminder time | No notification received | Android 14, Pixel 7 | Dev Team | | | | | No | FCM configuration issue? |
| DEF-010 | 2025-11-05 | Community Forum | CF-003 | S4 | P3 | Open | Post timestamp shows "Invalid Date" | 1. Create forum post<br>2. View post in feed<br>3. Check timestamp | Should show "2 minutes ago" | Shows "Invalid Date" | Both iOS & Android | Dev Team | | | | | No | Date formatting bug |

---

## Defect Statistics

### By Severity
| Severity | Count | Percentage |
|----------|-------|------------|
| S1 - Critical | 1 | 10% |
| S2 - High | 3 | 30% |
| S3 - Medium | 3 | 30% |
| S4 - Low | 3 | 30% |
| **Total** | **10** | **100%** |

### By Status
| Status | Count |
|--------|-------|
| Open | 7 |
| In Progress | 2 |
| Fixed | 1 |
| Closed | 0 |
| Reopened | 0 |
| **Total** | **10** |

### By Module
| Module | Defect Count | Critical/High |
|--------|--------------|---------------|
| Authentication | 1 | 1 |
| Mood Tracking | 1 | 0 |
| Journal | 1 | 0 |
| Appointments | 1 | 1 |
| Profile | 1 | 0 |
| Crisis Support | 1 | 1 |
| Resources | 1 | 0 |
| Self-Assessment | 1 | 0 |
| Notifications | 1 | 1 |
| Community Forum | 1 | 0 |

---

## Defect Backlog

### Current Backlog Status
- **Total Defects Identified:** 10
- **Defects Fixed:** 1
- **Defects Remaining:** 9
- **Backlog Percentage:** 90%

### Critical/High Priority Backlog
| Defect ID | Module | Description | Days Open |
|-----------|--------|-------------|-----------|
| DEF-001 | Authentication | Cannot sign up with valid email | 5 |
| DEF-004 | Appointments | App crashes when booking appointment | 4 |
| DEF-006 | Crisis Support | Emergency contact numbers not clickable | 3 |
| DEF-009 | Notifications | Push notifications not received | 1 |

### Action Plan for Backlog Reduction
1. **Immediate Focus:** Address all S1 (Critical) defects - DEF-004
2. **This Sprint:** Fix all S2 (High) defects - DEF-001, DEF-006, DEF-009
3. **Next Sprint:** Address S3 (Medium) defects
4. **Future Sprints:** Fix S4 (Low) defects as time permits

---

## Defect Code Strategy

### Code Branch Naming Convention
- `bugfix/DEF-XXX-short-description` (for bug fixes)
- Example: `bugfix/DEF-004-appointment-crash`

### Commit Message Format
```
[DEF-XXX] Brief description of fix

- Detailed change 1
- Detailed change 2
- Closes DEF-XXX
```

Example:
```
[DEF-001] Fix authentication signup failure

- Updated API endpoint to handle email validation correctly
- Added proper error handling for network failures
- Improved error messages for user feedback
- Closes DEF-001
```

### Testing Before Closing Defect
- [ ] Unit tests updated/added
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Regression testing on related features
- [ ] Verified on multiple devices/OS versions
- [ ] Code review completed
- [ ] Documentation updated

---

## Template for New Defect Entries

```
Defect ID: DEF-XXX
Date Found: YYYY-MM-DD
Module: [Module Name]
Test Case ID: [TC-XXX]
Severity: S1/S2/S3/S4
Priority: P1/P2/P3/P4
Status: Open/In Progress/Fixed/Closed/Reopened

Description:
[Clear, concise description of the issue]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happens]

Environment:
- Device: [Device model]
- OS: [OS version]
- App Version: [Version]
- Network: [WiFi/Cellular]

Assigned To: [Team/Person]
Notes: [Any additional context]
```

---

**Last Updated:** [Date]  
**Updated By:** [Name]  
**Next Review:** [Date]
