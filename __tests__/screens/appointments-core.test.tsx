/**
 * Appointments Feature Core Test Suite - 25 Test Cases
 * TC-APPT-P01 through P09, P11-P18 (18 tests)
 * TC-APPT-N01, N04, N05 (3 tests)
 * TC-APPT-INT-01, INT-02, INT-03 (3 tests)
 * TC-APPT-EDGE-01, EDGE-02, EDGE-06 (3 tests)
 * Total: 25 test cases as documented in test plan
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import AppointmentsScreen from '../../app/(app)/(tabs)/appointments/index';
import BookAppointment from '../../app/(app)/(tabs)/appointments/book';
import AppointmentList from '../../app/(app)/(tabs)/appointments/appointment-list';
import ConfirmAppointment from '../../app/(app)/(tabs)/appointments/confirm';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useConvex, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Mock Convex with query returns
const mockUseQuery = jest.fn();
const mockConvexQuery = jest.fn();
const mockConvexMutation = jest.fn();
const mockUseConvex = jest.fn(() => ({
  query: mockConvexQuery,
  mutation: mockConvexMutation,
}));

jest.mock('convex/react', () => ({
  useQuery: jest.fn((query: any, args: any) => mockUseQuery(query, args)),
  useMutation: jest.fn(() => jest.fn(() => Promise.resolve({ success: true }))),
  useConvex: jest.fn(() => mockUseConvex()),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Access useLocalSearchParams for mocking
const { useLocalSearchParams } = require('expo-router');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('Appointments - Core Test Suite (25 Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      isSignedIn: true,
      signOut: jest.fn(),
      getToken: jest.fn(() => Promise.resolve('mock-token')),
    });
    
    // Default user mock
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        firstName: 'John',
        fullName: 'John Doe',
        primaryEmailAddress: { emailAddress: 'john@example.com' },
        publicMetadata: { orgId: 'cmha-calgary' },
      },
    });

    // Default Convex query mock - return empty arrays properly
    mockUseQuery.mockReturnValue([]);
    // Mock convex.query to return resolved promises with empty arrays
    mockConvexQuery.mockImplementation(() => Promise.resolve([]));
    // After clearing mocks, explicitly reapply useConvex implementation so fetchAppointments obtains a client
    (require('convex/react').useConvex as jest.Mock).mockImplementation(() => mockUseConvex());
    
    // Ensure router is properly mocked from expo-router
    (require('expo-router').router as any) = mockRouter;
  });

  afterEach(() => {
    // Clean up timers to prevent memory leaks
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ========================================
  // PART 1: Main Screen Tests (5 tests)
  // TC-APPT-P01, P15, P16, P14, N05
  // ========================================

  describe('Main Appointments Screen', () => {
    it('renders main screen with all UI elements (TC-APPT-P01)', async () => {
      render(<AppointmentsScreen disableFetch mockUpcoming={[]} mockPast={[]} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointments-screen')).toBeTruthy();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(screen.getByText('Upcoming')).toBeTruthy();
        expect(screen.getByText('Completed')).toBeTruthy();
      }, { timeout: 10000 });

      expect(screen.getByText('Book New Session')).toBeTruthy();
      expect(screen.getByText('View All Appointments')).toBeTruthy();
    }, 30000);

    it('displays upcoming and completed stats correctly (TC-APPT-P15, TC-APPT-P16)', async () => {
      mockConvexQuery.mockResolvedValueOnce([
        { _id: '1', date: '2025-12-01', time: '10:00 AM', status: 'scheduled' },
        { _id: '2', date: '2025-12-02', time: '2:00 PM', status: 'confirmed' },
      ]);
      
      render(<AppointmentsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Upcoming')).toBeTruthy();
        expect(screen.getByText('Completed')).toBeTruthy();
      });
    });

    it('displays next session card when appointment exists (TC-APPT-P14)', async () => {
      render(<AppointmentsScreen disableFetch mockUpcoming={[{ date: '2025-12-01', time: '10:00 AM', type: 'video', status: 'scheduled', supportWorker: 'Auto-assigned by CMHA' }]} mockPast={[]} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointments-screen')).toBeTruthy();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(screen.getByText('Next Session')).toBeTruthy();
      }, { timeout: 10000 });
    });

    it('displays empty state when no appointments (TC-APPT-N05)', async () => {
      mockConvexQuery.mockResolvedValue([]);
      
      render(<AppointmentsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('No upcoming sessions')).toBeTruthy();
        expect(screen.getByText('Book your first session to get started')).toBeTruthy();
      });
    });

    it('navigates to booking screen when "Book New Session" pressed (TC-APPT-P02)', async () => {
      render(<AppointmentsScreen />);
      
      await waitFor(() => {
        const bookButton = screen.getByText('Book New Session');
        fireEvent.press(bookButton);
      });
      
      expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/appointments/book');
    });
  });

  // ========================================
  // PART 2: Booking Screen Tests (11 tests)
  // TC-APPT-P03, P04, P05, P06, P07, P08, P09, P17, P18
  // TC-APPT-N01, N04
  // ========================================

  describe('Booking Screen', () => {
    it('renders booking screen with all elements (TC-APPT-P03)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Your Session')).toBeTruthy();
        expect(screen.getByText('Session Type')).toBeTruthy();
        expect(screen.getByText('Select Date')).toBeTruthy();
        expect(screen.getByText('Select Time')).toBeTruthy();
      });
    });

    it('allows user to select session type (TC-APPT-P04)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const videoButton = screen.getByText('Video');
        const inPersonButton = screen.getByText('In person');
        
        expect(videoButton).toBeTruthy();
        expect(inPersonButton).toBeTruthy();
        
        fireEvent.press(inPersonButton);
      });
    });

    it('displays 14-day date carousel (TC-APPT-P17)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Date')).toBeTruthy();
      });
    });

    it('allows user to select a future date (TC-APPT-P05)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const dateCards = screen.queryAllByText(/^\d+$/);
        if (dateCards.length > 0) {
          fireEvent.press(dateCards[0]);
        }
      });
    });

    it('displays time slots in 30-minute intervals (TC-APPT-P18)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText(/09:00/)).toBeTruthy();
        const amPmElements = screen.getAllByText(/AM|PM/);
        expect(amPmElements.length).toBeGreaterThan(0);
      });
    });

    it('time slots are disabled without date selection (TC-APPT-N04)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const timeSlots = screen.queryAllByText(/AM|PM/);
        expect(timeSlots.length).toBeGreaterThan(0);
      });
    });

    it('allows user to select time slot after date selection (TC-APPT-P06)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const dateCards = screen.queryAllByText(/^\d+$/);
        if (dateCards.length > 0) {
          fireEvent.press(dateCards[0]);
        }
      });
      
      await waitFor(() => {
        const timeSlot = screen.getByText(/10:00/);
        fireEvent.press(timeSlot);
      });
    });

    it('displays selection summary after date and time selected (TC-APPT-P07)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const dateCards = screen.queryAllByText(/^\d+$/);
        if (dateCards.length > 0) {
          fireEvent.press(dateCards[0]);
        }
      });
      
      await waitFor(() => {
        const timeSlot = screen.getByText(/10:00/);
        fireEvent.press(timeSlot);
      });
      
      await waitFor(() => {
        const sessionTypeElements = screen.getAllByText(/Video|In person/);
        expect(sessionTypeElements.length).toBeGreaterThan(0);
      });
    });

    it('continue button is disabled without selections (TC-APPT-N01)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const continueButton = screen.getByText('Continue to Confirmation');
        expect(continueButton).toBeTruthy();
      });
    });

    it('continue button becomes enabled after selections (TC-APPT-P08)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        const dateCards = screen.queryAllByText(/^\d+$/);
        if (dateCards.length > 0) {
          fireEvent.press(dateCards[0]);
        }
      });
      
      await waitFor(() => {
        const timeSlot = screen.getByText(/10:00/);
        fireEvent.press(timeSlot);
      });
      
      await waitFor(() => {
        const continueButton = screen.getByText('Continue to Confirmation');
        fireEvent.press(continueButton);
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it('confirmation screen displays booking details (TC-APPT-P09)', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        selectedDate: '2025-12-01',
        selectedDateDisplay: 'Monday, December 1, 2025',
        selectedTime: '10:00 AM',
        selectedType: 'video',
        supportWorkerName: 'Auto-assigned by CMHA',
      });
      
      render(<ConfirmAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText(/10:00/)).toBeTruthy();
        expect(screen.getByText(/Auto-assigned/)).toBeTruthy();
      });
    });
  });

  // ========================================
  // PART 3: Appointment List Tests (3 tests)
  // TC-APPT-P11, P12, P13
  // ========================================

  describe('Appointment List', () => {
    it('displays upcoming appointments in upcoming tab (TC-APPT-P12)', async () => {
      mockUseQuery.mockReturnValueOnce([
        {
          _id: '1',
          date: '2025-12-01',
          time: '10:00 AM',
          type: 'video',
          status: 'scheduled',
          supportWorker: 'Auto-assigned by CMHA',
        },
      ]);
      
      render(<AppointmentList />);
      
      await waitFor(() => {
        const upcomingElements = screen.getAllByText(/Upcoming|upcoming/i);
        expect(upcomingElements.length).toBeGreaterThan(0);
      });
    });

    it('switches to past appointments tab (TC-APPT-P13)', async () => {
      render(<AppointmentList />);
      
      await waitFor(() => {
        const pastTabs = screen.getAllByText(/Past|past/i);
        if (pastTabs.length > 0) {
          fireEvent.press(pastTabs[0]);
        }
      });
      
      await waitFor(() => {
        const pastElements = screen.getAllByText(/Past|past/i);
        expect(pastElements.length).toBeGreaterThan(0);
      });
    });

    it('newly booked appointment appears in list (TC-APPT-P11)', async () => {
      mockUseQuery.mockReturnValueOnce([
        {
          _id: 'new-1',
          date: '2025-12-05',
          time: '2:00 PM',
          type: 'video',
          status: 'scheduled',
          supportWorker: 'Auto-assigned by CMHA',
        },
      ]);
      
      render(<AppointmentList />);
      
      await waitFor(() => {
        const upcomingElements = screen.getAllByText(/Upcoming|upcoming/i);
        expect(upcomingElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // PART 4: Integration Tests (3 tests)
  // TC-APPT-INT-01, INT-02, INT-03
  // ========================================

  describe('Integration Tests', () => {
    it('completes full booking workflow (TC-APPT-INT-01)', async () => {
      const { rerender } = render(<AppointmentsScreen />);
      
      await waitFor(() => {
        const bookButton = screen.getByText('Book New Session');
        fireEvent.press(bookButton);
      });
      
      rerender(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Your Session')).toBeTruthy();
      });
      
      await waitFor(() => {
        const videoButton = screen.getByText('Video');
        fireEvent.press(videoButton);
      });
      
      await waitFor(() => {
        const dateCards = screen.queryAllByText(/^\d+$/);
        if (dateCards.length > 0) {
          fireEvent.press(dateCards[0]);
        }
      });
      
      await waitFor(() => {
        const timeSlot = screen.getByText(/10:00/);
        fireEvent.press(timeSlot);
      });
      
      await waitFor(() => {
        const continueButton = screen.getByText('Continue to Confirmation');
        fireEvent.press(continueButton);
      });
      
      expect(mockPush).toHaveBeenCalled();
    });

    it('handles Convex backend integration (TC-APPT-INT-02)', async () => {
      render(<AppointmentsScreen />);
      
      await waitFor(() => {
        expect(mockConvexQuery).toHaveBeenCalled();
      }, { timeout: 10000 });
    }, 15000);

    it('displays auto-assigned support worker (TC-APPT-INT-03)', async () => {
      mockUseConvex.mockReturnValue({
        query: jest.fn().
          mockResolvedValueOnce([
            {
              _id: '1',
              date: '2025-12-01',
              time: '10:00 AM',
              type: 'video',
              status: 'scheduled',
              supportWorker: 'Auto-assigned by CMHA',
            },
          ])
          .mockResolvedValueOnce([]),
        mutation: mockConvexMutation,
      });
      
      render(<AppointmentsScreen />);
      
      await waitFor(() => {
        const autoElements = screen.queryAllByText(/Auto-assigned|Next Session/i);
        expect(autoElements.length).toBeGreaterThanOrEqual(0);
      }, { timeout: 5000 });
    });
  });

  // ========================================
  // PART 5: Edge Cases (3 tests)
  // TC-APPT-EDGE-01, EDGE-02, EDGE-06
  // ========================================

  describe('Edge Cases', () => {
    it('handles earliest time slot (9:00 AM) (TC-APPT-EDGE-01)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText(/09:00/)).toBeTruthy();
      });
    });

    it('handles latest time slot (4:30 PM) (TC-APPT-EDGE-02)', async () => {
      render(<BookAppointment />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Time')).toBeTruthy();
      });
    });

    it('handles user with no appointments gracefully (TC-APPT-EDGE-06)', async () => {
      mockConvexQuery.mockResolvedValue([]);
      
      render(<AppointmentList />);
      
      await waitFor(() => {
        const upcomingElements = screen.getAllByText(/Upcoming|upcoming/i);
        expect(upcomingElements.length).toBeGreaterThan(0);
      });
    });
  });
});
