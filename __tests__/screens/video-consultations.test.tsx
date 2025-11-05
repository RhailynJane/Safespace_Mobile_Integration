import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import VideoScreen from '../../app/(app)/video-consultations/index';

describe('VideoScreen', () => {
  it('renders video consultations screen correctly', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/Video Consultation|Video Call/i)).toBeTruthy();
  });

  it('displays upcoming appointments', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/Eric Young|Upcoming|Appointment/i)).toBeTruthy();
  });

  it('shows join meeting button', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/Join|Start|Meeting/i)).toBeTruthy();
  });

  it('navigates to video call screen when join button pressed', () => {
    render(<VideoScreen />);
    
    const joinButton = screen.getByText(/Join|Start/i);
    fireEvent.press(joinButton);
    
    expect(require('expo-router').router.push).toHaveBeenCalledWith(
      expect.stringContaining('video-call')
    );
  });

  it('displays technical requirements', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/Requirements|Camera|Microphone/i)).toBeTruthy();
  });

  it('shows appointment time and date', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/10:30 AM|October/i)).toBeTruthy();
  });

  it('displays support worker information', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText('Eric Young')).toBeTruthy();
  });

  it('shows appointment status', () => {
    render(<VideoScreen />);
    
    expect(screen.getByText(/Upcoming|Scheduled/i)).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<VideoScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
