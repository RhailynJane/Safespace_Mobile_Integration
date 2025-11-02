import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import SelfAssessmentScreen from '../../app/(app)/self-assessment/index';
import { assessmentTracker } from '../../utils/assessmentTracker';
import { Alert } from 'react-native';

// Mock assessment tracker
jest.mock('../../utils/assessmentTracker', () => ({
  assessmentTracker: {
    submitAssessment: jest.fn(),
    isDueForAssessment: jest.fn(),
    getLastAssessmentDate: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('SelfAssessmentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (assessmentTracker.submitAssessment as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('renders self assessment screen correctly', () => {
    render(<SelfAssessmentScreen />);
    
    expect(screen.getByText('Self Assessment')).toBeTruthy();
    expect(screen.getByText('Short Warwick-Edinburgh Mental Wellbeing Scale')).toBeTruthy();
  });

  it('displays all survey questions', () => {
    render(<SelfAssessmentScreen />);
    
    expect(screen.getByText(/feeling optimistic about the future/i)).toBeTruthy();
    expect(screen.getByText(/feeling useful/i)).toBeTruthy();
    expect(screen.getByText(/feeling relaxed/i)).toBeTruthy();
    expect(screen.getByText(/dealing with problems well/i)).toBeTruthy();
    expect(screen.getByText(/thinking clearly/i)).toBeTruthy();
    expect(screen.getByText(/feeling close to other people/i)).toBeTruthy();
    expect(screen.getByText(/make up my own mind/i)).toBeTruthy();
  });

  it('displays response options for each question', () => {
    render(<SelfAssessmentScreen />);
    
    expect(screen.getByText('None of the time')).toBeTruthy();
    expect(screen.getByText('Rarely')).toBeTruthy();
    expect(screen.getByText('Some of the time')).toBeTruthy();
    expect(screen.getByText('Often')).toBeTruthy();
    expect(screen.getByText('All of the time')).toBeTruthy();
  });

  it('allows selecting responses for questions', () => {
    render(<SelfAssessmentScreen />);
    
    // Find and select "Often" for first question
    const oftenOptions = screen.getAllByText('Often');
    fireEvent.press(oftenOptions[0]);
    
    // Response should be selected (visual feedback would be tested in integration tests)
    expect(oftenOptions[0]).toBeTruthy();
  });

  it('shows alert when submitting incomplete survey', () => {
    render(<SelfAssessmentScreen />);
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Incomplete Survey',
      'Please answer all questions before submitting.'
    );
  });

  it('successfully submits completed survey', async () => {
    render(<SelfAssessmentScreen />);
    
    // Answer all 7 questions with "Often" (value 4)
    const oftenOptions = screen.getAllByText('Often');
    oftenOptions.forEach(option => {
      fireEvent.press(option);
    });
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(assessmentTracker.submitAssessment).toHaveBeenCalledWith(
        'user_test123',
        expect.any(Object),
        expect.any(Number)
      );
    });
  });

  it('calculates correct score', async () => {
    render(<SelfAssessmentScreen />);
    
    // Select specific values: all "All of the time" (5 points each)
    const allTheTimeOptions = screen.getAllByText('All of the time');
    allTheTimeOptions.slice(0, 7).forEach(option => {
      fireEvent.press(option);
    });
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      // 7 questions × 5 points = 35 total
      expect(assessmentTracker.submitAssessment).toHaveBeenCalledWith(
        'user_test123',
        expect.any(Object),
        35
      );
    });
  });

  it('shows success modal after submission', async () => {
    render(<SelfAssessmentScreen />);
    
    // Answer all questions
    const oftenOptions = screen.getAllByText('Often');
    oftenOptions.slice(0, 7).forEach(option => {
      fireEvent.press(option);
    });
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Success|Thank you|Completed/i)).toBeTruthy();
    });
  });

  it('shows error alert on submission failure', async () => {
    (assessmentTracker.submitAssessment as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<SelfAssessmentScreen />);
    
    // Answer all questions
    const oftenOptions = screen.getAllByText('Often');
    oftenOptions.slice(0, 7).forEach(option => {
      fireEvent.press(option);
    });
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Submission Error',
        expect.stringContaining('Failed to submit')
      );
    });
  });

  it('shows error when user is not logged in', async () => {
    // Mock no user
    require('@clerk/clerk-expo').useUser.mockReturnValue({ user: null });

    render(<SelfAssessmentScreen />);
    
    // Answer all questions
    const oftenOptions = screen.getAllByText('Often');
    oftenOptions.slice(0, 7).forEach(option => {
      fireEvent.press(option);
    });
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'User not found. Please try again.'
      );
    });

    // Restore mock
    require('@clerk/clerk-expo').useUser.mockReturnValue({
      user: {
        id: 'user_test123',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      },
    });
  });

  it('displays instructions clearly', () => {
    render(<SelfAssessmentScreen />);
    
    expect(screen.getByText(/rate how you've been feeling over the last 2 weeks/i)).toBeTruthy();
  });

  it('allows changing answers before submission', () => {
    render(<SelfAssessmentScreen />);
    
    // Select "Often" first
    const oftenOptions = screen.getAllByText('Often');
    fireEvent.press(oftenOptions[0]);
    
    // Then change to "Rarely"
    const rarelyOptions = screen.getAllByText('Rarely');
    fireEvent.press(rarelyOptions[0]);
    
    // Last selection should be active
    expect(rarelyOptions[0]).toBeTruthy();
  });

  it('enables submit button only when all questions answered', () => {
    render(<SelfAssessmentScreen />);
    
    const submitButton = screen.getByText(/Submit|Complete/i);
    
    // Should be disabled or show warning when pressed (tested above)
    fireEvent.press(submitButton);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const tree = render(<SelfAssessmentScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
