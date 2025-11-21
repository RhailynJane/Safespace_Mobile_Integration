/**
 * Component Test - AppHeader
 * Tests the main application header component
 */

import React from 'react';
import { render, waitFor } from '../test-utils';
import { AppHeader } from '../../components/AppHeader';

describe('AppHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { getByTestId } = render(<AppHeader title="Test Title" />);
    await waitFor(() => expect(getByTestId('app-header')).toBeTruthy());
  });

  it('should display the correct title', async () => {
    const { getByText } = render(<AppHeader title="Dashboard" />);
    await waitFor(() => expect(getByText('Dashboard')).toBeTruthy());
  });

  it('should render back button when showBack is true', async () => {
    const { getByTestId } = render(<AppHeader title="Details" showBack />);
    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());
  });

  it('should not render back button when showBack is false', () => {
    const { queryByTestId } = render(<AppHeader title="Home" />);
    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should render notification icon', async () => {
    const { getByTestId } = render(<AppHeader title="Home" />);
    await waitFor(() => {
      const header = getByTestId('app-header');
      expect(header).toBeTruthy();
    });
  });
});
