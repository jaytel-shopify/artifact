/**
 * Access Control System
 *
 * Unified access control for both projects and folders.
 * Supports three permission levels: owner, editor, viewer
 */

import { waitForQuick } from "./quick";
import { getResourceUrl } from "./urls";

export type AccessLevel = "owner" | "editor" | "viewer";
export type ResourceType = "project" | "folder";

export interface AccessEntry {
  id: string;
  resource_id: string; // project_id or folder_id
  resource_type: ResourceType;
  user_email: string;
  user_name?: string;
  user_avatar?: string;
  access_level: AccessLevel;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyUser {
  email: string;
  fullName: string;
  firstName: string;
  slackImageUrl?: string;
  slackHandle?: string;
  slackId?: string;
  title?: string;
}

const ACCESS_COLLECTION = "access_control";

// ==================== USER SEARCH ====================

/**
 * Fetch all Shopify users for autocomplete
 */
export async function searchShopifyUsers(
  query: string
): Promise<ShopifyUser[]> {
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
    const userMap = new Map<string, ShopifyUser>();

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const emailKey = data.email?.toLowerCase();

        if (emailKey && !userMap.has(emailKey)) {
          const fullName = data.name || "";
          userMap.set(emailKey, {
            email: data.email,
            fullName: fullName,
            firstName: fullName.split(" ")[0] || fullName,
            slackHandle: data.slack_handle,
            slackImageUrl: data.slack_image_url,
            slackId: data.slack_id,
            title: data.title,
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
          user.fullName.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          (user.slackHandle &&
            user.slackHandle.toLowerCase().includes(lowerQuery))
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
export async function getAccessList(
  resourceId: string,
  resourceType: ResourceType
): Promise<AccessEntry[]> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const allAccess = await collection.find();
    const filtered = allAccess.filter(
      (entry: AccessEntry) =>
        entry.resource_id === resourceId && entry.resource_type === resourceType
    );

    // Sort by access level (owner first, then editor, then viewer) and creation date
    return filtered.sort((a: AccessEntry, b: AccessEntry) => {
      const levelOrder = { owner: 0, editor: 1, viewer: 2 };
      const levelDiff = levelOrder[a.access_level] - levelOrder[b.access_level];

      if (levelDiff !== 0) return levelDiff;

      // Same level, sort by creation date (oldest first)
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  } catch (error) {
    console.error("[AccessControl] Failed to get access list:", error);
    return [];
  }
}

/**
 * Cascade folder access to all projects in the folder
 */
async function cascadeAccessToFolderProjects(
  folderId: string,
  userEmail: string,
  accessLevel: AccessLevel,
  grantedBy: string,
  userName?: string,
  userAvatar?: string
): Promise<void> {
  try {
    // Import dynamically to avoid circular dependency
    const { getProjectsInFolder } = await import("./quick/folders");
    const projects = await getProjectsInFolder(folderId);

    console.log("[AccessControl] Cascading access to", projects.length, "projects in folder");

    // Grant access to each project (in parallel for speed)
    await Promise.all(
      projects.map((project) =>
        grantAccess(
          project.id,
          "project",
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
 */
export async function grantAccess(
  resourceId: string,
  resourceType: ResourceType,
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

    // Check if access already exists
    const existing = await findAccessEntry(resourceId, resourceType, userEmail);

    if (existing) {
      // Update existing access
      await collection.update(existing.id, {
        access_level: accessLevel,
        user_name: userName,
        user_avatar: userAvatar,
      });

      // If updating folder access, cascade to projects
      if (resourceType === "folder") {
        await cascadeAccessToFolderProjects(
          resourceId,
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
      user_email: userEmail.toLowerCase().trim(),
      user_name: userName || userEmail,
      user_avatar: userAvatar,
      access_level: accessLevel,
      granted_by: grantedBy,
    });

    console.log("[AccessControl] Granted access:", {
      resourceType,
      resourceId,
      userEmail,
      accessLevel,
    });

    // If granting folder access, cascade to all projects in folder
    if (resourceType === "folder") {
      await cascadeAccessToFolderProjects(
        resourceId,
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
 */
export async function updateAccessLevel(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string,
  newAccessLevel: AccessLevel
): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const existing = await findAccessEntry(resourceId, resourceType, userEmail);

    if (!existing) {
      console.error(
        "[AccessControl] Access entry not found for user:",
        userEmail
      );
      return false;
    }

    await collection.update(existing.id, { access_level: newAccessLevel });

    console.log("[AccessControl] Updated access level:", {
      resourceType,
      resourceId,
      userEmail,
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
 */
export async function revokeAccess(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string
): Promise<boolean> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const existing = await findAccessEntry(resourceId, resourceType, userEmail);

    if (!existing) {
      console.error(
        "[AccessControl] Access entry not found for user:",
        userEmail
      );
      return false;
    }

    await collection.delete(existing.id);

    console.log("[AccessControl] Revoked access:", {
      resourceType,
      resourceId,
      userEmail,
    });

    return true;
  } catch (error) {
    console.error("[AccessControl] Failed to revoke access:", error);
    return false;
  }
}

/**
 * Find a specific access entry
 */
async function findAccessEntry(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string
): Promise<AccessEntry | null> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const allAccess = await collection.find();
    const entry = allAccess.find(
      (a: AccessEntry) =>
        a.resource_id === resourceId &&
        a.resource_type === resourceType &&
        a.user_email.toLowerCase() === userEmail.toLowerCase().trim()
    );

    return entry || null;
  } catch (error) {
    console.error("[AccessControl] Failed to find access entry:", error);
    return null;
  }
}

/**
 * Check if user has access to a resource
 */
export async function checkUserAccess(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string
): Promise<AccessLevel | null> {
  try {
    const entry = await findAccessEntry(resourceId, resourceType, userEmail);
    return entry ? entry.access_level : null;
  } catch (error) {
    console.error("[AccessControl] Failed to check user access:", error);
    return null;
  }
}

/**
 * Check if user can edit resource (owner or editor)
 */
export async function canUserEdit(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string
): Promise<boolean> {
  const accessLevel = await checkUserAccess(
    resourceId,
    resourceType,
    userEmail
  );
  return accessLevel === "owner" || accessLevel === "editor";
}

/**
 * Check if user can view resource (any access level)
 */
export async function canUserView(
  resourceId: string,
  resourceType: ResourceType,
  userEmail: string
): Promise<boolean> {
  const accessLevel = await checkUserAccess(
    resourceId,
    resourceType,
    userEmail
  );
  return accessLevel !== null;
}

/**
 * Get all resources a user has access to
 */
export async function getUserAccessibleResources(
  userEmail: string,
  resourceType: ResourceType
): Promise<AccessEntry[]> {
  try {
    const quick = await waitForQuick();
    const collection = quick.db.collection(ACCESS_COLLECTION);

    const allAccess = await collection.find();
    return allAccess.filter(
      (entry: AccessEntry) =>
        entry.user_email && // Check that user_email exists
        entry.user_email.toLowerCase() === userEmail.toLowerCase().trim() &&
        entry.resource_type === resourceType
    );
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

    const accessList = await getAccessList(resourceId, resourceType);

    await Promise.all(accessList.map((entry) => collection.delete(entry.id)));

    console.log("[AccessControl] Deleted all access for resource:", {
      resourceType,
      resourceId,
      count: accessList.length,
    });
  } catch (error) {
    console.error("[AccessControl] Failed to delete resource access:", error);
  }
}
