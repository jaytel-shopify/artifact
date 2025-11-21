"use client";

import { waitForQuick } from "./quick";
import type { Project, Page, Artifact, ArtifactType } from "@/types";
import { grantAccess, getUserAccessibleResources } from "./access-control";

/**
 * Quick.db Service Layer
 *
 * This module provides a clean interface to interact with Quick's JSON database.
 * Collections: projects, pages, artifacts
 *
 * Note: Quick.db automatically adds these fields to all documents:
 * - id (string): Unique identifier
 * - created_at (string): ISO timestamp
 * - updated_at (string): ISO timestamp
 */

// ==================== PROJECTS ====================

/**
 * Get all projects visible to a user
 * Returns projects they created OR have been granted access to via access control
 */
export async function getProjects(userEmail?: string): Promise<Project[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  const allProjects = await collection.find();

  // If no user email, return all projects (for admin/debugging)
  if (!userEmail) {
    return allProjects.sort((a: Project, b: Project) => {
      const aTime = a.last_accessed_at || a.created_at;
      const bTime = b.last_accessed_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  // Get projects user has access to via access control system
  const accessibleProjects = await getUserAccessibleResources(
    userEmail,
    "project"
  );
  const accessibleProjectIds = new Set(
    accessibleProjects.map((a) => a.resource_id)
  );

  // Filter projects: user is creator OR user has access via access control
  const userProjects = allProjects.filter(
    (p: Project) => p.creator_id === userEmail || accessibleProjectIds.has(p.id)
  );

  // Sort by last_accessed_at (most recent first), fallback to created_at
  return userProjects.sort((a: Project, b: Project) => {
    const aTime = a.last_accessed_at || a.created_at;
    const bTime = b.last_accessed_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
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
}): Promise<Project> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  const projectData = {
    name: data.name,
    creator_id: data.creator_id,
    folder_id: data.folder_id || null,
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
    name: "Page 01",
    position: 0,
  });

  return project;
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "last_accessed_at" | "folder_id">>
): Promise<Project> {
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
  const artifacts = await getArtifactsByProject(id);
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
export async function getPages(projectId: string): Promise<Page[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  // Use .where() and .orderBy() at the database level
  return await collection
    .where({ project_id: projectId })
    .orderBy("position", "asc")
    .find();
}

/**
 * Get a single page by ID
 */
export async function getPageById(id: string): Promise<Page | null> {
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
  name: string;
  position: number;
}): Promise<Page> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");

  return await collection.create(data);
}

/**
 * Update a page
 */
export async function updatePage(
  id: string,
  updates: Partial<Pick<Page, "name" | "position">>
): Promise<Page> {
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
  const artifacts = await getArtifactsByPage(id);
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
 * Get all artifacts for a project
 */
export async function getArtifactsByProject(
  projectId: string
): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Use .where() and .orderBy() at the database level
  return await collection
    .where({ project_id: projectId })
    .orderBy("position", "asc")
    .find();
}

/**
 * Get published artifacts for a user
 * Returns only artifacts where published=true
 * Sorted by most recently created first
 */
export async function getPublishedArtifacts(
  userEmail?: string
): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Query for published artifacts directly
  const publishedArtifacts = await collection.where({ published: true }).find();

  // Sort by created_at descending (most recent first)
  return publishedArtifacts.sort(
    (a: Artifact, b: Artifact) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Get all artifacts for a specific page
 */
export async function getArtifactsByPage(pageId: string): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Use .where() and .orderBy() at the database level
  return await collection
    .where({ page_id: pageId })
    .orderBy("position", "asc")
    .find();
}

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
  published?: boolean;
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
    reactions: { like: [], dislike: [] },
    published: data.published || false,
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

  // Use .where() to filter by parent field at the database level
  const filteredItems = await col.where({ [parentField]: parentId }).find();

  if (filteredItems.length === 0) return 0;

  const maxPosition = Math.max(
    ...filteredItems.map((item: any) => item.position || 0)
  );
  return maxPosition + 1;
}

/**
 * Get cover artifacts for a project (first 3 artifacts from the first page)
 * Uses same logic as useCurrentPage to determine which page to use
 */
export async function getProjectCoverArtifacts(
  projectId: string
): Promise<Artifact[]> {
  const pages = await getPages(projectId);
  if (pages.length === 0) {
    return [];
  }
  const firstPage = pages.find((p) => p.position === 0) || pages[0];
  const artifacts = await getArtifactsByPage(firstPage.id);
  return artifacts.slice(0, 3);
}
