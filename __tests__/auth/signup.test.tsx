import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import SignupScreen from '../../app/(auth)/signup';
import { apiService } from '../../utils/api';

// Access the exposed Clerk mocks to tweak behavior per test
const clerkModule = require('@clerk/clerk-expo');

jest.spyOn(apiService, 'syncUser').mockResolvedValue({ user: { id: 123 } } as any);
jest.spyOn(apiService, 'createClient').mockResolvedValue({ success: true } as any);

function fillPersonalInfo() {
  fireEvent.changeText(screen.getByPlaceholderText('Enter your First Name'), 'John');
  fireEvent.changeText(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
  fireEvent.changeText(screen.getByPlaceholderText('Enter your Email Address'), 'john.doe@example.com');
  fireEvent.changeText(screen.getByPlaceholderText('Enter your Age (16+)'), '19');
  fireEvent.changeText(screen.getByPlaceholderText('Enter your Phone Number (10 digits)'), '4031234567');
}

function fillPassword(pwd: string, confirm: string = pwd) {
  fireEvent.changeText(screen.getByPlaceholderText('Enter password'), pwd);
  fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), confirm);
}

describe('SignupScreen', () => {
  beforeEach(() => {
    // Reset sign up mock fns between tests
    clerkModule.__signUpMock.create.mockReset().mockResolvedValue({ id: 'signup_mock_id' });
    clerkModule.__signUpMock.prepareEmailAddressVerification.mockReset().mockResolvedValue({ status: 'needs_verification' });
    clerkModule.__signUpMock.attemptEmailAddressVerification.mockReset().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_mock', createdUserId: 'user_mock' });
    clerkModule.__setActiveMock.mockReset().mockResolvedValue(undefined);
  });

  it('completes the happy path signup flow', async () => {
    render(<SignupScreen />);

    // Personal info step
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));

    // Password step shows
    await screen.findByText('Account Setup');
    fillPassword('Passw0rd!');

    fireEvent.press(screen.getByText('Create an Account'));

    // Should call Clerk signUp.create and move to verification step
    await waitFor(() => expect(clerkModule.__signUpMock.create).toHaveBeenCalled());
    await screen.findByText('Verify Your Email');

    // Enter code and verify
    fireEvent.changeText(screen.getByPlaceholderText('000000'), '123456');
    const verifyBtn = screen.getByText('Verify Email');
    expect(verifyBtn).toBeEnabled();
    fireEvent.press(verifyBtn);

    await waitFor(() => expect(clerkModule.__signUpMock.attemptEmailAddressVerification).toHaveBeenCalled());
    await waitFor(() => expect(clerkModule.__setActiveMock).toHaveBeenCalled());

    // Success step appears and backend sync happens
    await screen.findByText('Account Created Successfully! 🎉');
    expect(apiService.syncUser).toHaveBeenCalled();
    expect(apiService.createClient).toHaveBeenCalledWith({ userId: 123 });
  });

  it('shows inline validation errors on missing personal info', async () => {
    render(<SignupScreen />);

    // No input, try continue
    fireEvent.press(screen.getByText('Continue'));

    // Expect several inline errors from PersonalInfoStep
    await screen.findByText('First name is required');
    await screen.findByText('Last name is required');
    await screen.findByText('Email is required');
    await screen.findByText('Age is required');
    await screen.findByText('Phone number is required');
  });

  it('blocks under-16 with an Age Requirement modal', async () => {
    render(<SignupScreen />);

    // Type an under-16 age which triggers immediate modal (in PersonalInfoStep)
    fireEvent.changeText(screen.getByPlaceholderText('Enter your Age (16+)'), '15');

    // Expect the modal to appear
    await screen.findByText('Age Requirement');
    await screen.findByText(/You must be at least 16 years old/i);

    // Close modal
    fireEvent.press(screen.getByText('OK'));
  });

  it('prevents account creation on invalid password and shows requirements modal', async () => {
    render(<SignupScreen />);
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Account Setup');

    // Weak password (missing symbol & number)
    fillPassword('weakpass');
    fireEvent.press(screen.getByText('Create an Account'));

    // Expect requirements modal
    await screen.findByText('Password Requirements');
    await screen.findByText('Please ensure your password meets all requirements');
    fireEvent.press(screen.getByText('OK'));

    // Now fix password mismatch
    fillPassword('Passw0rd!', 'Mismatch1!');
    fireEvent.press(screen.getByText("Create an Account"));
    await screen.findByText("Passwords Don't Match");
    fireEvent.press(screen.getByText('OK'));
  });

  it('surfaces duplicate email error from Clerk', async () => {
    render(<SignupScreen />);
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Account Setup');

    // Arrange Clerk to throw duplicate email error
    clerkModule.__signUpMock.create.mockRejectedValueOnce({
      errors: [{ message: 'Email address already in use' }],
    });

    fillPassword('Passw0rd!');
    fireEvent.press(screen.getByText('Create an Account'));

  await screen.findByText('Error');
  // Message appears in modal and inline error container; accept either by collecting all matches
  const dupMsgs = await screen.findAllByText('Email address already in use');
  expect(dupMsgs.length).toBeGreaterThan(0);
  const okButtons = screen.getAllByText('OK');
  fireEvent.press(okButtons[0]);
  });

  it('handles resend code with cooldown in verification step', async () => {
    render(<SignupScreen />);
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Account Setup');
    fillPassword('Passw0rd!');
    fireEvent.press(screen.getByText('Create an Account'));
    await screen.findByText('Verify Your Email');

    // Click Resend Code
    fireEvent.press(screen.getByText('Resend Code'));

    // Expect cooldown label and modal acknowledgment
  await screen.findByText(/Resend in \d+s/);
  await screen.findByText('Verification Code Sent');
  const okBtns = screen.getAllByText('OK');
  fireEvent.press(okBtns[okBtns.length - 1]);
  });

  it('shows a specific weak password modal when Clerk reports pwned password', async () => {
    render(<SignupScreen />);
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Account Setup');

    // Arrange Clerk to throw pwned password error
    clerkModule.__signUpMock.create.mockRejectedValueOnce({
      errors: [{ code: 'form_password_pwned', message: 'Password has been found in a data breach' }],
    });

    fillPassword('Passw0rd!');
    fireEvent.press(screen.getByText('Create an Account'));

    await screen.findByText('Weak Password');
    await screen.findByText(/data breach/i);
    const ok = screen.getAllByText('OK');
    fireEvent.press(ok[0]);
  });

  it('blocks age 17 in Signup step with 18+ requirement modal', async () => {
    render(<SignupScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Enter your First Name'), 'Jane');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your Email Address'), 'jane.doe@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your Age (16+)'), '17');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your Phone Number (10 digits)'), '4032223344');

    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Age Requirement');
    await screen.findByText(/You must be 18 years or older/i);
    const ok = screen.getAllByText('OK');
    fireEvent.press(ok[0]);
  });

  it('disables Verify Email button until exactly 6 digits are entered', async () => {
    render(<SignupScreen />);
    fillPersonalInfo();
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Account Setup');
    fillPassword('Passw0rd!');
    fireEvent.press(screen.getByText('Create an Account'));
    await screen.findByText('Verify Your Email');

    // Less than 6 digits
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.changeText(codeInput, '12345');
    expect(screen.getByText('Verify Email')).toBeDisabled();

    // Now 6 digits
    fireEvent.changeText(codeInput, '123456');
    expect(screen.getByText('Verify Email')).toBeEnabled();
  });
});
