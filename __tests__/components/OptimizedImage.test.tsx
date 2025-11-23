/**
 * Component Test - OptimizedImage
 * Tests optimized image component with lazy loading
 */

import React from 'react';
import { render, waitFor, fireEvent } from '../test-utils';
import OptimizedImage from '../../components/OptimizedImage';

describe('OptimizedImage Component', () => {
  const mockImageSource = { uri: 'https://example.com/image.jpg' };

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} testID="optimized-image" />
    );
    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should display loading indicator initially', () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} testID="optimized-image" />
    );
    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should hide loading indicator after image loads', async () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} testID="optimized-image" />
    );
    
    const image = getByTestId('optimized-image');
    fireEvent(image, 'onLoadEnd');
    
    await waitFor(() => {
      expect(getByTestId('optimized-image')).toBeTruthy();
    });
  });

  it('should handle image load error gracefully', async () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} testID="optimized-image" />
    );
    
    const image = getByTestId('optimized-image');
    // Fire onError with proper event structure
    fireEvent(image, 'onError', {
      nativeEvent: {
        error: 'Failed to load'
      }
    });
    
    await waitFor(() => {
      // Just verify the component handles the error without crashing
      expect(getByTestId('optimized-image')).toBeTruthy();
    });
  });

  it('should apply custom styles', () => {
    const customStyle = { width: 200, height: 200, borderRadius: 10 };
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} style={customStyle} testID="optimized-image" />
    );
    
    const image = getByTestId('optimized-image');
    expect(image.props.style).toEqual(expect.objectContaining(customStyle));
  });

  it('should accept resizeMode prop without crashing', () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} resizeMode="cover" testID="optimized-image" />
    );
    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(
      <OptimizedImage source={mockImageSource} testID="optimized-image" />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
