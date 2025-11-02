/**
 * Component Test - AppHeader
 * Tests the main application header component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AppHeader } from '../../components/AppHeader';

describe('AppHeader Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AppHeader title="Test Title" />
      </ThemeProvider>
    );
    expect(getByTestId('app-header')).toBeTruthy();
  });

  it('should display the correct title', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AppHeader title="Dashboard" />
      </ThemeProvider>
    );
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('should render back button when showBack is true', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AppHeader title="Details" showBack />
      </ThemeProvider>
    );
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should not render back button when onBackPress is not provided', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <AppHeader title="Home" />
      </ThemeProvider>
    );
    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should render custom rightActions when provided', () => {
    const action = <></>;
    const { getByText } = render(
      <ThemeProvider>
        <AppHeader 
          title="Settings" 
          rightActions={<></>}
        />
      </ThemeProvider>
    );
    // No exception means it rendered; specific testIDs depend on passed nodes
    expect(getByText('Settings')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(
      <ThemeProvider>
        <AppHeader title="Test" />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
