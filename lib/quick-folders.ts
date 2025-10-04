"use client";

import { waitForQuick } from "./quick";
import type { Folder, FolderAccess, Project } from "@/types";
import { deleteProject, getArtifactsByProject, getPages } from "./quick-db";

/**
 * Quick.db Folders Service Layer
 * 
 * Manages folder organization and folder-based collaboration.
 * Folders allow grouping projects and sharing access to entire collections.
 */

// ==================== FOLDERS ====================

/**
 * Get all folders owned by a user
 */
export async function getFolders(creatorEmail: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  const allFolders = await collection.find();
  const userFolders = allFolders.filter((f: Folder) => f.creator_id === creatorEmail);

  // Sort by last_accessed_at (most recent first), fallback to created_at
  return userFolders.sort((a: Folder, b: Folder) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Get all folders user has access to (owned + shared)
 */
export async function getUserFolders(userEmail: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  
  // Get owned folders
  const ownedFolders = await getFolders(userEmail);
  
  // Get shared folders
  const accessCollection = quick.db.collection("folder_access");
  const allAccess = await accessCollection.find();
  const userAccess = allAccess.filter((a: FolderAccess) => a.user_email === userEmail);
  
  // Get folder details for shared folders
  const folderCollection = quick.db.collection("folders");
  const sharedFolderPromises = userAccess.map(async (access: FolderAccess) => {
    try {
      return await folderCollection.findById(access.folder_id);
    } catch {
      return null;
    }
  });
  
  const sharedFolders = (await Promise.all(sharedFolderPromises)).filter(Boolean);
  
  // Combine and deduplicate
  const allFolders = [...ownedFolders, ...sharedFolders];
  const uniqueFolders = Array.from(
    new Map(allFolders.map(f => [f.id, f])).values()
  );
  
  // Sort by last accessed
  return uniqueFolders.sort((a: Folder, b: Folder) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
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
 */
export async function createFolder(data: {
  name: string;
  creator_id: string;
  position?: number;
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const userFolders = await getFolders(data.creator_id);
    position = userFolders.length;
  }

  return await collection.create({
    name: data.name,
    creator_id: data.creator_id,
    position,
  });
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
  await Promise.all(projectsInFolder.map((project) => deleteProject(project.id)));

  // Delete the folder itself
  const folderCollection = quick.db.collection("folders");
  await folderCollection.delete(id);
  
  // Delete folder access entries
  const accessCollection = quick.db.collection("folder_access");
  const allAccess = await accessCollection.find();
  const folderAccess = allAccess.filter((a: FolderAccess) => a.folder_id === id);
  await Promise.all(folderAccess.map((a: FolderAccess) => accessCollection.delete(a.id)));
}

/**
 * Check if user can edit a folder
 */
export async function canEditFolder(folderId: string, userEmail: string): Promise<boolean> {
  const folder = await getFolderById(folderId);
  if (!folder) return false;
  
  // Owner can always edit
  if (folder.creator_id === userEmail) return true;
  
  // Check folder_access table for editor access
  const accessList = await getFolderAccessList(folderId);
  return accessList.some(
    (access) => access.user_email === userEmail && access.role === "editor"
  );
}

// ==================== FOLDER ACCESS ====================

/**
 * Grant access to a folder
 */
export async function grantFolderAccess(
  folderId: string,
  userEmail: string,
  role: "editor" | "viewer" = "editor"
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folder_access");
  
  // Check if access already exists
  const allAccess = await collection.find();
  const existing = allAccess.find(
    (a: FolderAccess) => a.folder_id === folderId && a.user_email === userEmail
  );
  
  if (existing) {
    // Update existing access
    await collection.update(existing.id, { role });
  } else {
    // Create new access
    await collection.create({
      folder_id: folderId,
      user_email: userEmail,
      role,
    });
  }
}

/**
 * Revoke access to a folder
 */
export async function revokeFolderAccess(
  folderId: string,
  userEmail: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folder_access");
  
  const allAccess = await collection.find();
  const existing = allAccess.find(
    (a: FolderAccess) => a.folder_id === folderId && a.user_email === userEmail
  );
  
  if (existing) {
    await collection.delete(existing.id);
  }
}

/**
 * Get all users with access to a folder
 */
export async function getFolderAccessList(folderId: string): Promise<FolderAccess[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folder_access");
  
  const allAccess = await collection.find();
  return allAccess.filter((a: FolderAccess) => a.folder_id === folderId);
}

// ==================== PROJECT-FOLDER RELATIONS ====================

/**
 * Get all projects in a folder
 */
export async function getProjectsInFolder(folderId: string): Promise<Project[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  
  const allProjects = await collection.find();
  const folderProjects = allProjects.filter((p: Project) => p.folder_id === folderId);
  
  // Sort by last accessed
  return folderProjects.sort((a: Project, b: Project) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Move a project to a folder
 */
export async function moveProjectToFolder(projectId: string, folderId: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  
  await collection.update(projectId, { folder_id: folderId });
}

/**
 * Remove a project from its folder
 */
export async function removeProjectFromFolder(projectId: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  
  await collection.update(projectId, { folder_id: null });
}

/**
 * Count projects in a folder
 */
export async function getProjectCountInFolder(folderId: string): Promise<number> {
  const projects = await getProjectsInFolder(folderId);
  return projects.length;
}

