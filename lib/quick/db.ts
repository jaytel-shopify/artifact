"use client";

import { waitForQuick } from "./index";
import type { Artifact, ArtifactType, Folder } from "@/types";
import { grantAccess } from "../access-control";
import { getArtifactsByFolderId } from "./db-new";

/**
 * Quick.db Service Layer
 *
 * This module provides a clean interface to interact with Quick's JSON database.
 * Collections: projects, pages, artifacts, project_access
 *
 * Note: Quick.db automatically adds these fields to all documents:
 * - id (string): Unique identifier
 * - created_at (string): ISO timestamp
 * - updated_at (string): ISO timestamp
 */

// ==================== PROJECTS ====================

/**
 * Get all projects, optionally filtered by creator
 */
export async function getProjects(creatorEmail?: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  let projects = await collection.find();

  // Filter by creator if provided
  if (creatorEmail) {
    projects = projects.filter((p: Folder) => p.owner_id === creatorEmail);
  }

  // Sort by last_accessed_at (most recent first), fallback to created_at
  return projects.sort((a: Folder, b: Folder) => {
    const aTime = a.updated_at || a.created_at;
    const bTime = b.updated_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Folder | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  try {
    return await collection.findById(id);
  } catch (error) {
    console.error("Project not found:", id, error);
    return null;
  }
}

// getProjectByShareToken removed - projects now use direct ID-based access

/**
 * Create a new project
 */
export async function createProject(data: {
  name: string;
  creator_id: string; // user.email
  folder_id?: string | null; // Optional folder assignment
  settings?: {
    default_columns?: number;
    allow_viewer_control?: boolean;
    background_color?: string;
  };
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  const projectData = {
    name: data.name,
    creator_id: data.creator_id,
    folder_id: data.folder_id || null,
    settings: data.settings || {
      default_columns: 3,
      allow_viewer_control: true,
      background_color: "#ffffff",
    },
  };

  const project = await collection.create(projectData);

  // Grant owner access to creator
  await grantAccess(
    project.id,
    "project",
    data.creator_id,
    "owner",
    data.creator_id
  );

  // Create default page for the project
  await createPage({
    project_id: project.id,
    title: "Page 01",
    position: 0,
  });

  return project;
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<Pick<Folder, "title" | "updated_at" | "parent_id">>
): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete a project and all its pages and artifacts
 */
export async function deleteProject(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all artifacts in this project
  const artifacts = await getArtifactsByFolderId(id);
  await Promise.all(artifacts.map((a) => deleteArtifact(a.id)));

  // Delete all pages in this project
  const pages = await getPages(id);
  await Promise.all(pages.map((p) => deletePage(p.id)));

  // Delete the project
  const projectCollection = quick.db.collection("projects");
  await projectCollection.delete(id);
}

// canEditProject removed - use checkUserAccess from lib/access-control.ts instead

// ==================== PAGES ====================

/**
 * Get all pages for a project, sorted by position
 */
export async function getPages(projectId: string): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  const allPages = await collection.find();
  const projectPages = allPages.filter(
    (p: Folder) => p.parent_id === projectId
  );

  // Sort by position ascending
  return projectPages.sort((a: Folder, b: Folder) => a.position - b.position);
}

/**
 * Get a single page by ID
 */
export async function getPageById(id: string): Promise<Folder | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  try {
    return await collection.findById(id);
  } catch (error) {
    console.error("Page not found:", id, error);
    return null;
  }
}

/**
 * Create a new page
 */
export async function createPage(data: {
  project_id: string;
  title: string;
  position: number;
}): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  return await collection.create(data);
}

/**
 * Update a page
 */
export async function updatePage(
  id: string,
  updates: Partial<Pick<Folder, "title" | "updated_at" | "parent_id">>
): Promise<Folder> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete a page and all its artifacts
 */
export async function deletePage(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all artifacts on this page
  const artifacts = await getArtifactsByFolderId(id);
  await Promise.all(artifacts.map((a) => deleteArtifact(a.id)));

  // Delete the page
  const collection = quick.db.collection("pages");
  await collection.delete(id);
}

/**
 * Reorder pages (batch update positions)
 */
export async function reorderPages(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  await Promise.all(
    updates.map(({ id, position }) => collection.update(id, { position }))
  );
}

// ==================== ARTIFACTS ====================

/**
 * Get a single artifact by ID
 */
export async function getArtifactById(id: string): Promise<Artifact | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  try {
    return await collection.findById(id);
  } catch (error) {
    console.error("Artifact not found:", id, error);
    return null;
  }
}

/**
 * Create a new artifact
 */
export async function createArtifact(data: {
  project_id: string;
  page_id: string;
  type: ArtifactType;
  source_url: string;
  file_path?: string | null;
  name: string;
  position: number;
  metadata?: Record<string, unknown>;
}): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  const artifactData = {
    project_id: data.project_id,
    page_id: data.page_id,
    type: data.type,
    source_url: data.source_url,
    file_path: data.file_path || null,
    name: data.name,
    position: data.position,
    metadata: data.metadata || {},
  };

  return await collection.create(artifactData);
}

/**
 * Update an artifact
 */
export async function updateArtifact(
  id: string,
  updates: Partial<Artifact>
): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete an artifact
 */
export async function deleteArtifact(id: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  await collection.delete(id);
}

/**
 * Reorder artifacts (batch update positions)
 */
export async function reorderArtifacts(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  await Promise.all(
    updates.map(({ id, position }) => collection.update(id, { position }))
  );
}

// ==================== ACCESS CONTROL ====================
// Access control functions moved to lib/access-control.ts
// All project and folder access is now managed through the unified access_control collection

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get the next available position for a new item
 */
export async function getNextPosition(
  collection: "pages" | "artifacts",
  parentId: string,
  parentField: "project_id" | "page_id"
): Promise<number> {
  const quick = await waitForQuick();
  const col = quick.db.collection(collection);

  const allItems = await col.find();
  const filteredItems = allItems.filter(
    (item: any) => item[parentField] === parentId
  );

  if (filteredItems.length === 0) return 0;

  const maxPosition = Math.max(
    ...filteredItems.map((item: any) => item.position || 0)
  );
  return maxPosition + 1;
}
