// utils/userSync.ts
import type { UserResource as User } from '@clerk/types';

/**
 * Sync user to database (Convex handles this now)
 * This function is deprecated but kept for compatibility
 */
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

    console.log('✅ User sync handled by Convex (ConvexUserSync in _layout.tsx):', {
      clerkId: userData.clerk_user_id,
      email: userData.email,
      name: `${userData.first_name} ${userData.last_name}`.trim()
    });

    // Convex handles user sync via ConvexUserSync component in _layout.tsx
    // No REST API call needed
    return { success: true, source: 'convex' };
    
  } catch (error) {
    console.error('Error in userSync:', error);
    // Don't throw - let Convex handle the sync
    return { success: false, error };
  }
}