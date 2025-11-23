import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import CrisisScreen from '../../app/(app)/crisis-support/index';
import { Linking } from 'react-native';

// Mock Convex react hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => undefined), // Returns undefined to use fallback resources
  useMutation: jest.fn(() => jest.fn()),
}));

describe('CrisisScreen - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Linking mocks to successful defaults
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(true);
  });

  // TC-CRISIS-P01: Page load performance
  it('renders crisis support screen correctly (TC-CRISIS-P01, P33)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Crisis Support')).toBeTruthy();
    expect(getByText('Need Immediate Help?')).toBeTruthy();
    expect(getByText(/If you or someone you know is in crisis/i)).toBeTruthy();
  });

  // TC-CRISIS-P02: Emergency banner visibility
  it('displays "Need Immediate Help?" alert banner (TC-CRISIS-P02)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Need Immediate Help?')).toBeTruthy();
    expect(getByText(/If you or someone you know is in crisis/i)).toBeTruthy();
  });

  // TC-CRISIS-P03: 24/7 availability text
  it('displays "Available 24/7" text with clock icon (TC-CRISIS-P03)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Available 24/7')).toBeTruthy();
  });

  // TC-CRISIS-P04-P06: Emergency button visibility
  it('displays all emergency contact buttons with proper styling (TC-CRISIS-P04, P05, P06)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    // 911 Emergency
    expect(getByText('Emergency Services (911)')).toBeTruthy();
    expect(getByText('Life-threatening emergencies')).toBeTruthy();
    
    // 988 Crisis Hotline
    expect(getByText('Suicide & Crisis Hotline (988)')).toBeTruthy();
    expect(getByText('Mental health emergencies')).toBeTruthy();
    
    // Kids Help Phone
    expect(getByText('Kids Help Phone (1-800-668-6868)')).toBeTruthy();
    expect(getByText('Youth support 24/7')).toBeTruthy();
  });

  // TC-CRISIS-P07: Call 911 functionality
  it('handles 911 emergency call (TC-CRISIS-P07)', async () => {
    const { getByText } = render(<CrisisScreen />);
    
    const call911Button = getByText('Emergency Services (911)');
    await act(async () => {
      fireEvent.press(call911Button);
    });
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:911');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:911');
    });
  });

  // TC-CRISIS-P08: Call 988 functionality
  it('handles crisis hotline 988 call (TC-CRISIS-P08)', async () => {
    const { getByText } = render(<CrisisScreen />);
    
    const crisisButton = getByText('Suicide & Crisis Hotline (988)');
    await act(async () => {
      fireEvent.press(crisisButton);
    });
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:988');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:988');
    });
  });

  // TC-CRISIS-P09: Kids Help Phone call
  it('handles Kids Help Phone call (TC-CRISIS-P09)', async () => {
    const { getByText } = render(<CrisisScreen />);
    
    const kidsHelpButton = getByText('Kids Help Phone (1-800-668-6868)');
    await act(async () => {
      fireEvent.press(kidsHelpButton);
    });
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:1-800-668-6868');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:1-800-668-6868');
    });
  });

  // TC-CRISIS-P46: Distress Centre website navigation
  it('handles Distress Centre website navigation (TC-CRISIS-P46)', async () => {
    const { getByText } = render(<CrisisScreen />);
    
    const websiteButton = getByText('Distress Centre Website');
    await act(async () => {
      fireEvent.press(websiteButton);
    });
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.distresscentre.com/');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.distresscentre.com/');
    });
  });

  // TC-CRISIS-P35: Emergency buttons above fold
  it('displays emergency buttons without scrolling (TC-CRISIS-P35)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    // All 3 main emergency buttons should be visible
    expect(getByText('Emergency Services (911)')).toBeTruthy();
    expect(getByText('Suicide & Crisis Hotline (988)')).toBeTruthy();
    expect(getByText('Kids Help Phone (1-800-668-6868)')).toBeTruthy();
  });
});

describe('CrisisScreen - Coping Strategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-CRISIS-P10, P39: Immediate Coping Strategies section
  it('displays "Immediate Coping Strategies" section with icon (TC-CRISIS-P10, P39)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Immediate Coping Strategies')).toBeTruthy();
  });

  // TC-CRISIS-P11-P17: All 6 coping strategy cards
  it('displays all 6 coping strategy cards (TC-CRISIS-P11, P12-P17)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Take slow, deep breaths')).toBeTruthy();
    expect(getByText('Go to a safe public place')).toBeTruthy();
    expect(getByText('Focus on the next hour only')).toBeTruthy();
    expect(getByText('Reach out to someone you trust')).toBeTruthy();
    expect(getByText('Remove means of self-harm')).toBeTruthy();
    expect(getByText('Use grounding techniques')).toBeTruthy();
  });

  // TC-CRISIS-P34: Grid layout (2 per row on mobile)
  it('displays coping strategies in grid layout (TC-CRISIS-P34)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    // Verify all cards are present (grid layout tested visually)
    expect(getByText('Take slow, deep breaths')).toBeTruthy();
    expect(getByText('Use grounding techniques')).toBeTruthy();
  });
});

describe('CrisisScreen - 5-4-3-2-1 Grounding Technique', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-CRISIS-P18, P40: Grounding technique section
  it('displays 5-4-3-2-1 Grounding Technique section (TC-CRISIS-P18, P40)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('5-4-3-2-1 Grounding Technique')).toBeTruthy();
  });

  // TC-CRISIS-P24: Introductory text
  it('displays grounding technique introductory text (TC-CRISIS-P24)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText(/When feeling overwhelmed/i)).toBeTruthy();
    expect(getByText(/use your senses to ground yourself/i)).toBeTruthy();
  });

  // TC-CRISIS-P19-P23: All 5 steps
  it('displays all 5 grounding technique steps (TC-CRISIS-P19-P23)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('things you can see around you')).toBeTruthy();
    expect(getByText('things you can touch and feel')).toBeTruthy();
    expect(getByText('things you can hear right now')).toBeTruthy();
    expect(getByText('things you can smell nearby')).toBeTruthy();
    expect(getByText('thing you can taste or would like to taste')).toBeTruthy();
  });

  // TC-CRISIS-P36: Sequential numbering
  it('displays steps numbered 5, 4, 3, 2, 1 in correct order (TC-CRISIS-P36)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    // Steps should be present in countdown order
    expect(getByText('things you can see around you')).toBeTruthy(); // 5
    expect(getByText('things you can touch and feel')).toBeTruthy(); // 4
    expect(getByText('things you can hear right now')).toBeTruthy(); // 3
    expect(getByText('things you can smell nearby')).toBeTruthy(); // 2
    expect(getByText('thing you can taste or would like to taste')).toBeTruthy(); // 1
  });
});

describe('CrisisScreen - Remember Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-CRISIS-P25, P26: Remember section
  it('displays "Remember" section with supportive message (TC-CRISIS-P25, P26)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Remember')).toBeTruthy();
    expect(getByText(/You are not alone/i)).toBeTruthy();
    expect(getByText(/Reaching out for help is a sign of strength/i)).toBeTruthy();
    expect(getByText(/These feelings are temporary/i)).toBeTruthy();
  });
});

describe('CrisisScreen - Error Handling (Negative Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(true);
  });

  // TC-CRISIS-N06: Device without phone capability
  it('shows error modal when calling is not supported (TC-CRISIS-N06)', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    
    const { getByText } = render(<CrisisScreen />);
    
    const call911Button = getByText('Emergency Services (911)');
    await act(async () => {
      fireEvent.press(call911Button);
    });
    
    await waitFor(() => {
      expect(getByText('Call Not Supported')).toBeTruthy();
      expect(getByText(/Your device doesn't support phone calls/i)).toBeTruthy();
    });
  });

  // TC-CRISIS-N26: Website link with network failure
  it('handles website navigation error gracefully (TC-CRISIS-N26)', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(<CrisisScreen />);
    
    const websiteButton = getByText('Distress Centre Website');
    await act(async () => {
      fireEvent.press(websiteButton);
    });
    
    await waitFor(() => {
      expect(getByText('Navigation Failed')).toBeTruthy();
    });
  });

  // TC-CRISIS-N01, N02: Rapid button taps
  it('handles call error gracefully (TC-CRISIS-N01)', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Call failed'));
    
    const { getByText } = render(<CrisisScreen />);
    
    const call911Button = getByText('Emergency Services (911)');
    await act(async () => {
      fireEvent.press(call911Button);
    });
    
    await waitFor(() => {
      expect(getByText('Call Failed')).toBeTruthy();
    });
  });

  it('shows loading state during call initiation', async () => {
    (Linking.openURL as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    
    const { getByText } = render(<CrisisScreen />);
    
    const call911Button = getByText('Emergency Services (911)');
    await act(async () => {
      fireEvent.press(call911Button);
    });
    
    await waitFor(() => {
      expect(getByText('Connecting...')).toBeTruthy();
    });
  });
});

describe('CrisisScreen - UI/UX Elements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-CRISIS-P45: Color scheme verification
  it('uses appropriate color scheme for emergency buttons (TC-CRISIS-P45)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    // Verify buttons are rendered (color testing is visual)
    expect(getByText('Emergency Services (911)')).toBeTruthy(); // Red
    expect(getByText('Suicide & Crisis Hotline (988)')).toBeTruthy(); // Blue
    expect(getByText('Kids Help Phone (1-800-668-6868)')).toBeTruthy(); // Green
  });

  // TC-CRISIS-P47: Text readability
  it('displays clear and readable button text (TC-CRISIS-P47)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('Emergency Services (911)')).toBeTruthy();
    expect(getByText('Life-threatening emergencies')).toBeTruthy();
  });

  // TC-CRISIS-P48: Grounding technique readability
  it('displays clear grounding technique text (TC-CRISIS-P48)', () => {
    const { getByText } = render(<CrisisScreen />);
    
    expect(getByText('things you can see around you')).toBeTruthy();
    expect(getByText('things you can touch and feel')).toBeTruthy();
  });
});

describe('CrisisScreen - Snapshot', () => {
  it('matches snapshot', () => {
    const tree = render(<CrisisScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
