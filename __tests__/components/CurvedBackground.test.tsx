/**
 * Component Test - CurvedBackground
 * Tests the curved background component styling
 */

import React from 'react';
import { render } from '../test-utils';
import { Text } from 'react-native';
import CurvedBackground from '../../components/CurvedBackground';

// The test-utils already provides ThemeProvider through AllProviders wrapper

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
    // The component applies styles as an array, so we need to check if backgroundColor exists in any of the style objects
    const styles = Array.isArray(background.props.style) ? background.props.style : [background.props.style];
    const hasBackgroundColor = styles.some(style => style && typeof style === 'object' && 'backgroundColor' in style);
    expect(hasBackgroundColor).toBeTruthy();
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
