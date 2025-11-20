"use client";

import { waitForQuick } from "./index";
import type { Folder } from "@/types";
import { deleteFolder as deleteFolderDB } from "./db-new";
import { deleteAllAccessForResource, grantAccess } from "../access-control";

/**
 * Quick.db Folders Service Layer
 *
 * Manages folder organization and grouping.
 * Access control is handled through the unified access-control system.
 */

// ==================== FOLDERS ====================

/**
 * Get all folders (depth 0) owned by a user
 */
export async function getFolders(ownerEmail: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  const allFolders = await collection.find();
  const userFolders = allFolders.filter(
    (f: Folder) => f.owner_id === ownerEmail && f.depth === 0
  );

  // Sort by updated_at (most recent first), fallback to created_at
  return userFolders.sort((a: Folder, b: Folder) => {
    const aTime = a.updated_at || a.created_at;
    const bTime = b.updated_at || b.created_at;
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
 * Create a new folder (depth 0)
 */
export async function createFolder(data: {
  title: string;
  owner_id: string;
  position?: number;
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const userFolders = await getFolders(data.owner_id);
    position = userFolders.length;
  }

  const now = new Date().toISOString();
  const folder = await collection.create({
    title: data.title,
    owner_id: data.owner_id,
    depth: 0,
    parent_id: null,
    position,
    created_at: now,
    updated_at: now,
  });

  // Grant owner access to creator
  await grantAccess(
    folder.id,
    "folder",
    data.owner_id,
    "owner",
    data.owner_id
  );

  return folder;
}

/**
 * Update a folder
 */
export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, "title" | "position" | "updated_at">>
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
    projectsInFolder.map((project) => deleteFolderDB(project.id))
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
 * Get all projects (folders with depth 1) in a folder that the user has explicit access to
 * If userEmail is not provided, returns all projects in folder (for backward compatibility)
 */
export async function getProjectsInFolder(
  folderId: string,
  userEmail?: string
): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  const allFolders = await collection.find();
  const folderProjects = allFolders.filter(
    (f: Folder) => f.parent_id === folderId && f.depth === 1
  );

  // If userEmail provided, filter by explicit project access
  let accessibleProjects = folderProjects;
  if (userEmail) {
    const { checkUserAccess } = await import("../access-control");

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

  // Sort by updated_at
  return accessibleProjects.sort((a: Folder, b: Folder) => {
    const aTime = a.updated_at || a.created_at;
    const bTime = b.updated_at || b.created_at;
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
  const collection = quick.db.collection("folders");

  await collection.update(projectId, { parent_id: folderId });
}

/**
 * Remove a project from its folder
 */
export async function removeProjectFromFolder(
  projectId: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  await collection.update(projectId, { parent_id: null });
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
