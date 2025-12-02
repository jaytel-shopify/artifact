"use client";

import { waitForQuick } from "./quick";
import type { Folder, Project } from "@/types";
import { deleteProject } from "./quick-db";
import { deleteAllAccessForResource, grantAccess } from "./access-control";
import { getUserById } from "./quick-users";

/**
 * Quick.db Folders Service Layer
 *
 * Manages folder organization and grouping.
 * Access control is handled through the unified access-control system.
 */

// ==================== FOLDERS ====================

/**
 * Get all folders owned by a user
 * @param userId - User.id to get folders for
 */
export async function getFolders(userId: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");
  const user = await getUserById(userId);
  if (!user) return [];

  return await collection
    .where({ creator_id: user.id })
    .orderBy("created_at", "desc")
    .find();
}

/**
 * Get a single folder by ID
 */
export async function getFolderById(id: string): Promise<Folder | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  try {
    return await collection.findById(id);
  } catch (error) {
    console.error("Folder not found:", id, error);
    return null;
  }
}

/**
 * Create a new folder
 * @param data.creator_id - User.id (not email)
 * @param data.creator_email - User's email for display purposes
 */
export async function createFolder(data: {
  name: string;
  creator_id: string; // User.id
  creator_email: string; // User's email
  position?: number;
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Look up user by ID
  const user = await getUserById(data.creator_id);
  if (!user) {
    throw new Error(`User not found for ID: ${data.creator_id}`);
  }

  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const userFolders = await getFolders(user.id);
    position = userFolders.length;
  }

  const folder = await collection.create({
    name: data.name,
    creator_id: user.id, // Store User.id, not email
    position,
  });

  // Grant owner access to creator (access control uses user_id)
  await grantAccess(
    folder.id,
    "folder",
    user.id, // User.id
    data.creator_email, // User's email (for display)
    "owner",
    user.id // Granted by self
  );

  return folder;
}

/**
 * Update a folder
 */
export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, "name" | "position" | "last_accessed_at">>
): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  //TODO: check access control

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete a folder and all projects inside it
 */
export async function deleteFolder(id: string): Promise<void> {
  const quick = await waitForQuick();

  // TODO: check access control

  // Get all projects in this folder
  const projectsInFolder = await getProjectsInFolder(id);

  // Delete each project (which will cascade to pages and artifacts)
  await Promise.all(
    projectsInFolder.map((project) => deleteProject(project.id))
  );

  // Delete the folder itself
  const folderCollection = quick.db.collection("folders");
  await folderCollection.delete(id);

  // Delete all access entries for this folder
  await deleteAllAccessForResource(id, "folder");
}

// canEditFolder removed - use canUserEdit from lib/access-control.ts instead

// ==================== FOLDER ACCESS ====================
// All folder access functions moved to lib/access-control.ts
// Use the unified access control system for managing folder permissions

// ==================== PROJECT-FOLDER RELATIONS ====================

/**
 * Get all projects in a folder that the user has explicit access to
 * If userId is not provided, returns all projects in folder (for backward compatibility)
 * @param userId - User.id to check access for
 */
export async function getProjectsInFolder(
  folderId: string,
  userId?: string
): Promise<Project[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  // Use .where() to filter by folder_id at the database level
  const folderProjects = await collection.where({ folder_id: folderId }).find();

  // If userId provided, filter by explicit project access using batch query
  let accessibleProjects = folderProjects;
  if (userId) {
    // Batch fetch all user's project access entries in a single query
    const { getUserAccessibleResources } = await import("./access-control");
    const userProjectAccess = await getUserAccessibleResources(userId, "project");
    const accessibleProjectIds = new Set(userProjectAccess.map(a => a.resource_id));

    // Filter to only projects user has access to
    accessibleProjects = folderProjects.filter((project: Project) =>
      accessibleProjectIds.has(project.id)
    );
  }

  // Sort by last accessed
  return accessibleProjects.sort((a: Project, b: Project) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Move a project to a folder
 */
export async function moveProjectToFolder(
  projectId: string,
  folderId: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  await collection.update(projectId, { folder_id: folderId });
}

/**
 * Remove a project from its folder
 */
export async function removeProjectFromFolder(
  projectId: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  await collection.update(projectId, { folder_id: null });
}

/**
 * Count projects in a folder that the user has access to
 * @param userId - User.id to check access for
 */
export async function getProjectCountInFolder(
  folderId: string,
  userId?: string
): Promise<number> {
  const projects = await getProjectsInFolder(folderId, userId);
  return projects.length;
}
