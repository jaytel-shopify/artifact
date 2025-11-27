"use client";

import { waitForQuick } from "./quick";
import type { Folder, Project } from "@/types";
import { deleteProject } from "./quick-db";
import { deleteAllAccessForResource, grantAccess } from "./access-control";
import { getUserByEmail } from "./quick-users";

/**
 * Quick.db Folders Service Layer
 *
 * Manages folder organization and grouping.
 * Access control is handled through the unified access-control system.
 */

// ==================== FOLDERS ====================

/**
 * Get all folders owned by a user
 * @param creatorEmail - Email of the user (will be looked up to find User.id)
 */
export async function getFolders(creatorEmail: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Look up user by email to get their User.id
  const user = await getUserByEmail(creatorEmail);
  if (!user) {
    // User not found, return empty array
    return [];
  }

  // Use .where() to filter by creator_id (User.id) at the database level
  const userFolders = await collection
    .where({ creator_id: user.id })
    .find();

  // Sort by last_accessed_at (most recent first), fallback to created_at
  return userFolders.sort((a: Folder, b: Folder) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

// getUserFolders removed - use getUserAccessibleResources from lib/access-control.ts instead

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
 * @param data.creator_id - User's email (will be looked up to store User.id)
 */
export async function createFolder(data: {
  name: string;
  creator_id: string; // User's email
  position?: number;
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Look up user by email to get their User.id
  const user = await getUserByEmail(data.creator_id);
  if (!user) {
    throw new Error(`User not found for email: ${data.creator_id}`);
  }

  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const userFolders = await getFolders(data.creator_id);
    position = userFolders.length;
  }

  const folder = await collection.create({
    name: data.name,
    creator_id: user.id, // Store User.id, not email
    position,
  });

  // Grant owner access to creator (access control still uses email)
  await grantAccess(
    folder.id,
    "folder",
    data.creator_id, // Use email for access control
    "owner",
    data.creator_id
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

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete a folder and all projects inside it
 */
export async function deleteFolder(id: string): Promise<void> {
  const quick = await waitForQuick();

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
 * If userEmail is not provided, returns all projects in folder (for backward compatibility)
 */
export async function getProjectsInFolder(
  folderId: string,
  userEmail?: string
): Promise<Project[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  // Use .where() to filter by folder_id at the database level
  const folderProjects = await collection.where({ folder_id: folderId }).find();

  // If userEmail provided, filter by explicit project access
  let accessibleProjects = folderProjects;
  if (userEmail) {
    const { checkUserAccess } = await import("./access-control");

    // Check access for each project in parallel
    const accessChecks = await Promise.all(
      folderProjects.map(async (project) => {
        const access = await checkUserAccess(project.id, "project", userEmail);
        return { project, hasAccess: access !== null };
      })
    );

    // Only include projects where user has explicit access
    accessibleProjects = accessChecks
      .filter(({ hasAccess }) => hasAccess)
      .map(({ project }) => project);
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
 * Count projects in a folder
 */
export async function getProjectCountInFolder(
  folderId: string
): Promise<number> {
  const projects = await getProjectsInFolder(folderId);
  return projects.length;
}
