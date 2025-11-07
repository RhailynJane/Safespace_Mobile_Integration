/**
 * Centralized avatar helpers.
 * getAvatarSource: chooses best image URL, falling back to initials.
 * - Order: explicit profileImageUrl -> imageUrl -> constructed remote (if needed) -> initials.
 */
export interface AvatarInput {
  profileImageUrl?: string;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  clerkId?: string;
  apiBaseUrl?: string; // optional for building full path URLs
}

export interface AvatarResult {
  type: 'image' | 'text';
  value: string; // uri or initials
}

export function getInitials(firstName?: string, lastName?: string, email?: string): string {
  const first = (firstName || email || '').trim().charAt(0);
  const last = (lastName || '').trim().charAt(0);
  const combined = (first + last).toUpperCase();
  return combined || 'U';
}

export function normalizeUrl(raw?: string, clerkId?: string, apiBaseUrl?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('data:image')) return raw; // already a data URI
  if (raw.startsWith('/') && apiBaseUrl) return `${apiBaseUrl}${raw}`;
  // Fallback: if we have a clerkId and it's a non-http short token, attempt profile-image route
  if (clerkId && apiBaseUrl && !raw.includes('/')) {
    return `${apiBaseUrl}/api/users/${encodeURIComponent(clerkId)}/profile-image`;
  }
  return raw; // return as-is
}

export function getAvatarSource(input: AvatarInput): AvatarResult {
  const { profileImageUrl, imageUrl, firstName, lastName, email, clerkId, apiBaseUrl } = input;
  const primary = normalizeUrl(profileImageUrl || imageUrl, clerkId, apiBaseUrl);
  if (primary) return { type: 'image', value: primary };
  return { type: 'text', value: getInitials(firstName, lastName, email) };
}
