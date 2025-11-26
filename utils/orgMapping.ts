/**
 * Organization Mapping Utility
 * 
 * Maps user emails to their organization based on domain or explicit configuration.
 * Uses setOrg.json for explicit email-to-org mappings.
 */

// Import the org mapping configuration
import orgConfig from '../setOrg.json';

/**
 * Get organization ID for a user based on their email
 * Priority:
 * 1. Explicit mapping from setOrg.json
 * 2. Email domain-based detection
 * 3. Default fallback
 */
export function getOrgIdFromEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;

  const emailLower = email.toLowerCase();

  // Check explicit mapping from setOrg.json
  if (orgConfig.email && orgConfig.orgId) {
    if (emailLower === orgConfig.email.toLowerCase()) {
      return orgConfig.orgId;
    }
  }

  // Domain-based detection
  if (emailLower.endsWith('@edu.sait.ca') || emailLower.endsWith('@sait.ca')) {
    return 'sait';
  }

  if (emailLower.includes('cmha')) {
    if (emailLower.includes('calgary')) return 'cmha-calgary';
    if (emailLower.includes('edmonton')) return 'cmha-edmonton';
    return 'cmha-calgary'; // Default CMHA org
  }

  // No org detected
  return undefined;
}

/**
 * Validate if a string is a valid org ID
 */
export function isValidOrgId(orgId: string | null | undefined): boolean {
  if (!orgId) return false;
  const validOrgs = ['sait', 'cmha-calgary', 'cmha-edmonton', 'unaffiliated'];
  return validOrgs.includes(orgId);
}
