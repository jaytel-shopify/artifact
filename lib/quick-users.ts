"use client";

import { waitForQuick } from "./quick";
import type { User } from "@/types";

const USERS_COLLECTION = "users";

// ==================== USER QUERIES ====================

/**
 * Get a user by their Quick.id (stored in the `id` field)
 *
 * Note: Quick.db auto-generates UUIDs for document IDs, but we store the
 * Quick.id (numeric ID from quick.id.waitForUser()) in the `id` field.
 * This function queries by the `id` field value, not the document ID.
 * 
 * Also checks the `quick_id` backup field for newer users where Quick.db
 * may have overwritten the `id` field.
 */
export async function getUserById(id: string): Promise<User | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  try {
    // First try to find by the id field (Quick identity ID)
    const results = await collection.where({ id }).find();
    if (results.length > 0) {
      return results[0];
    }
    
    // Fallback 1: try to find by quick_id field (backup for newer users)
    const quickIdResults = await collection.where({ quick_id: id }).find();
    if (quickIdResults.length > 0) {
      // Return with the expected id value
      return {
        ...quickIdResults[0],
        id, // Ensure we return the Quick identity ID
      };
    }
    
    // Fallback 2: try to find by document ID (in case Quick.db used our id as the doc ID)
    try {
      const doc = await collection.findById(id);
      if (doc) {
        return doc;
      }
    } catch {
      // Document not found by ID, continue
    }
    
    return null;
  } catch (error) {
    console.error("[Users] User not found by ID:", id, error);
    return null;
  }
}

/**
 * Get a user by their email address
 * Email is case-insensitive (normalized to lowercase)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const results = await collection.where({ email: normalizedEmail }).find();
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("[Users] Failed to find user by email:", email, error);
    return null;
  }
}

/**
 * Get multiple users by their IDs
 * Useful for batch lookups (e.g., resolving creator_ids)
 * Uses $in query for efficient batch fetching
 * Also checks quick_id field for newer users where Quick.db may have overwritten id
 */
export async function getUsersByIds(ids: string[]): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();

  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);
  const userMap = new Map<string, User>();

  try {
    // First try to find by the id field
    const usersByIdField = await collection.where({ id: { $in: ids } }).find();
    for (const user of usersByIdField) {
      userMap.set(user.id, user);
    }

    // Find IDs that weren't found by the id field
    const missingIds = ids.filter(id => !userMap.has(id));
    
    if (missingIds.length > 0) {
      // Fallback: try to find by quick_id field
      const usersByQuickId = await collection.where({ quick_id: { $in: missingIds } }).find();
      for (const user of usersByQuickId) {
        // Use quick_id as the map key (the ID we were looking for)
        const quickId = user.quick_id;
        if (quickId && missingIds.includes(quickId)) {
          userMap.set(quickId, { ...user, id: quickId });
        }
      }
    }

    return userMap;
  } catch (error) {
    console.error("[Users] Failed to get users by IDs:", error);
    return new Map();
  }
}

// ==================== USER CREATION ====================

/**
 * Create a new user record
 * Email is normalized to lowercase for consistency
 * 
 * Note: Quick.db may auto-generate a document ID that differs from our user ID.
 * We store the Quick identity ID in both `id` and `quick_id` fields for redundancy.
 */
export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  slack_image_url?: string;
  slack_id?: string;
  slack_handle?: string;
  title?: string;
}): Promise<User> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  const userData = {
    id: data.id,
    quick_id: data.id, // Backup field in case Quick.db overwrites id
    email: data.email.toLowerCase().trim(),
    name: data.name,
    slack_image_url: data.slack_image_url,
    slack_id: data.slack_id,
    slack_handle: data.slack_handle,
    title: data.title,
  };

  const createdDoc = await collection.create(userData);

  (window as any).quicklytics?.track("create_user", {
    user_id: userData.id,
    user_email: userData.email,
    user_name: userData.name,
  });

  // Return with our expected ID regardless of what Quick.db returned
  return {
    ...createdDoc,
    id: userData.id,
  };
}

/**
 * Get or create a user from Quick.id identity data
 * This is the main entry point during authentication
 *
 * @param quickIdentity - User data from quick.id.waitForUser()
 * @returns The user record (existing or newly created)
 */
export async function getOrCreateUser(quickIdentity: {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  slackImageUrl?: string;
  slackId?: string;
  slackHandle?: string;
  title?: string;
}): Promise<User> {
  // Check if user already exists by ID
  const existingUser = await getUserById(quickIdentity.id);

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  return await createUser({
    id: quickIdentity.id,
    email: quickIdentity.email,
    name: quickIdentity.fullName,
    slack_image_url: quickIdentity.slackImageUrl,
    slack_id: quickIdentity.slackId,
    slack_handle: quickIdentity.slackHandle,
    title: quickIdentity.title,
  });
}

// ==================== USER UPDATES ====================

/**
 * Update a user's profile
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<User, "id" | "email">>
): Promise<User> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  await collection.update(id, updates);
  return await collection.findById(id);
}

// ==================== USER UTILITIES ====================

/**
 * Get all users (for admin/debugging)
 */
export async function getAllUsers(): Promise<User[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  return await collection.find();
}

/**
 * Check if a user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== null;
}

/**
 * Create a user from email only (for migration purposes)
 * Creates a minimal user record when we only have an email
 */
export async function createUserFromEmail(email: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to extract name from email (before @)
  const namePart = normalizedEmail.split("@")[0] || "Unknown User";
  const name = namePart
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return await createUser({
    id: normalizedEmail,
    email: normalizedEmail,
    name,
  });
}
