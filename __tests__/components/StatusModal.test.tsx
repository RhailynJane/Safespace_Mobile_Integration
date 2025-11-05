/**
 * Component Test - StatusModal
 * Tests status/alert modal functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatusModal from '../../components/StatusModal';

describe('StatusModal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="success"
        title="Success"
        message="Operation successful"
        onClose={mockOnClose}
      />
    );
    expect(getByText('Operation successful')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <StatusModal
        visible={false}
        type="success"
        title="Hidden"
        message="Test"
        onClose={mockOnClose}
      />
    );
    expect(queryByText('Test')).toBeNull();
  });

  it('should display success message correctly', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="success"
        title="Title"
        message="Data saved successfully"
        onClose={mockOnClose}
      />
    );
    expect(getByText('Data saved successfully')).toBeTruthy();
  });

  it('should display error message correctly', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="error"
        title="Error"
        message="An error occurred"
        onClose={mockOnClose}
      />
    );
    expect(getByText('An error occurred')).toBeTruthy();
  });

  it('should display info message correctly', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="info"
        title="Info"
        message="Important information"
        onClose={mockOnClose}
      />
    );
    expect(getByText('Important information')).toBeTruthy();
  });

  it('should call onClose when close button is pressed', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="success"
        title="Close"
        message="Test"
        onClose={mockOnClose}
      />
    );
    
    fireEvent.press(getByText('OK'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call secondary action when provided', () => {
    const onSecondary = jest.fn();
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="success"
        title="Has Secondary"
        message="Test"
        onClose={mockOnClose}
        secondaryButtonText="Confirm"
        onSecondaryButtonPress={onSecondary}
      />
    );
    fireEvent.press(getByText('Confirm'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('should display custom title when provided', () => {
    const { getByText } = render(
      <StatusModal
        visible={true}
        type="success"
        title="Custom Title"
        message="Test message"
        onClose={mockOnClose}
      />
    );
    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('should match snapshot for each type', () => {
    const types = ['success', 'error', 'info'] as const;
    
    types.forEach(type => {
      const tree = render(
        <StatusModal
          visible={true}
          type={type}
          title={type.toUpperCase()}
          message={`${type} message`}
          onClose={mockOnClose}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot(`StatusModal-${type}`);
    });
  });
});
