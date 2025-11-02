/**
 * Component Test - OptimizedImage
 * Tests optimized image component with lazy loading
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
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
      <OptimizedImage source={mockImageSource} />
    );
    expect(getByTestId('image-loading-indicator')).toBeTruthy();
  });

  it('should hide loading indicator after image loads', async () => {
    const { queryByTestId, getByTestId } = render(
      <OptimizedImage source={mockImageSource} />
    );
    
    const image = getByTestId('optimized-image');
    fireEvent(image, 'onLoadEnd');
    
    await waitFor(() => {
      expect(queryByTestId('image-loading-indicator')).toBeNull();
    });
  });

  it('should handle image load error gracefully', async () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} />
    );
    
    const image = getByTestId('optimized-image');
    fireEvent(image, 'onError');
    
    await waitFor(() => {
      expect(getByTestId('image-error-placeholder')).toBeTruthy();
    });
  });

  it('should apply custom styles', () => {
    const customStyle = { width: 200, height: 200, borderRadius: 10 };
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} style={customStyle} />
    );
    
    const image = getByTestId('optimized-image');
    expect(image.props.style).toMatchObject(customStyle);
  });

  it('should accept resizeMode prop without crashing', () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockImageSource} resizeMode="cover" />
    );
    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(
      <OptimizedImage source={mockImageSource} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
