/**
 * Component Test - BottomNavigation
 * Tests the bottom navigation bar functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BottomNavigation from '../../components/BottomNavigation';

describe('BottomNavigation Component', () => {
  const tabs = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'appointments', name: 'Appointments', icon: 'calendar' },
    { id: 'community-forum', name: 'Community', icon: 'people' },
    { id: 'messages', name: 'Messages', icon: 'chatbubbles' },
    { id: 'profile', name: 'Profile', icon: 'person' },
  ];
  const mockOnTabPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    );
    expect(getByTestId('bottom-navigation')).toBeTruthy();
  });

  it('should render all navigation tabs', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    );
    
    expect(getByTestId('nav-tab-home')).toBeTruthy();
    expect(getByTestId('nav-tab-appointments')).toBeTruthy();
    expect(getByTestId('nav-tab-community-forum')).toBeTruthy();
    expect(getByTestId('nav-tab-messages')).toBeTruthy();
    expect(getByTestId('nav-tab-profile')).toBeTruthy();
  });

  it('should highlight the active tab', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="appointments" onTabPress={mockOnTabPress} />
    );
    
    const activeTab = getByTestId('nav-tab-appointments');
    expect(activeTab.props.accessibilityState?.selected).toBe(true);
  });

  it('should call onNavigate when tab is pressed', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    );
    
    fireEvent.press(getByTestId('nav-tab-messages'));
    expect(mockOnTabPress).toHaveBeenCalledWith('messages');
  });

  it('should not navigate when pressing already active tab', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    );
    
    fireEvent.press(getByTestId('nav-tab-home'));
    expect(mockOnTabPress).toHaveBeenCalledWith('home');
  });

  it('should display correct icons for each tab', () => {
    const { getByTestId } = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    );
    
    expect(getByTestId('nav-icon-home')).toBeTruthy();
    expect(getByTestId('nav-icon-appointments')).toBeTruthy();
    expect(getByTestId('nav-icon-community-forum')).toBeTruthy();
    expect(getByTestId('nav-icon-messages')).toBeTruthy();
    expect(getByTestId('nav-icon-profile')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(
      <BottomNavigation tabs={tabs} activeTab="home" onTabPress={mockOnTabPress} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
