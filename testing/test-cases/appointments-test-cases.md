# Appointments Feature Test Cases

## Test Case Summary
Based on current implementation analysis (November 2025)

### Implementation Features:
- Auto-assigned support workers (no worker selection UI)
- Simplified booking: Date, Time, Session Type only
- Session Types: Video Call, In-Person
- 14-day advance booking window
- Time slots: 9:00 AM - 4:30 PM (30-minute intervals)
- Past time validation (Mountain Time)
- Convex backend integration
- Appointment list with Upcoming/Past tabs
- Reschedule functionality
- Cancel appointments

---

## Positive Test Cases

| Test Case ID | Requirement ID | Test Description | Pre-Conditions | Test Steps | Expected Result |
|--------------|----------------|------------------|----------------|------------|-----------------|
| TC-APPT-P01 | REQ-APPT-001 | Verify user can view appointments main screen | User logged in | Navigate to Appointments tab | Main screen displays with "My Appointments" title, Upcoming/Completed stats, "Book New Session" button, "View All Appointments" button |
| TC-APPT-P02 | REQ-APPT-002 | Verify user can access booking screen | User logged in | 1. Navigate to Appointments<br>2. Tap "Book New Session" | Booking screen opens showing "Book Your Session" title, session type options, date selector |
| TC-APPT-P03 | REQ-APPT-003 | Verify user can select session type | User on booking screen | 1. Tap "Video" session type<br>2. Tap "In person" session type | Selected type is highlighted; unselected type shows default state |
| TC-APPT-P04 | REQ-APPT-004 | Verify user can select future date | User on booking screen | 1. View date carousel<br>2. Tap a future date | Selected date is highlighted in orange; time slots appear; past dates are disabled |
| TC-APPT-P05 | REQ-APPT-005 | Verify user can select available time slot | User selected date | 1. View time slot grid<br>2. Tap available time slot | Selected time is highlighted in green; past times for today are disabled |
| TC-APPT-P06 | REQ-APPT-006 | Verify selection summary displays correctly | User selected date and time | View selection summary | Summary shows: "Day, Month Date, Time • Session Type" with checkmark icon |
| TC-APPT-P07 | REQ-APPT-007 | Verify continue button activation | User on booking screen | 1. Don't select date/time<br>2. Select both date and time | Button disabled until both selected; becomes enabled and green when both selected |
| TC-APPT-P08 | REQ-APPT-008 | Verify navigation to confirmation screen | User selected date and time | Tap "Continue to Confirmation" | Navigates to confirmation screen with selected details |
| TC-APPT-P09 | REQ-APPT-009 | Verify confirmation screen displays booking details | User on confirmation screen | View confirmation screen | Shows date, time, session type, auto-assigned worker message, "Confirm Booking" button |
| TC-APPT-P10 | REQ-APPT-010 | Verify successful appointment booking | User on confirmation screen | Tap "Confirm Booking" button | Success modal appears, appointment saved to database, navigates to appointment list |
| TC-APPT-P11 | REQ-APPT-011 | Verify booked appointment appears in list | Appointment just booked | Navigate to "View All Appointments" | New appointment appears in "Upcoming" tab with correct details |
| TC-APPT-P12 | REQ-APPT-012 | Verify upcoming appointments tab displays correctly | User has upcoming appointments | Open appointment list, view "Upcoming" tab | Shows appointments sorted by date/time, displays worker, date, time, type, status |
| TC-APPT-P13 | REQ-APPT-013 | Verify past appointments tab displays correctly | User has past appointments | Open appointment list, tap "Past" tab | Shows completed/past appointments, sorted by recent first |
| TC-APPT-P14 | REQ-APPT-014 | Verify next session card displays on main screen | User has upcoming appointment | Navigate to Appointments main screen | "Next Session" card displays first upcoming appointment with worker, date, time, type |
| TC-APPT-P15 | REQ-APPT-015 | Verify upcoming count updates correctly | User has appointments | View Appointments main screen | "Upcoming" stat shows correct count of future appointments |
| TC-APPT-P16 | REQ-APPT-016 | Verify completed count updates correctly | User has past appointments | View Appointments main screen | "Completed" stat shows correct count of past appointments |
| TC-APPT-P17 | REQ-APPT-017 | Verify 14-day booking window | User on booking screen | View date carousel | Shows next 14 days starting from today (or tomorrow if after 4:30 PM MT) |
| TC-APPT-P18 | REQ-APPT-018 | Verify time slots are 30-minute intervals | User selected date | View time slot grid | Shows slots: 9:00 AM, 9:30 AM, 10:00 AM... up to 4:30 PM |
| TC-APPT-P19 | REQ-APPT-019 | Verify appointment detail navigation | User on appointment list | Tap an appointment card | Navigates to appointment detail screen (if implemented) |
| TC-APPT-P20 | REQ-APPT-020 | Verify cancel appointment functionality | User has upcoming appointment | 1. Open appointment list<br>2. Tap appointment<br>3. Tap "Cancel"<br>4. Confirm cancellation | Appointment status changes to cancelled, removed from upcoming list |

---

## Negative Test Cases

| Test Case ID | Requirement ID | Test Description | Pre-Conditions | Test Steps | Expected Result |
|--------------|----------------|------------------|----------------|------------|-----------------|
| TC-APPT-N01 | REQ-APPT-VAL-001 | Verify continue button disabled without selections | User on booking screen | Don't select date or time, tap continue button area | Button remains disabled (grayed out), no navigation occurs |
| TC-APPT-N02 | REQ-APPT-VAL-002 | Verify cannot select past dates | User on booking screen | Attempt to view/select dates before today | Past dates do not appear in carousel or are disabled |
| TC-APPT-N03 | REQ-APPT-VAL-003 | Verify cannot select past time slots | User selected today's date | Attempt to select time slots before current time | Past time slots are grayed out and non-clickable |
| TC-APPT-N04 | REQ-APPT-VAL-004 | Verify no time slots shown without date selection | User on booking screen, no date selected | View time slot grid | Time slots are disabled or show validation message |
| TC-APPT-N05 | REQ-APPT-VAL-005 | Verify empty state when no appointments | User with no appointments | Navigate to Appointments main screen | Shows "No upcoming sessions" with calendar icon, "Book your first session" message |
| TC-APPT-N06 | REQ-APPT-VAL-006 | Verify error handling for failed booking | User on confirmation screen, backend unavailable | Tap "Confirm Booking" | Error modal displays with appropriate message, booking not saved |
| TC-APPT-N07 | REQ-APPT-VAL-007 | Verify late booking cutoff (after 4:30 PM) | Current time is after 4:30 PM MT | View date carousel on booking screen | Today's date is not available, carousel starts from tomorrow |

---

## Integration Test Cases

| Test Case ID | Requirement ID | Test Description | Pre-Conditions | Test Steps | Expected Result |
|--------------|----------------|------------------|----------------|------------|-----------------|
| TC-APPT-INT-01 | REQ-APPT-INT-001 | Verify complete booking workflow | User logged in | 1. Navigate to Appointments<br>2. Tap "Book New Session"<br>3. Select session type<br>4. Select date<br>5. Select time<br>6. Tap Continue<br>7. Review confirmation<br>8. Tap Confirm Booking<br>9. View appointment list | Appointment successfully created and appears in upcoming list with all correct details |
| TC-APPT-INT-02 | REQ-APPT-INT-002 | Verify Convex backend integration | User booking appointment | Complete booking process | Appointment data saved to Convex database, queryable via getUpcomingAppointments API |
| TC-APPT-INT-03 | REQ-APPT-INT-003 | Verify auto-assignment of support worker | User booking appointment | Complete booking, check appointment details | Appointment shows "Auto-assigned by CMHA" or "Auto-assigned by SAIT" based on org |
| TC-APPT-INT-04 | REQ-APPT-INT-004 | Verify real-time updates in appointment list | User with existing appointments | 1. Open appointment list<br>2. Book new appointment<br>3. Return to appointment list | New appointment appears without manual refresh |
| TC-APPT-INT-05 | REQ-APPT-INT-005 | Verify Mountain Time zone handling | User in different timezone | View available time slots, book appointment | Times displayed and stored correctly in Mountain Time (America/Denver) |
| TC-APPT-INT-06 | REQ-APPT-INT-006 | Verify reschedule workflow | User has existing appointment | 1. Navigate to appointment<br>2. Tap "Reschedule"<br>3. Select new date/time<br>4. Confirm | Appointment updated with new date/time, old slot freed |

---

## Accessibility & UI Test Cases

| Test Case ID | Requirement ID | Test Description | Pre-Conditions | Test Steps | Expected Result |
|--------------|----------------|------------------|----------------|------------|-----------------|
| TC-APPT-UI-01 | REQ-APPT-UI-001 | Verify appointments screen has testID | User logged in | Render appointments screen | Screen has testID="appointments-screen" |
| TC-APPT-UI-02 | REQ-APPT-UI-002 | Verify scroll functionality | User on appointment list with many appointments | Scroll through appointment list | List scrolls smoothly, all appointments accessible |
| TC-APPT-UI-03 | REQ-APPT-UI-003 | Verify responsive time slot grid | User on booking screen | View time slots on different screen sizes | Time slots adjust width responsively, maintain 4-column grid |
| TC-APPT-UI-04 | REQ-APPT-UI-004 | Verify visual feedback for selections | User selecting options | Tap session type, date, time | Clear visual feedback (color change, highlighting) for selected items |
| TC-APPT-UI-05 | REQ-APPT-UI-005 | Verify bottom navigation on all screens | User navigating appointment screens | Check bottom navigation | Bottom navigation visible and functional on main, booking, list screens |

---

## Edge Cases & Boundary Test Cases

| Test Case ID | Requirement ID | Test Description | Pre-Conditions | Test Steps | Expected Result |
|--------------|----------------|------------------|----------------|------------|-----------------|
| TC-APPT-EDGE-01 | REQ-APPT-EDGE-001 | Verify earliest available time slot (9:00 AM) | User selected future date | Select 9:00 AM time slot | Slot is selectable and booking succeeds |
| TC-APPT-EDGE-02 | REQ-APPT-EDGE-002 | Verify latest available time slot (4:30 PM) | User selected future date | Select 4:30 PM time slot | Slot is selectable and booking succeeds |
| TC-APPT-EDGE-03 | REQ-APPT-EDGE-003 | Verify boundary at 4:30 PM cutoff | Current time is 4:29 PM MT | View date carousel | Today is still available |
| TC-APPT-EDGE-04 | REQ-APPT-EDGE-004 | Verify boundary at 4:30 PM cutoff | Current time is 4:30 PM MT | View date carousel | Today is not available, starts from tomorrow |
| TC-APPT-EDGE-05 | REQ-APPT-EDGE-005 | Verify 14th day in booking window | User on booking screen | Scroll to end of date carousel | 14th day from today/tomorrow is available |
| TC-APPT-EDGE-06 | REQ-APPT-EDGE-006 | Verify user with maximum appointments | User has many appointments | View appointment list | All appointments load, list performs well |
| TC-APPT-EDGE-07 | REQ-APPT-EDGE-007 | Verify simultaneous slot selection | User rapidly selecting slots | Quickly tap different time slots | Only latest selection is retained, no duplicate selections |

---

## Test Case Statistics

- **Total Test Cases**: 47
- **Positive Tests**: 20
- **Negative Tests**: 7
- **Integration Tests**: 6
- **UI/Accessibility Tests**: 5
- **Edge Cases**: 9

## Priority Classification

- **P1 (Critical)**: TC-APPT-P01, P02, P08, P10, INT-01
- **P2 (High)**: TC-APPT-P03-P07, P09, P11-P16, N01-N04
- **P3 (Medium)**: TC-APPT-P17-P20, N05-N07, INT-02-INT-06
- **P4 (Low)**: All UI and Edge case tests

## Notes

1. **Implementation Changes from Original Requirements**:
   - No support worker selection (auto-assigned)
   - No category selection (simplified flow)
   - No email confirmation mentioned in current implementation
   - Fixed time slots (no dynamic availability from workers)

2. **Mountain Time Zone**:
   - All date/time logic uses America/Denver timezone
   - Critical for time slot validation

3. **Convex Integration**:
   - Uses reactive queries for real-time updates
   - APIs: getUpcomingAppointments, getPastAppointments, createAppointment

4. **Organization Support**:
   - Supports CMHA and SAIT organizations
   - Auto-assignment label changes based on org
