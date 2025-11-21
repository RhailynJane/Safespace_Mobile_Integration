import React from 'react';
import { render, screen } from '../test-utils';
import VideoScreen from '../../app/(app)/video-consultations/index';

describe('VideoScreen', () => {
  it('renders video consultations screen correctly', () => {
    const { getByTestId } = render(<VideoScreen />);
    expect(getByTestId('curved-background')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<VideoScreen />);
    expect(screen.getByText('Loading appointments...')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<VideoScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
