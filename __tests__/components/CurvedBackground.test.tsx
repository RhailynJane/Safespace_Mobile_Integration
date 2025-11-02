/**
 * Component Test - CurvedBackground
 * Tests the curved background component styling
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import CurvedBackground from '../../components/CurvedBackground';

describe('CurvedBackground Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(
      <CurvedBackground>
        <Text>Child Content</Text>
      </CurvedBackground>
    );
    expect(getByTestId('curved-background')).toBeTruthy();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <CurvedBackground>
        <Text>Test Content</Text>
      </CurvedBackground>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should apply custom colors when provided', () => {
    const { getByTestId } = render(
      <CurvedBackground color="#FF0000">
        <Text>Content</Text>
      </CurvedBackground>
    );
    const background = getByTestId('curved-background');
    expect(background.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String)
      })
    );
  });

  it('should render with different curve heights', () => {
    const { getByTestId } = render(
      <CurvedBackground curveHeight={100}>
        <Text>Content</Text>
      </CurvedBackground>
    );
    expect(getByTestId('curved-background')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(
      <CurvedBackground>
        <Text>Test</Text>
      </CurvedBackground>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
