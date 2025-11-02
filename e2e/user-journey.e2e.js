/**
 * E2E Test: Complete User Journey - Mood Tracking to Journal
 * This test simulates a real user flow through the app
 */

describe('SafeSpace App - User Journey E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Onboarding and Authentication Flow', () => {
    it('should complete onboarding and sign up', async () => {
      // Navigate through onboarding
      await expect(element(by.id('onboarding-screen'))).toBeVisible();
      await element(by.id('skip-onboarding-button')).tap();

      // Sign up
      await expect(element(by.id('signup-screen'))).toBeVisible();
      await element(by.id('first-name-input')).typeText('Test');
      await element(by.id('last-name-input')).typeText('User');
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('SecurePass123!');
      await element(by.id('signup-button')).tap();

      // Verify navigation to home
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should login with existing credentials', async () => {
      await element(by.id('skip-onboarding-button')).tap();
      await element(by.id('go-to-login-button')).tap();

      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('SecurePass123!');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Mood Tracking Flow', () => {
    beforeEach(async () => {
      // Assume user is logged in
      await element(by.id('mood-tracking-tab')).tap();
    });

    it('should log a mood entry', async () => {
      await expect(element(by.id('mood-logging-screen'))).toBeVisible();

      // Select mood
      await element(by.id('mood-happy')).tap();

      // Set intensity
      await element(by.id('intensity-slider')).swipe('right', 'fast', 0.7);

      // Add note
      await element(by.id('mood-note-input')).typeText('Had a great therapy session today!');

      // Submit
      await element(by.id('submit-mood-button')).tap();

      // Verify success message
      await expect(element(by.text('Mood logged successfully'))).toBeVisible();
    });

    it('should view mood history', async () => {
      await element(by.id('view-history-button')).tap();
      await expect(element(by.id('mood-history-screen'))).toBeVisible();

      // Verify mood entries are displayed
      await expect(element(by.id('mood-entry-1'))).toBeVisible();
    });
  });

  describe('Journal Entry Flow', () => {
    beforeEach(async () => {
      await element(by.id('journal-tab')).tap();
    });

    it('should create a journal entry', async () => {
      await element(by.id('create-journal-button')).tap();
      await expect(element(by.id('journal-create-screen'))).toBeVisible();

      // Fill in journal details
      await element(by.id('journal-title-input')).typeText('My Daily Reflection');
      await element(by.id('journal-content-input')).typeText(
        'Today I practiced mindfulness and it helped me manage my anxiety better.'
      );

      // Save journal
      await element(by.id('save-journal-button')).tap();

      // Verify success
      await expect(element(by.text('Journal entry saved'))).toBeVisible();

      // Verify entry appears in history
      await expect(element(by.text('My Daily Reflection'))).toBeVisible();
    });

    it('should edit an existing journal entry', async () => {
      // Tap on existing entry
      await element(by.id('journal-entry-1')).tap();
      await element(by.id('edit-journal-button')).tap();

      // Edit content
      await element(by.id('journal-content-input')).clearText();
      await element(by.id('journal-content-input')).typeText('Updated content here');

      await element(by.id('save-journal-button')).tap();

      // Verify update
      await expect(element(by.text('Updated content here'))).toBeVisible();
    });

    it('should delete a journal entry', async () => {
      await element(by.id('journal-entry-1')).tap();
      await element(by.id('delete-journal-button')).tap();

      // Confirm deletion
      await expect(element(by.text('Are you sure?'))).toBeVisible();
      await element(by.text('Delete')).tap();

      // Verify entry is removed
      await expect(element(by.id('journal-entry-1'))).not.toBeVisible();
    });
  });

  describe('Appointment Booking Flow', () => {
    beforeEach(async () => {
      await element(by.id('appointments-tab')).tap();
    });

    it('should book an appointment', async () => {
      await element(by.id('book-appointment-button')).tap();

      // Select therapist
      await element(by.id('therapist-dropdown')).tap();
      await element(by.text('Dr. Sarah Smith')).tap();

      // Select date
      await element(by.id('date-picker')).tap();
      // Tap on a future date (this depends on your date picker implementation)
      await element(by.text('15')).tap();
      await element(by.text('OK')).tap();

      // Select time
      await element(by.id('time-slot-10am')).tap();

      // Confirm booking
      await element(by.id('confirm-booking-button')).tap();

      // Verify confirmation
      await expect(element(by.text('Appointment booked successfully'))).toBeVisible();
    });

    it('should view appointment details', async () => {
      await element(by.id('appointment-1')).tap();
      await expect(element(by.id('appointment-detail-screen'))).toBeVisible();
      await expect(element(by.text('Dr. Sarah Smith'))).toBeVisible();
    });
  });

  describe('Profile and Settings Flow', () => {
    beforeEach(async () => {
      await element(by.id('profile-tab')).tap();
    });

    it('should edit profile information', async () => {
      await element(by.id('edit-profile-button')).tap();

      await element(by.id('phone-input')).typeText('1234567890');
      await element(by.id('save-profile-button')).tap();

      await expect(element(by.text('Profile updated'))).toBeVisible();
    });

    it('should navigate to help and support', async () => {
      await element(by.id('help-support-button')).tap();
      await expect(element(by.id('help-support-screen'))).toBeVisible();
    });

    it('should logout successfully', async () => {
      await element(by.id('settings-button')).tap();
      await element(by.id('logout-button')).tap();

      // Confirm logout
      await element(by.text('Logout')).tap();

      // Verify return to login
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Crisis Support Access', () => {
    it('should access crisis support resources', async () => {
      // Crisis support should be accessible from any screen
      await element(by.id('crisis-support-button')).tap();
      await expect(element(by.id('crisis-support-screen'))).toBeVisible();

      // Verify crisis hotline numbers are displayed
      await expect(element(by.text('988'))).toBeVisible();
      await expect(element(by.text('National Suicide Prevention Lifeline'))).toBeVisible();
    });
  });

  describe('Resource Library', () => {
    it('should browse and view resources', async () => {
      await element(by.id('resources-tab')).tap();
      await expect(element(by.id('resources-screen'))).toBeVisible();

      // Filter by category
      await element(by.id('category-filter')).tap();
      await element(by.text('Mental Health')).tap();

      // View resource detail
      await element(by.id('resource-1')).tap();
      await expect(element(by.id('resource-detail-screen'))).toBeVisible();
    });
  });

  describe('Self-Assessment Flow', () => {
    it('should complete a self-assessment', async () => {
      await element(by.id('self-assessment-tab')).tap();

      // Select assessment
      await element(by.id('assessment-phq9')).tap();

      // Answer questions (assuming radio buttons)
      for (let i = 1; i <= 9; i++) {
        await element(by.id(`question-${i}-answer-2`)).tap();
        await element(by.id('next-button')).tap();
      }

      // View results
      await expect(element(by.id('assessment-results'))).toBeVisible();
      await expect(element(by.text(/Moderate/))).toBeVisible();
    });
  });
});
