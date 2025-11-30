"use client";

import { waitForQuick } from "./quick";
import type {
  Project,
  Page,
  Artifact,
  ArtifactType,
  ProjectArtifact,
  ArtifactWithPosition,
  ArtifactWithCreator,
} from "@/types";
import { grantAccess, getUserAccessibleResources } from "./access-control";
import { getUserByEmail, getUserById } from "./quick-users";

/**
 * Quick.db Service Layer
 *
 * This module provides a clean interface to interact with Quick's JSON database.
 * Collections: projects, pages, artifacts, project_artifacts (junction table)
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

  // Look up user by email to get their User.id
  const user = await getUserByEmail(userEmail);
  const userId = user?.id;

  // Get projects user has access to via access control system
  const accessibleProjects = await getUserAccessibleResources(
    userEmail,
    "project"
  );
  const accessibleProjectIds = new Set(
    accessibleProjects.map((a) => a.resource_id)
  );

  // Filter projects: user is creator (by User.id) OR user has access via access control
  const userProjects = allProjects.filter(
    (p: Project) =>
      (userId && p.creator_id === userId) || accessibleProjectIds.has(p.id)
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
 * @param data.creator_id - User's email (will be looked up to store User.id)
 */
export async function createProject(data: {
  name: string;
  creator_id: string; // User's email
  folder_id?: string | null; // Optional folder assignment
}): Promise<Project> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  // Look up user by email to get their User.id
  const user = await getUserByEmail(data.creator_id);
  if (!user) {
    throw new Error(`User not found for email: ${data.creator_id}`);
  }

  const projectData = {
    name: data.name,
    creator_id: user.id, // Store User.id, not email
    folder_id: data.folder_id || null,
  };

  const project = await collection.create(projectData);

  // Grant owner access to creator (access control still uses email)
  await grantAccess(
    project.id,
    "project",
    data.creator_id, // Use email for access control
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
 * Delete a project and all its pages
 * Junction entries are deleted but artifacts remain (they may be in other projects)
 */
export async function deleteProject(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all junction entries for this project
  await deleteProjectArtifactsByProject(id);

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
 * Delete a page
 * Junction entries are deleted but artifacts remain (they may be in other projects)
 */
export async function deletePage(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all junction entries for this page
  await deleteProjectArtifactsByPage(id);

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

// ==================== PROJECT ARTIFACTS (Junction Table) ====================

/**
 * Get all junction entries for a project
 */
export async function getProjectArtifactsByProject(
  projectId: string
): Promise<ProjectArtifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  return await collection
    .where({ project_id: projectId })
    .orderBy("position", "asc")
    .find();
}

/**
 * Get all junction entries for a page
 */
export async function getProjectArtifactsByPage(
  pageId: string
): Promise<ProjectArtifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  return await collection
    .where({ page_id: pageId })
    .orderBy("position", "asc")
    .find();
}

/**
 * Get all junction entries for a specific artifact
 * Used to check if artifact is linked to any projects
 */
export async function getProjectArtifactsByArtifact(
  artifactId: string
): Promise<ProjectArtifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  return await collection.where({ artifact_id: artifactId }).find();
}

/**
 * Create a junction entry (link artifact to project/page)
 */
export async function createProjectArtifact(data: {
  project_id: string;
  page_id: string;
  artifact_id: string;
  position: number;
}): Promise<ProjectArtifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  return await collection.create(data);
}

/**
 * Update a junction entry (e.g., change position)
 */
export async function updateProjectArtifact(
  id: string,
  updates: Partial<Pick<ProjectArtifact, "position" | "page_id">>
): Promise<ProjectArtifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  await collection.update(id, updates);
  return await collection.findById(id);
}

/**
 * Delete a junction entry (unlink artifact from project/page)
 */
export async function deleteProjectArtifact(id: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  await collection.delete(id);
}

/**
 * Delete all junction entries for a page
 */
export async function deleteProjectArtifactsByPage(
  pageId: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  const entries = await collection.where({ page_id: pageId }).find();
  await Promise.all(
    entries.map((e: ProjectArtifact) => collection.delete(e.id))
  );
}

/**
 * Delete all junction entries for a project
 */
export async function deleteProjectArtifactsByProject(
  projectId: string
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  const entries = await collection.where({ project_id: projectId }).find();
  await Promise.all(
    entries.map((e: ProjectArtifact) => collection.delete(e.id))
  );
}

/**
 * Get next position for a new artifact in a page
 */
export async function getNextArtifactPosition(pageId: string): Promise<number> {
  const entries = await getProjectArtifactsByPage(pageId);

  if (entries.length === 0) return 0;

  const maxPosition = Math.max(...entries.map((e) => e.position || 0));
  return maxPosition + 1;
}

/**
 * Reorder artifacts in a page (batch update positions on junction entries)
 */
export async function reorderProjectArtifacts(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  await Promise.all(
    updates.map(({ id, position }) => collection.update(id, { position }))
  );
}

// ==================== ARTIFACTS ====================

/**
 * Get all artifacts for a project (via junction table)
 * Returns artifacts with their position context
 */
export async function getArtifactsByProject(
  projectId: string
): Promise<ArtifactWithPosition[]> {
  const quick = await waitForQuick();

  // Get junction entries for this project
  const junctionEntries = await getProjectArtifactsByProject(projectId);

  if (junctionEntries.length === 0) return [];

  // Get all artifact IDs
  const artifactIds = junctionEntries.map((e) => e.artifact_id);

  // Fetch all artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts = await artifactsCollection.find();
  const artifactsMap = new Map(allArtifacts.map((a: Artifact) => [a.id, a]));

  // Combine artifacts with position from junction table
  const result: ArtifactWithPosition[] = [];
  for (const entry of junctionEntries) {
    const artifact = artifactsMap.get(entry.artifact_id);
    if (artifact) {
      result.push({
        ...artifact,
        position: entry.position,
        project_artifact_id: entry.id,
      });
    }
  }

  // Sort by position
  return result.sort((a, b) => a.position - b.position);
}

/**
 * Get published artifacts
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

  // If no user email provided, return all published artifacts
  if (!userEmail) {
    return publishedArtifacts.sort(
      (a: Artifact, b: Artifact) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Look up user by email to get their User.id
  const user = await getUserByEmail(userEmail);
  const userId = user?.id;

  // Filter to only show artifacts created by this user
  const userArtifacts = publishedArtifacts.filter(
    (a: Artifact) => userId && a.creator_id === userId
  );

  // Sort by created_at descending (most recent first)
  return userArtifacts.sort(
    (a: Artifact, b: Artifact) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Get all artifacts for a specific page (via junction table)
 * Returns artifacts with their position context
 */
export async function getArtifactsByPage(
  pageId: string
): Promise<ArtifactWithPosition[]> {
  const quick = await waitForQuick();

  // Get junction entries for this page
  const junctionEntries = await getProjectArtifactsByPage(pageId);

  if (junctionEntries.length === 0) return [];

  // Get all artifact IDs
  const artifactIds = junctionEntries.map((e) => e.artifact_id);

  // Fetch all artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts = await artifactsCollection.find();
  const artifactsMap = new Map(allArtifacts.map((a: Artifact) => [a.id, a]));

  // Combine artifacts with position from junction table
  const result: ArtifactWithPosition[] = [];
  for (const entry of junctionEntries) {
    const artifact = artifactsMap.get(entry.artifact_id);
    if (artifact) {
      result.push({
        ...artifact,
        position: entry.position,
        project_artifact_id: entry.id,
      });
    }
  }

  // Sort by position
  return result.sort((a, b) => a.position - b.position);
}

/**
 * Get a single artifact by ID with creator user data
 */
export async function getArtifactById(
  id: string
): Promise<ArtifactWithCreator | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  try {
    const artifact: Artifact = await collection.findById(id);

    // Fetch the creator user
    const creator = artifact.creator_id
      ? await getUserById(artifact.creator_id)
      : null;

    return {
      ...artifact,
      creator: creator || undefined,
    };
  } catch (error) {
    console.error("Artifact not found:", id, error);
    return null;
  }
}

/**
 * Create a new standalone artifact (for public feed)
 * Does NOT create a junction entry - use addArtifactToProject for that
 * @param data.creator_id - User's email (will be looked up to store User.id)
 */
export async function createArtifact(data: {
  type: ArtifactType;
  source_url: string;
  file_path?: string | null;
  name: string;
  creator_id: string; // User's email
  metadata?: Record<string, unknown>;
  published?: boolean;
  description?: string;
  tags?: string[]; // Optional: tags for categorization/filtering
  reactions?: { like: string[]; dislike: string[] }; // Optional: for migration/import purposes
}): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Look up user by email to get their User.id
  const user = await getUserByEmail(data.creator_id);
  if (!user) {
    throw new Error(`User not found for email: ${data.creator_id}`);
  }

  const artifactData = {
    type: data.type,
    source_url: data.source_url,
    file_path: data.file_path || null,
    name: data.name,
    creator_id: user.id, // Store User.id, not email
    metadata: data.metadata || {},
    reactions: data.reactions || { like: [], dislike: [] },
    published: data.published ?? false,
    description: data.description || "",
    tags: data.tags || [],
  };

  // NOTE: Quick.db auto-generates created_at/updated_at - we can't override them
  // Original timestamps are stored in metadata.original_created_at instead

  return await collection.create(artifactData);
}

/**
 * Create artifact and add it to a project/page in one operation
 * Used when creating artifacts from within a project context
 * @param data.creator_id - User's email (will be looked up to store User.id)
 */
export async function createArtifactInProject(data: {
  project_id: string;
  page_id: string;
  type: ArtifactType;
  source_url: string;
  file_path?: string | null;
  name: string;
  creator_id: string; // User's email
  metadata?: Record<string, unknown>;
  published?: boolean;
  description?: string;
  tags?: string[]; // Optional: tags for categorization/filtering
  reactions?: { like: string[]; dislike: string[] }; // Optional: for migration/import purposes
}): Promise<{ artifact: Artifact; projectArtifact: ProjectArtifact }> {
  // Create the artifact (unpublished by default when in a project)
  // Note: createArtifact will handle the email -> User.id lookup
  const artifact = await createArtifact({
    type: data.type,
    source_url: data.source_url,
    file_path: data.file_path,
    name: data.name,
    creator_id: data.creator_id, // Pass email, createArtifact will look up User.id
    metadata: data.metadata,
    published: data.published ?? false,
    description: data.description,
    tags: data.tags,
    reactions: data.reactions,
  });

  // Get next position and create junction entry
  const position = await getNextArtifactPosition(data.page_id);
  const projectArtifact = await createProjectArtifact({
    project_id: data.project_id,
    page_id: data.page_id,
    artifact_id: artifact.id,
    position,
  });

  return { artifact, projectArtifact };
}

/**
 * Add an existing artifact to a project/page
 * Used for "Save to Project" functionality
 */
export async function addArtifactToProject(data: {
  project_id: string;
  page_id: string;
  artifact_id: string;
}): Promise<ProjectArtifact> {
  const position = await getNextArtifactPosition(data.page_id);

  return await createProjectArtifact({
    project_id: data.project_id,
    page_id: data.page_id,
    artifact_id: data.artifact_id,
    position,
  });
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
 * Delete an artifact (only the artifact, not junction entries)
 * Use removeArtifactFromProject for proper deletion with cascade logic
 */
export async function deleteArtifact(id: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  await collection.delete(id);
}

/**
 * Remove an artifact from a project/page
 * Handles cascade logic: only deletes the artifact if user is creator and it's orphaned
 *
 * @param projectArtifactId - The junction entry ID
 * @param currentUserEmail - Email of the user performing the action
 * @returns Object indicating what was deleted
 */
export async function removeArtifactFromProject(
  projectArtifactId: string,
  currentUserEmail: string
): Promise<{ junctionDeleted: boolean; artifactDeleted: boolean }> {
  const quick = await waitForQuick();
  const junctionCollection = quick.db.collection("project_artifacts");

  // Get the junction entry to find the artifact ID
  let junctionEntry: ProjectArtifact;
  try {
    junctionEntry = await junctionCollection.findById(projectArtifactId);
  } catch {
    return { junctionDeleted: false, artifactDeleted: false };
  }

  const artifactId = junctionEntry.artifact_id;

  // Delete the junction entry
  await junctionCollection.delete(projectArtifactId);

  // Check if artifact is now orphaned (no more junction entries)
  const remainingLinks = await getProjectArtifactsByArtifact(artifactId);

  if (remainingLinks.length === 0) {
    // Artifact is orphaned - check if user is the creator
    const artifact = await getArtifactById(artifactId);

    // Look up user by email to get their User.id
    const user = await getUserByEmail(currentUserEmail);
    const userId = user?.id;

    if (artifact && userId && artifact.creator_id === userId) {
      // User is creator and artifact is orphaned - delete it
      await deleteArtifact(artifactId);
      return { junctionDeleted: true, artifactDeleted: true };
    }
  }

  return { junctionDeleted: true, artifactDeleted: false };
}

/**
 * Reorder artifacts (batch update positions on junction entries)
 * @deprecated Use reorderProjectArtifacts instead
 */
export async function reorderArtifacts(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  // This now updates junction entries, not artifacts directly
  await reorderProjectArtifacts(updates);
}

// ==================== ACCESS CONTROL ====================
// Access control functions moved to lib/access-control.ts
// All project and folder access is now managed through the unified access_control collection

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get the next available position for a new item
 * For artifacts, use getNextArtifactPosition instead (uses junction table)
 */
export async function getNextPosition(
  collection: "pages",
  parentId: string,
  parentField: "project_id"
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
): Promise<ArtifactWithPosition[]> {
  const pages = await getPages(projectId);
  if (pages.length === 0) {
    return [];
  }
  const firstPage = pages.find((p) => p.position === 0) || pages[0];
  const artifacts = await getArtifactsByPage(firstPage.id);
  return artifacts.slice(0, 3);
}
