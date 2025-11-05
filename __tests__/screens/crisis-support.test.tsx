import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import CrisisScreen from '../../app/(app)/crisis-support/index';
import { Linking } from 'react-native';

describe('CrisisScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Linking is already mocked globally in jest.setup.cjs
  });

  it('renders crisis support screen correctly', () => {
    render(<CrisisScreen />);
    
    expect(screen.getByText('Crisis Support')).toBeTruthy();
    expect(screen.getByText('Need Immediate Help?')).toBeTruthy();
    expect(screen.getByText(/If you or someone you know is in crisis/i)).toBeTruthy();
  });

  it('displays emergency contact buttons', () => {
    render(<CrisisScreen />);
    
    expect(screen.getByText('Call 911')).toBeTruthy();
    expect(screen.getByText('Emergency Services')).toBeTruthy();
    expect(screen.getByText('Crisis Hotline')).toBeTruthy();
    expect(screen.getByText('Call 988')).toBeTruthy();
    expect(screen.getByText('Distress Center')).toBeTruthy();
    expect(screen.getByText('403-266-4357')).toBeTruthy();
  });

  it('handles 911 emergency call', async () => {
    render(<CrisisScreen />);
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.press(call911Button);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:911');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:911');
    });
  });

  it('handles crisis hotline call', async () => {
    render(<CrisisScreen />);
    
    const crisisButton = screen.getByText('Crisis Hotline');
    fireEvent.press(crisisButton);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:988');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:988');
    });
  });

  it('handles distress center call', async () => {
    render(<CrisisScreen />);
    
    const distressButton = screen.getByText('Distress Center');
    fireEvent.press(distressButton);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:403-266-4357');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:403-266-4357');
    });
  });

  it('handles website navigation', async () => {
    render(<CrisisScreen />);
    
    const websiteButton = screen.getByText('Visit Website');
    fireEvent.press(websiteButton);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://distresscentre.com');
      expect(Linking.openURL).toHaveBeenCalledWith('https://distresscentre.com');
    });
  });

  it('shows error modal when calling is not supported', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    
    render(<CrisisScreen />);
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.press(call911Button);
    
    await waitFor(() => {
      expect(screen.getByText('Call Not Supported')).toBeTruthy();
    });
  });

  it('displays immediate coping strategies', () => {
    render(<CrisisScreen />);
    
    expect(screen.getByText('Immediate Coping Strategies')).toBeTruthy();
    expect(screen.getByText('Take slow, deep breaths')).toBeTruthy();
    expect(screen.getByText('Go to a safe public place')).toBeTruthy();
    expect(screen.getByText('Focus on the next hour only')).toBeTruthy();
    expect(screen.getByText('Reach out to someone you trust')).toBeTruthy();
    expect(screen.getByText('Remove means of self-harm')).toBeTruthy();
    expect(screen.getByText('Use grounding techniques')).toBeTruthy();
  });

  it('displays 5-4-3-2-1 grounding technique', () => {
    render(<CrisisScreen />);
    
    expect(screen.getByText('5-4-3-2-1 Grounding Technique')).toBeTruthy();
    expect(screen.getByText('things you can see around you')).toBeTruthy();
    expect(screen.getByText('things you can touch and feel')).toBeTruthy();
    expect(screen.getByText('things you can hear right now')).toBeTruthy();
    expect(screen.getByText('things you can smell nearby')).toBeTruthy();
    expect(screen.getByText('thing you can taste or would like to taste')).toBeTruthy();
  });

  it('displays remember section', () => {
    render(<CrisisScreen />);
    
    expect(screen.getByText('Remember')).toBeTruthy();
    expect(screen.getByText(/You are not alone/i)).toBeTruthy();
    expect(screen.getByText(/These feelings are temporary/i)).toBeTruthy();
  });

  it('shows loading state during call', async () => {
    (Linking.openURL as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    
    render(<CrisisScreen />);
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.press(call911Button);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeTruthy();
    });
  });

  it('handles call error gracefully', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Call failed'));
    
    render(<CrisisScreen />);
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.press(call911Button);
    
    await waitFor(() => {
      // The modal shows "Call Not Supported" for device capability errors
      expect(screen.getByText('Call Not Supported')).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const tree = render(<CrisisScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
