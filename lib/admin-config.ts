/**
 * Admin Configuration
 * 
 * Hardcoded list of admin users who have full access to Artifact
 * and can manage the allowlist of other users.
 * 
 * Admins can:
 * - Access the admin panel (press '?' key)
 * - Add/remove users from the allowed users database
 * - Always have access regardless of database state
 */

export const ADMIN_USERS = ['jaytel.provence@shopify.com'];

/**
 * Check if a user email is an admin
 */
export function isAdmin(email: string): boolean {
  return ADMIN_USERS.includes(email.toLowerCase().trim());
}


