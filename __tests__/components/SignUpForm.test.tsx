/**
 * Component Test - SignUpDetailsForm and Multi-Step Components
 * Tests signup form components including all steps
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpDetailsForm from '../../components/SignUpDetailsForm';
import PersonalInfoStep from '../../components/PersonalInfoStep';
import EmailVerificationStep from '../../components/EmailVerificationStep';
import PasswordStep from '../../components/PasswordStep';
import SuccessStep from '../../components/SuccessStep';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('SignUpDetailsForm Component', () => {
  it('should render personal info step with progress', () => {
    let data = { firstName: '', lastName: '', email: '', age: '', phoneNumber: '', password: '' } as any;
    const onNext = jest.fn();
    const onUpdate = (patch: any) => { data = { ...data, ...patch }; };
    const { getByText } = render(
      <ThemeProvider>
        <SignUpDetailsForm step="personal" data={data} onUpdate={onUpdate} onNext={onNext} stepNumber={1} />
      </ThemeProvider>
    );
    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByText('Step 1 of 3')).toBeTruthy();
  });

  it('should call onNext when valid data is submitted', async () => {
    const data = { 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'john@example.com', 
      age: '20', 
      phoneNumber: '1234567890', 
      password: '', 
      organization: '' 
    } as any;
    const onNext = jest.fn();
    const onUpdate = jest.fn();
    
    const { getByText } = render(
      <ThemeProvider>
        <SignUpDetailsForm step="personal" data={data} onUpdate={onUpdate} onNext={onNext} stepNumber={1} />
      </ThemeProvider>
    );
    
    // All required fields are already filled in the initial data
    // Just press Continue - SignUpDetailsForm doesn't require organization field
    fireEvent.press(getByText('Continue'));
    
    await waitFor(() => expect(onNext).toHaveBeenCalled());
  });

  it('should match snapshot', () => {
    const data = { firstName: '', lastName: '', email: '', age: '', phoneNumber: '', password: '' } as any;
    const tree = render(
      <ThemeProvider>
        <SignUpDetailsForm step="personal" data={data} onUpdate={()=>{}} onNext={()=>{}} stepNumber={1} />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('PersonalInfoStep Component', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all input fields', () => {
    const data = { firstName: '', lastName: '', email: '', age: '', phoneNumber: '' } as any;
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <PersonalInfoStep data={data} onUpdate={()=>{}} onNext={mockOnNext} stepNumber={1} />
      </ThemeProvider>
    );
    expect(getByPlaceholderText('Enter your First Name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your Last Name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your Email Address')).toBeTruthy();
    expect(getByPlaceholderText('Enter your Age (16+)')).toBeTruthy();
    expect(getByPlaceholderText('Enter your Phone Number (10 digits)')).toBeTruthy();
  });

  it('should validate required fields', () => {
    const data = { firstName: '', lastName: '', email: '', age: '', phoneNumber: '' } as any;
    const { getByText } = render(
      <ThemeProvider>
        <PersonalInfoStep data={data} onUpdate={()=>{}} onNext={mockOnNext} stepNumber={1} />
      </ThemeProvider>
    );
    fireEvent.press(getByText('Continue'));
    expect(getByText('First name is required')).toBeTruthy();
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should call onNext with valid data', async () => {
    const data = { 
      firstName: 'Jane', 
      lastName: 'Smith', 
      email: 'jane@smith.com', 
      age: '25', 
      phoneNumber: '9876543210', 
      organization: 'sait' 
    } as any;
    
    const { getByText } = render(
      <ThemeProvider>
        <PersonalInfoStep data={data} onUpdate={jest.fn()} onNext={mockOnNext} stepNumber={1} />
      </ThemeProvider>
    );
    
    // All required fields including organization are already filled in the initial data
    fireEvent.press(getByText('Continue'));
    
    await waitFor(() => expect(mockOnNext).toHaveBeenCalled());
  });
});

describe('EmailVerificationStep Component', () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnResendCode = jest.fn().mockResolvedValue(undefined);

  it('should render verification code input', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <EmailVerificationStep email="test@example.com" verificationCode="" onUpdate={()=>{}} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} onResendCode={mockOnResendCode} />
      </ThemeProvider>
    );
    expect(getByPlaceholderText('000000')).toBeTruthy();
  });

  it('should call onResendCode when tapping Resend Code', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmailVerificationStep email="test@example.com" verificationCode="" onUpdate={()=>{}} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} onResendCode={mockOnResendCode} />
      </ThemeProvider>
    );
    fireEvent.press(getByText('Resend Code'));
    await waitFor(() => expect(mockOnResendCode).toHaveBeenCalled());
  });

  it('should enable verify when 6-digit code provided', () => {
    let verificationCode = '';
    const onUpdate = (p: any) => { verificationCode = p.verificationCode; };
    const { getByPlaceholderText, getByText, rerender } = render(
      <ThemeProvider>
        <EmailVerificationStep email="test@example.com" verificationCode={verificationCode} onUpdate={(p)=>{ onUpdate(p); rerender(
          <ThemeProvider>
            <EmailVerificationStep email="test@example.com" verificationCode={verificationCode} onUpdate={(p)=>{ onUpdate(p); }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} onResendCode={mockOnResendCode} />
          </ThemeProvider>
        ); }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} onResendCode={mockOnResendCode} />
      </ThemeProvider>
    );
    fireEvent.changeText(getByPlaceholderText('000000'), '123456');
    fireEvent.press(getByText('Verify Email'));
    expect(mockOnNext).toHaveBeenCalled();
  });
});

describe('PasswordStep Component', () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  it('should render password inputs', () => {
    const data = { password: '', confirmPassword: '' } as any;
    const { getByTestId } = render(
      <ThemeProvider>
        <PasswordStep data={data} onUpdate={()=>{}} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
      </ThemeProvider>
    );
    expect(getByTestId('input-password')).toBeTruthy();
    expect(getByTestId('input-confirm-password')).toBeTruthy();
  });

  it('should block weak passwords', () => {
    let data = { password: '', confirmPassword: '' } as any;
    const { getByTestId, getByText, rerender } = render(
      <ThemeProvider>
        <PasswordStep data={data} onUpdate={(p)=>{ data={...data, ...p}; rerender(
          <ThemeProvider>
            <PasswordStep data={data} onUpdate={(p)=>{ data={...data, ...p}; }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
          </ThemeProvider>
        ); }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
      </ThemeProvider>
    );
    fireEvent.changeText(getByTestId('input-password'), 'weak');
    fireEvent.press(getByText('Create an Account'));
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should validate passwords match', () => {
    let data = { password: 'StrongPass123!', confirmPassword: '' } as any;
    const { getByTestId, getByText, rerender } = render(
      <ThemeProvider>
        <PasswordStep data={data} onUpdate={(p)=>{ data={...data, ...p}; rerender(
          <ThemeProvider>
            <PasswordStep data={data} onUpdate={(p)=>{ data={...data, ...p}; }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
          </ThemeProvider>
        ); }} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
      </ThemeProvider>
    );
    fireEvent.changeText(getByTestId('input-confirm-password'), 'DifferentPass123!');
    fireEvent.press(getByText('Create an Account'));
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    const data = { password: 'StrongPass123!', confirmPassword: '' } as any;
    const { getByTestId } = render(
      <ThemeProvider>
        <PasswordStep data={data} onUpdate={()=>{}} onNext={mockOnNext} onBack={mockOnBack} stepNumber={2} />
      </ThemeProvider>
    );
    const toggleButton = getByTestId('toggle-password-visibility');
    const passwordInput = getByTestId('input-password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);
  });
});

describe('SuccessStep Component', () => {
  it('should render success title', () => {
    const { getByText } = render(
      <ThemeProvider>
        <SuccessStep onContinue={() => {}} onSignIn={() => {}} />
      </ThemeProvider>
    );
    expect(getByText(/Account Created Successfully/i)).toBeTruthy();
  });
});
