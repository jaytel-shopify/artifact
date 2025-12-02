/**
 * Access Control System
 *
 * Unified access control for both projects and folders.
 * Supports three permission levels: owner, editor, viewer
 *
 * All lookups are done by user_id.
 */

import { waitForQuick } from "./quick";
import { getResourceUrl } from "./urls";
import type { User } from "@/types";
import { getProjectsInFolder } from "./quick-folders";

export const ACCESS_LEVELS = {
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const RESOURCE_TYPES = { PROJECT: "project", FOLDER: "folder" } as const;
export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

export interface AccessEntry {
  id: string;
  resource_id: string; // project_id or folder_id
  resource_type: ResourceType;
  user_id: string; // Primary identifier - User.id
  user_email: string; // Kept for display purposes
  user_name?: string;
  user_avatar?: string;
  access_level: AccessLevel;
  granted_by: string; // User.id of who granted access
  created_at: string;
  updated_at: string;
}

const ACCESS_COLLECTION = "access_control";

// ==================== USER SEARCH ====================

/**
 * Fetch all Shopify users for autocomplete
 */
export async function searchUsers(query: string): Promise<User[]> {
  try {
    const response = await fetch("/users.json");

    if (!response.ok) {
      console.error("[AccessControl] Failed to fetch users:", response.status);
      return [];
    }

    // Parse NDJSON (newline-delimited JSON) - each line is a separate JSON object
    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Parse and deduplicate users by email (case-insensitive)
    const userMap = new Map<string, User>();

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const emailKey = data.email?.toLowerCase();

        if (emailKey && !userMap.has(emailKey)) {
          userMap.set(emailKey, {
            id: data.id,
            email: data.email,
            name: data.name || "",
            slack_handle: data.slack_handle,
            slack_image_url: data.slack_image_url,
            slack_id: data.slack_id,
          });
        }
      } catch {
        // Skip invalid lines silently
      }
    }

    const users = Array.from(userMap.values());

    // Filter based on query
    if (!query || query.trim().length === 0) {
      return users.slice(0, 50); // Return first 50 if no query
    }

    const lowerQuery = query.toLowerCase().trim();

    return users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          (user.slack_handle &&
            user.slack_handle.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 50); // Limit to 50 results
  } catch (error) {
    console.error("[AccessControl] Error searching users:", error);
    return [];
  }
}

// ==================== ACCESS MANAGEMENT ====================

/**
 * Send Slack notification to invited user
 */
async function sendInviteNotification(
  invitedUser: {
    email: string;
    name: string;
    slackId?: string;
  },
  resourceType: ResourceType,
  resourceName: string,
  resourceId: string,
  accessLevel: AccessLevel,
  invitedBy: string
): Promise<void> {
  try {
    // Only send if user has Slack ID
    if (!invitedUser.slackId) {
      return;
    }

    const quick = await waitForQuick();
    const resourceUrl = getResourceUrl(resourceType, resourceId);

    await quick.slack.sendMessage(
      invitedUser.slackId,
      `You've been invited to a ${resourceType}!`,
      {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*You've been invited to a ${resourceType} on Artifact* 🎉`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*${resourceType === "project" ? "Project" : "Folder"}:*\n${resourceName}`,
              },
              {
                type: "mrkdwn",
                text: `*Access Level:*\n${accessLevel}`,
              },
              {
                type: "mrkdwn",
                text: `*Invited by:*\n${invitedBy}`,
              },
            ],
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: `Open ${resourceType === "project" ? "Project" : "Folder"}`,
                },
                url: resourceUrl,
                style: "primary",
              },
            ],
          },
        ],
      }
    );
  } catch (error) {
    // Don't fail the invitation if Slack notification fails
    console.error("[AccessControl] Failed to send Slack notification:", error);
  }
}

/**
 * Get all access entries for a resource (project or folder)
 */
export async function getAccessListForResource(
  resourceId: string,
  resourceType: ResourceType
): Promise<AccessEntry[]> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);
    const accessEntries = await collection
      .where({
        resource_id: resourceId,
        resource_type: resourceType,
      })
      .orderBy("access_level", "asc")
      .orderBy("created_at", "asc")
      .find();
    return accessEntries as AccessEntry[];
  } catch (error) {
    console.error("[AccessControl] Failed to get access list:", error);
    return [];
  }
}

/**
 * Cascade folder access to all projects in the folder
 * @param userId - User.id of the user being granted access
 */
async function cascadeAccessToFolderProjects(
  folderId: string,
  userId: string,
  userEmail: string,
  accessLevel: AccessLevel,
  grantedBy: string,
  userName?: string,
  userAvatar?: string
): Promise<void> {
  try {
    const projects = await getProjectsInFolder(folderId);

    // Grant access to each project (in parallel for speed)
    await Promise.all(
      projects.map((project) =>
        grantAccess(
          project.id,
          RESOURCE_TYPES.PROJECT,
          userId,
          userEmail,
          accessLevel,
          grantedBy,
          userName,
          userAvatar
          // Don't send Slack notifications for cascaded access (too spammy)
        )
      )
    );
  } catch (error) {
    console.error("[AccessControl] Failed to cascade folder access:", error);
  }
}

/**
 * Grant access to a user
 * @param userId - User.id of the user being granted access
 * @param userEmail - User's email (kept for display purposes)
 * @param grantedBy - User.id of the person granting access
 */
export async function grantAccess(
  resourceId: string,
  resourceType: ResourceType,
  userId: string,
  userEmail: string,
  accessLevel: AccessLevel,
  grantedBy: string,
  userName?: string,
  userAvatar?: string,
  resourceName?: string,
  userSlackId?: string,
  grantedByName?: string
): Promise<AccessEntry | null> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    // Check if access already exists (by user_id)
    const existing = await findAccessEntry(resourceId, resourceType, userId);

    if (existing) {
      // Update existing access
      await collection.update(existing.id, {
        access_level: accessLevel,
        user_name: userName,
        user_avatar: userAvatar,
        user_email: userEmail.toLowerCase().trim(), // Update email in case it changed
      });

      // If updating folder access, cascade to projects
      if (resourceType === RESOURCE_TYPES.FOLDER) {
        await cascadeAccessToFolderProjects(
          resourceId,
          userId,
          userEmail,
          accessLevel,
          grantedBy,
          userName,
          userAvatar
        );
      }

      return await collection.findById(existing.id);
    }

    // Create new access entry
    const newAccess = await collection.create({
      resource_id: resourceId,
      resource_type: resourceType,
      user_id: userId,
      user_email: userEmail.toLowerCase().trim(),
      user_name: userName || userEmail,
      user_avatar: userAvatar,
      access_level: accessLevel,
      granted_by: grantedBy,
    });

    console.log("[AccessControl] Granted access:", {
      resourceType,
      resourceId,
      userId,
      userEmail,
      accessLevel,
    });

    // If granting folder access, cascade to all projects in folder
    if (resourceType === RESOURCE_TYPES.FOLDER) {
      await cascadeAccessToFolderProjects(
        resourceId,
        userId,
        userEmail,
        accessLevel,
        grantedBy,
        userName,
        userAvatar
      );
    }

    // Send Slack notification to the invited user
    if (resourceName && userSlackId) {
      await sendInviteNotification(
        {
          email: userEmail,
          name: userName || userEmail,
          slackId: userSlackId,
        },
        resourceType,
        resourceName,
        resourceId,
        accessLevel,
        grantedByName || grantedBy
      );
    }

    return newAccess as AccessEntry;
  } catch (error) {
    console.error("[AccessControl] Failed to grant access:", error);
    return null;
  }
}

/**
 * Update access level for an existing user
 * @param userId - User.id of the user whose access is being updated
 */
export async function updateAccessLevel(
  resourceId: string,
  resourceType: ResourceType,
  userId: string,
  newAccessLevel: AccessLevel
): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const existing = await findAccessEntry(resourceId, resourceType, userId);

    if (!existing) {
      console.error("[AccessControl] Access entry not found for user:", userId);
      return false;
    }

    await collection.update(existing.id, { access_level: newAccessLevel });

    console.log("[AccessControl] Updated access level:", {
      resourceType,
      resourceId,
      userId,
      newAccessLevel,
    });

    return true;
  } catch (error) {
    console.error("[AccessControl] Failed to update access level:", error);
    return false;
  }
}

/**
 * Revoke access from a user
 * @param userId - User.id of the user whose access is being revoked
 */
export async function revokeAccess(
  resourceId: string,
  resourceType: ResourceType,
  userId: string
): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const existing = await findAccessEntry(resourceId, resourceType, userId);

    if (!existing) {
      console.error("[AccessControl] Access entry not found for user:", userId);
      return false;
    }

    await collection.delete(existing.id);

    console.log("[AccessControl] Revoked access:", {
      resourceType,
      resourceId,
      userId,
    });

    return true;
  } catch (error) {
    console.error("[AccessControl] Failed to revoke access:", error);
    return false;
  }
}

/**
 * Find a specific access entry by user_id
 * @param userId - User.id to look up
 */
async function findAccessEntry(
  resourceId: string,
  resourceType: ResourceType,
  userId: string
): Promise<AccessEntry | null> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    // Query by user_id (the primary identifier)
    const results = await collection
      .where({
        resource_id: resourceId,
        resource_type: resourceType,
        user_id: userId,
      })
      .find();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("[AccessControl] Failed to find access entry:", error);
    return null;
  }
}

/**
 * Check if user has access to a resource
 * @param userId - User.id to check access for
 */
export async function checkUserAccess(
  resourceId: string,
  resourceType: ResourceType,
  userId: string
): Promise<AccessLevel | null> {
  try {
    const entry = await findAccessEntry(resourceId, resourceType, userId);
    return entry ? entry.access_level : null;
  } catch (error) {
    console.error("[AccessControl] Failed to check user access:", error);
    return null;
  }
}

/**
 * Check if user can edit resource (owner or editor)
 * @param userId - User.id to check
 */
export async function canUserEdit(
  resourceId: string,
  resourceType: ResourceType,
  userId: string
): Promise<boolean> {
  const accessLevel = await checkUserAccess(resourceId, resourceType, userId);
  return (
    accessLevel === ACCESS_LEVELS.OWNER || accessLevel === ACCESS_LEVELS.EDITOR
  );
}

/**
 * Check if user can view resource (any access level)
 * @param userId - User.id to check
 */
export async function canUserView(
  resourceId: string,
  resourceType: ResourceType,
  userId: string
): Promise<boolean> {
  const accessLevel = await checkUserAccess(resourceId, resourceType, userId);
  return accessLevel !== null;
}

/**
 * Get all resources a user has access to
 * @param userId - User.id to get resources for
 */
export async function getUserAccessibleResources(
  userId: string,
  resourceType: ResourceType
): Promise<AccessEntry[]> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    // Query by user_id
    return await collection
      .where({
        user_id: userId,
        resource_type: resourceType,
      })
      .find();
  } catch (error) {
    console.error("[AccessControl] Failed to get user resources:", error);
    return [];
  }
}

/**
 * Delete all access entries for a resource (used when deleting project/folder)
 */
export async function deleteAllAccessForResource(
  resourceId: string,
  resourceType: ResourceType
): Promise<void> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const accessList = await getAccessListForResource(resourceId, resourceType);

    await Promise.all(
      accessList.map((entry: AccessEntry) => collection.delete(entry.id))
    );

    console.log("[AccessControl] Deleted all access for resource:", {
      resourceType,
      resourceId,
      count: accessList.length,
    });
  } catch (error) {
    console.error("[AccessControl] Failed to delete resource access:", error);
  }
}
