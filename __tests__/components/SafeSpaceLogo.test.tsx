/**
 * Sample Component Test - SafeSpaceLogo
 * This demonstrates functional testing using Jest and React Native Testing Library
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import SafeSpaceLogo from '../../components/SafeSpaceLogo';

describe('SafeSpaceLogo Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(<SafeSpaceLogo />);
    // Add testID to your component for this to work
    // expect(getByTestId('safespace-logo')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(<SafeSpaceLogo />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
