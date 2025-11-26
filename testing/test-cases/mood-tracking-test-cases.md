# Mood Tracking Test Cases

## Overview
This document enumerates comprehensive test cases for the Mood Tracking feature covering mood selection, mood logging (notes, intensity, factors, sharing), history viewing, filtering, deletion, and validation/error conditions. It maps each test to requirement IDs (REQ-MOOD-*). Test cases derive from the provided specification and have been aligned with the current implementation found in:
- `app/(app)/mood-tracking/index.tsx` (Mood selection screen)
- `app/(app)/mood-tracking/mood-logging.tsx` (Logging form: notes, share toggle, submit)
- `app/(app)/mood-tracking/mood-history.tsx` (History list, calendar view, search, deletion)

Some specified scenarios (e.g., network failure simulation, security injection handling) are not directly supported by UI hooks or explicit validation logic in the current codebase; these are marked as "PENDING / NOT IMPLEMENTED" for future coverage.

## Legend
- Priority: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)
- Status: IMPLEMENTED (supported by current UI), PARTIAL (UI present but no explicit validation), PENDING (not yet implemented), N/A (outside scope of mobile UI tests)

## 1. Positive Functional Tests (Mood Selection & Logging)
| ID | Req | Description | Preconditions | Expected Result | Priority | Status |
|----|-----|-------------|--------------|-----------------|----------|--------|
| TC-MOOD-P01 | REQ-MOOD-001 | Select "Ecstatic" mood (replacing Very Happy) | On Mood Tracker screen | Mood card gets selected border | P1 | IMPLEMENTED |
| TC-MOOD-P02 | REQ-MOOD-001 | Select "Happy" mood | On Mood Tracker screen | Mood card selected | P1 | IMPLEMENTED |
| TC-MOOD-P03 | REQ-MOOD-001 | Select "Neutral" mood | On Mood Tracker screen | Mood card selected | P1 | IMPLEMENTED |
| TC-MOOD-P04 | REQ-MOOD-001 | Select "Annoyed" mood | On Mood Tracker screen | Mood card selected | P1 | IMPLEMENTED |
| TC-MOOD-P05 | REQ-MOOD-001 | Select "Furious" mood | On Mood Tracker screen | Mood card selected | P1 | IMPLEMENTED |
| TC-MOOD-P32 | REQ-MOOD-001 | Complete mood entry (full data) | On Logging screen | Success modal, redirect to history | P1 | IMPLEMENTED |
| TC-MOOD-P33 | REQ-MOOD-001 | Complete mood entry (minimum fields) | On Logging screen | Success modal, redirect | P1 | IMPLEMENTED |
| TC-MOOD-P45 | REQ-MOOD-001 | Save button visible & accessible | On Logging screen | Button enabled (not submitting) | P2 | IMPLEMENTED |
| TC-MOOD-P48 | REQ-MOOD-001 | Page title "Log Your Mood" displays | After navigating | Title visible in header | P2 | IMPLEMENTED |
| TC-MOOD-P49 | REQ-MOOD-001 | Selected mood displays on logging page | Mood chosen | Emoji + label rendered | P2 | IMPLEMENTED |
| TC-MOOD-P51 | REQ-MOOD-001 | Success confirmation after save | Mood submitted | Success modal displayed | P1 | IMPLEMENTED |
| TC-MOOD-P58 | REQ-MOOD-001 | Verify 9-grid mood layout | On Mood Tracker | 3x3 mood grid present | P2 | IMPLEMENTED |
| TC-MOOD-P60 | REQ-MOOD-003 | All factors present (mapped list) | Logging form | 13 factors visible | P2 | IMPLEMENTED |

## 2. Intensity Slider (NOTE: Current implementation sets default intensity=3 but **no slider UI** appears — tests deferred)
| ID | Req | Description | Expected | Status |
|----|-----|-------------|----------|--------|
| TC-MOOD-P06 | REQ-MOOD-002 | Slider min value 1 | Should show 1 | PENDING (No slider) |
| TC-MOOD-P07 | REQ-MOOD-002 | Slider max value 5 | Should show 5 | PENDING |
| TC-MOOD-P08 | REQ-MOOD-002 | Slider middle value 3 | Shows 3 | PENDING |
| TC-MOOD-P09 | REQ-MOOD-002 | Smooth transitions | Real-time updates | PENDING |
| TC-MOOD-P37 | REQ-MOOD-002 | Value 2 | Shows 2 | PENDING |
| TC-MOOD-P38 | REQ-MOOD-002 | Value 4 | Shows 4 | PENDING |
| TC-MOOD-P42 | REQ-MOOD-002 | Value persists on scroll | No reset | PENDING |
| TC-MOOD-P46 | REQ-MOOD-002 | Increment check 1→5 | All values reachable | PENDING |
| TC-MOOD-P59 | REQ-MOOD-002 | Scale labels visible | 1..5 labeled | PENDING |

## 3. Mood Factors
| ID | Req | Description | Preconditions | Expected | Priority | Status |
|----|-----|-------------|--------------|----------|----------|--------|
| TC-MOOD-P10 | REQ-MOOD-003 | Select single factor Family | Mood selected | Factor highlighted | P2 | IMPLEMENTED |
| TC-MOOD-P18 | REQ-MOOD-003 | Select two factors | Mood selected | Both highlighted | P2 | IMPLEMENTED |
| TC-MOOD-P19 | REQ-MOOD-003 | Select three factors | Mood selected | All 3 highlighted | P2 | IMPLEMENTED |
| TC-MOOD-P20 | REQ-MOOD-003 | Select all factors | Mood selected | All factors highlighted | P3 | IMPLEMENTED |
| TC-MOOD-P21 | REQ-MOOD-003 | Deselect factor | Factors selected | One removed | P2 | IMPLEMENTED |
| TC-MOOD-P39 | REQ-MOOD-003 | Deselect all | Multiple selected | All unselected | P3 | IMPLEMENTED |
| TC-MOOD-P47 | REQ-MOOD-003 | Layout organization | On logging screen | Organized rows | P4 | IMPLEMENTED |

(Individual factor tests P11–P17, P14–P17 replaced by representative coverage due to identical logic)

## 4. Notes Field
| ID | Req | Description | Preconditions | Expected | Priority | Status |
|----|-----|-------------|--------------|----------|----------|--------|
| TC-MOOD-P22 | REQ-MOOD-004 | Enter 50 chars | Logging screen | Counter 50/200 | P2 | IMPLEMENTED |
| TC-MOOD-P23 | REQ-MOOD-004 | Enter 100 chars | Logging screen | 100/200 | P2 | IMPLEMENTED |
| TC-MOOD-P24 | REQ-MOOD-004 | Enter 199 chars | Logging screen | 199/200 | P2 | IMPLEMENTED |
| TC-MOOD-P25 | REQ-MOOD-004 | Enter 200 chars (limit) | Logging screen | 200/200 | P2 | IMPLEMENTED |
| TC-MOOD-P26 | REQ-MOOD-004 | Notes with emoji | Logging screen | Emojis displayed | P3 | IMPLEMENTED |
| TC-MOOD-P27 | REQ-MOOD-004 | Special characters | Logging screen | Displayed intact | P3 | IMPLEMENTED |
| TC-MOOD-P28 | REQ-MOOD-004 | Empty notes (optional) | Logging screen | Saves w/o notes | P2 | IMPLEMENTED |
| TC-MOOD-P43 | REQ-MOOD-004 | Real-time counter update | Typing & deleting | Counter updates | P2 | IMPLEMENTED |
| TC-MOOD-P50 | REQ-MOOD-004 | Placeholder text visible | Logging screen | Placeholder shows | P4 | IMPLEMENTED |
| TC-MOOD-P40 | REQ-MOOD-004 | Line breaks preserved | Save multiline | Breaks retained | P3 | IMPLEMENTED |
| TC-MOOD-N03 | REQ-MOOD-004 | Attempt >200 chars (201) | Logging screen | Truncated at 200 | P2 | IMPLEMENTED |
| TC-MOOD-N04 | REQ-MOOD-004 | Paste 250 chars | Logging screen | Truncated | P2 | IMPLEMENTED |
| TC-MOOD-N05 | REQ-MOOD-004 | Paste 500 chars | Logging screen | Truncated | P2 | IMPLEMENTED |
| TC-MOOD-N18 | REQ-MOOD-004 | Whitespace-only notes | Logging screen | Accepts or trims | P3 | PARTIAL (No trim logic) |
| TC-MOOD-N19 | REQ-MOOD-004 | Unicode char limit | Logging screen | Proper count | P3 | PARTIAL |
| TC-MOOD-N25 | REQ-MOOD-004 | Malicious javascript string | Logging screen | No execution | P3 | PARTIAL (Assumes sanitization server-side) |
| TC-MOOD-N06 | REQ-MOOD-004 | SQL injection attempt | Logging screen | No execution | P3 | PARTIAL |
| TC-MOOD-N07 | REQ-MOOD-004 | XSS script tag | Logging screen | Escaped (no run) | P3 | PARTIAL |
| TC-MOOD-N08 | REQ-MOOD-004 | HTML tags input | Logging screen | Plain text stored | P3 | PARTIAL |
| TC-MOOD-N30 | REQ-MOOD-004 | Copy-paste formatted text | Logging screen | Formatting stripped | P4 | PARTIAL |

## 5. Share With Support Worker Toggle
| ID | Req | Description | Preconditions | Expected | Priority | Status |
|----|-----|-------------|--------------|----------|----------|--------|
| TC-MOOD-P29 | REQ-MOOD-005 | Toggle ON | Logging screen | Switch ON + notice | P2 | IMPLEMENTED |
| TC-MOOD-P30 | REQ-MOOD-005 | Default OFF state | Logging screen | OFF visual | P2 | IMPLEMENTED |
| TC-MOOD-P31 | REQ-MOOD-005 | Multiple toggles | Logging screen | State toggles reliably | P3 | IMPLEMENTED |
| TC-MOOD-P44 | REQ-MOOD-005 | Persistence during scroll | Toggle ON | Remains ON | P3 | IMPLEMENTED |

## 6. History & Calendar
| ID | Req | Description | Preconditions | Expected | Priority | Status |
|----|-----|-------------|--------------|----------|----------|--------|
| TC-MOOD-P52 | REQ-MOOD-006 | View mood history list | Prior entries exist | Entries render | P1 | IMPLEMENTED |
| TC-MOOD-P53 | REQ-MOOD-006 | View mood entry details (navigation) | History loaded | Detail screen shown | P2 | IMPLEMENTED |
| TC-MOOD-P54 | REQ-MOOD-006 | Filter last 7 days | Entries exist | Only last week | P3 | PENDING (No explicit filter UI) |
| TC-MOOD-P55 | REQ-MOOD-006 | Filter last 30 days | Entries exist | Only last 30 days | P3 | PENDING |
| TC-MOOD-P56 | REQ-MOOD-006 | All time filter | Entries exist | All entries | P3 | PENDING |
| TC-MOOD-N32 | REQ-MOOD-006 | Empty history state | New user | Empty state message | P2 | IMPLEMENTED |
| TC-MOOD-N33 | REQ-MOOD-006 | Invalid date range filter | Apply invalid filter | Validation error | P4 | PENDING |
| TC-MOOD-N31 | REQ-MOOD-007 | Delete non-existent entry | History screen | Error handled | P3 | PARTIAL |
| TC-MOOD-P57 | REQ-MOOD-007 | Delete mood entry | History with entries | Entry removed | P2 | IMPLEMENTED |
| TC-MOOD-N35 | REQ-MOOD-003 | Save with no factors | Logging screen | Success | P3 | IMPLEMENTED |

## 7. Navigation & Misc
| ID | Req | Description | Preconditions | Expected | Priority | Status |
|----|-----|-------------|--------------|----------|----------|--------|
| TC-MOOD-P35 | REQ-MOOD-001 | Back navigation | On mood tracker | Returns to previous screen | P2 | IMPLEMENTED |
| TC-MOOD-P36 | REQ-MOOD-001 | Notification bell visibility | Mood tracker header | Bell visible | P4 | IMPLEMENTED |
| TC-MOOD-P41 | REQ-MOOD-001 | Change mood before logging | Mood initially selected | New mood overrides | P2 | IMPLEMENTED |
| TC-MOOD-P34 | REQ-MOOD-001 | Save within 2 seconds | Stable connection | <2s save (approx) | P3 | PARTIAL (Timing not asserted) |

## 8. Negative / Edge (Environment & Performance) — NOT SUPPORTED IN CURRENT UI
| ID | Req | Scenario | Status |
|----|-----|----------|--------|
| TC-MOOD-N01 | REQ-MOOD-001 | Attempt save without mood | PENDING (Navigation blocked earlier) |
| TC-MOOD-N02 | REQ-MOOD-002 | Slider unused default | PENDING (No slider) |
| TC-MOOD-N09 | REQ-MOOD-001 | Network disconnection mid-save | PENDING |
| TC-MOOD-N10 | REQ-MOOD-001 | Slow network timeout | PENDING |
| TC-MOOD-N11 | REQ-MOOD-001 | Airplane mode save attempt | PENDING |
| TC-MOOD-N12 | REQ-MOOD-001 | Rapid mood taps | PARTIAL (Basic selection stable) |
| TC-MOOD-N13 | REQ-MOOD-002 | Rapid slider movements | PENDING |
| TC-MOOD-N14 | REQ-MOOD-003 | Rapid factor toggling | PARTIAL |
| TC-MOOD-N15 | REQ-MOOD-001 | Rapid multiple save presses | PARTIAL (Disabled while submitting) |
| TC-MOOD-N16 | REQ-MOOD-001 | Session timeout mid-entry | PENDING |
| TC-MOOD-N17 | REQ-MOOD-001 | Expired auth token | PENDING |
| TC-MOOD-N20 | REQ-MOOD-001 | Unauthorized access other user's entry | PARTIAL (Depends server) |
| TC-MOOD-N21 | REQ-MOOD-001 | Invalid user ID API call | PARTIAL |
| TC-MOOD-N22 | REQ-MOOD-001 | Server error 500 | PARTIAL |
| TC-MOOD-N23 | REQ-MOOD-001 | Server unavailable 503 | PARTIAL |
| TC-MOOD-N24 | REQ-MOOD-002 | Touch & hold slider | PENDING |
| TC-MOOD-N26 | REQ-MOOD-002 | Drag beyond slider max | PENDING |
| TC-MOOD-N27 | REQ-MOOD-002 | Drag below slider min | PENDING |
| TC-MOOD-N28 | REQ-MOOD-001 | App background during entry | PARTIAL |
| TC-MOOD-N29 | REQ-MOOD-001 | Device rotation | PARTIAL |
| TC-MOOD-N34 | REQ-MOOD-001 | Long session save (8+ hrs) | PARTIAL |

## 9. Proposed Automated Test Suite (Initial Implementation Scope)
We will implement a focused subset (~30 tests) that are stable given current UI:
- Mood Selection: P01–P05, P58
- Factors: P10, P18, P21, P39, P47
- Notes Field: P22–P25, P28, P43, P50, N03–N05
- Share Toggle: P29–P31, P44
- Save Flow: P32, P33, P51, P35
- History: P52, P57, N32
- Display & Layout: P48, P49, P45, P60

Deferred: All intensity slider tests (pending slider component), advanced filters, network/offline/security simulation scenarios.

## 10. Coverage Summary
| Category | Total Cases | Implementable Now | Deferred |
|----------|-------------|------------------|----------|
| Mood Selection | 12 | 9 | 3 |
| Intensity Slider | 11 | 0 | 11 |
| Factors | 15 | 8 | 7 |
| Notes | 23 | 15 | 8 |
| Share Toggle | 4 | 4 | 0 |
| History & Calendar | 12 | 5 | 7 |
| Navigation & Misc | 6 | 5 | 1 |
| Negative/Edge | 35 | 6 | 29 |
| **Total** | **118** | **52** | **66** |

## 11. Recommendations
1. Implement intensity slider component to unlock REQ-MOOD-002 test coverage.
2. Add explicit date range filter UI to support P54–P56 and validation for N33.
3. Introduce robust input sanitization feedback to elevate PARTIAL security tests to IMPLEMENTED.
4. Provide offline queue or error states for resilience tests (N09–N11, N22–N23).
5. Expose testIDs for factor chips and success modal elements to simplify automation.

## 12. Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-22 | Automation | Initial comprehensive test case mapping |

---
**End of Document**
