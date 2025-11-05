/**
 * Component Test - TimePickerModal
 * Tests time picker modal functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TimePickerModal from '../../components/TimePickerModal';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('TimePickerModal Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"12:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );
    expect(getByTestId('time-picker-modal')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={false}
          value={"12:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );
    expect(queryByTestId('time-picker-modal')).toBeNull();
  });

  it('should display hour and minute pickers', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"00:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );
    expect(getByTestId('hour-picker')).toBeTruthy();
    expect(getByTestId('minute-picker')).toBeTruthy();
  });

  it('should call onConfirm with selected time', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"14:30"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('confirm-time-button'));
    expect(mockOnSelect).toHaveBeenCalledWith("14:30");
  });

  it('should call onDismiss when cancel is pressed', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"12:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('cancel-time-button'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should initialize with provided time', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"09:15"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('confirm-time-button'));
    expect(mockOnSelect).toHaveBeenCalledWith("09:15");
  });

  it('should update time when pickers change', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"00:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    );

    // Simulate scroll ending at specific positions to select hour and minute
    fireEvent(getByTestId('hour-picker'), 'onMomentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 16 * 44 } },
    });
    fireEvent(getByTestId('minute-picker'), 'onMomentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 * 44 } },
    });

    fireEvent.press(getByTestId('confirm-time-button'));
    expect(mockOnSelect).toHaveBeenCalledWith("16:45");
  });

  it('should match snapshot', () => {
    const tree = render(
      <ThemeProvider>
        <TimePickerModal
          visible={true}
          value={"12:00"}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
