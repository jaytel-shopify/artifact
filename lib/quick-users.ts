"use client";

import { waitForQuick } from "./quick";
import type { User } from "@/types";

/**
 * Quick.db Users Service Layer
 *
 * This module provides CRUD operations for the users collection.
 * Users are created/synced automatically when they authenticate via Quick.id.
 *
 * Note: Quick.db automatically adds these fields to all documents:
 * - id (string): Unique identifier (UUID)
 * - created_at (string): ISO timestamp
 * - updated_at (string): ISO timestamp
 */

const USERS_COLLECTION = "users";

// ==================== USER QUERIES ====================

/**
 * Get a user by their UUID
 */
export async function getUserById(id: string): Promise<User | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  try {
    return await collection.findById(id);
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
 */
export async function getUsersByIds(ids: string[]): Promise<Map<string, User>> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  try {
    const allUsers = await collection.find();
    const userMap = new Map<string, User>();

    const idSet = new Set(ids);
    for (const user of allUsers) {
      if (idSet.has(user.id)) {
        userMap.set(user.id, user);
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
 */
export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  slack_image_url?: string;
  slack_id?: string;
  slack_handle?: string;
  discipline_name?: string;
  team_name?: string;
  group?: string;
  github?: string;
  title?: string;
}): Promise<User> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(USERS_COLLECTION);

  const userData = {
    id: data.id,
    email: data.email.toLowerCase().trim(),
    name: data.name,
    slack_image_url: data.slack_image_url,
    slack_id: data.slack_id,
    slack_handle: data.slack_handle,
    discipline_name: data.discipline_name,
    team_name: data.team_name,
    group: data.group,
    github: data.github,
    title: data.title,
  };

  const user = await collection.create(userData);
  console.log("[Users] Created new user:", { id: user.id, email: user.email });

  return user;
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
  github?: string;
}): Promise<User> {
  // Check if user already exists
  const existingUser = await getUserById(quickIdentity.id);

  if (existingUser) {
    // Optionally update user data if it has changed
    const needsUpdate =
      existingUser.name !== quickIdentity.fullName ||
      existingUser.slack_image_url !== quickIdentity.slackImageUrl ||
      existingUser.slack_id !== quickIdentity.slackId ||
      existingUser.slack_handle !== quickIdentity.slackHandle ||
      existingUser.title !== quickIdentity.title ||
      existingUser.github !== quickIdentity.github;

    if (needsUpdate) {
      const updated = await updateUser(existingUser.id, {
        name: quickIdentity.fullName,
        slack_image_url: quickIdentity.slackImageUrl,
        slack_id: quickIdentity.slackId,
        slack_handle: quickIdentity.slackHandle,
        title: quickIdentity.title,
        github: quickIdentity.github,
      });
      console.log("[Users] Updated existing user:", {
        id: updated.id,
        email: updated.email,
      });
      return updated;
    }

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
    github: quickIdentity.github,
  });
}

// ==================== USER UPDATES ====================

/**
 * Update a user's profile
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<User, "id" | "email" | "created_at" | "updated_at">>
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
    email: normalizedEmail,
    name,
  });
}
