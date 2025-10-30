/**
 * Allowed Users Database
 * 
 * Manages the list of allowed users in Quick's database.
 * Only admin users can modify this list.
 */

import { waitForQuick } from "./quick";

const COLLECTION_NAME = "allowed_users";

export interface AllowedUser {
  id: string;
  email: string;
  added_by: string;
  added_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all allowed users from the database
 */
export async function getAllowedUsers(): Promise<AllowedUser[]> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(COLLECTION_NAME);
    const users = await collection.find();
    
    console.log('[AllowedUsersDB] Fetched allowed users:', users.length);
    return users as AllowedUser[];
  } catch (error) {
    console.error('[AllowedUsersDB] Failed to fetch allowed users:', error);
    return [];
  }
}

/**
 * Check if a user email is in the allowed users list
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(COLLECTION_NAME);
    
    // Query for exact email match
    const results = await collection
      .where({ email: email.toLowerCase().trim() })
      .find();
    
    const isAllowed = results.length > 0;
    console.log('[AllowedUsersDB] User allowed check:', { email, isAllowed });
    
    return isAllowed;
  } catch (error) {
    console.error('[AllowedUsersDB] Failed to check user:', error);
    return false;
  }
}

/**
 * Add a user to the allowed users list
 */
export async function addAllowedUser(
  email: string,
  addedBy: string
): Promise<AllowedUser | null> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(COLLECTION_NAME);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existing = await collection
      .where({ email: normalizedEmail })
      .find();
    
    if (existing.length > 0) {
      console.log('[AllowedUsersDB] User already exists:', normalizedEmail);
      return existing[0] as AllowedUser;
    }
    
    // Add new user
    const newUser = await collection.create({
      email: normalizedEmail,
      added_by: addedBy,
      added_at: new Date().toISOString(),
    });
    
    console.log('[AllowedUsersDB] Added user:', normalizedEmail);
    return newUser as AllowedUser;
  } catch (error) {
    console.error('[AllowedUsersDB] Failed to add user:', error);
    return null;
  }
}

/**
 * Remove a user from the allowed users list
 */
export async function removeAllowedUser(email: string): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(COLLECTION_NAME);
    
    // Find the user
    const normalizedEmail = email.toLowerCase().trim();
    const results = await collection
      .where({ email: normalizedEmail })
      .find();
    
    if (results.length === 0) {
      console.log('[AllowedUsersDB] User not found:', normalizedEmail);
      return false;
    }
    
    // Delete the user
    await collection.delete(results[0].id);
    console.log('[AllowedUsersDB] Removed user:', normalizedEmail);
    
    return true;
  } catch (error) {
    console.error('[AllowedUsersDB] Failed to remove user:', error);
    return false;
  }
}

/**
 * Seed initial users from an array
 * Useful for migration from JSON file
 */
export async function seedAllowedUsers(
  emails: string[],
  addedBy: string
): Promise<number> {
  let count = 0;
  
  for (const email of emails) {
    const result = await addAllowedUser(email, addedBy);
    if (result) {
      count++;
    }
  }
  
  console.log('[AllowedUsersDB] Seeded users:', count);
  return count;
}



