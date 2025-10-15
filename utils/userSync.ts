// utils/userSync.ts
import type { UserResource as User } from '@clerk/types';

export async function syncUserWithDatabase(clerkUser: User, authToken?: string) {
  try {
    const userData = {
      clerk_user_id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      phone_number: clerkUser.primaryPhoneNumber?.phoneNumber || null,
      profile_image_url: clerkUser.imageUrl,
      email_verified: clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
      created_at: new Date().toISOString(),
    };

    console.log('Syncing user with database:', userData);

    // Validate required fields
    if (!userData.email) {
      throw new Error('User email is required');
    }

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Only add authorization if token is provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}/api/sync-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clerkUserId: userData.clerk_user_id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phoneNumber: userData.phone_number
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response error:', errorText);
      throw new Error(`Failed to sync user with database: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('User synced successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  }
}