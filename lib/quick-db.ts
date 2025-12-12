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
import { getUserById } from "./quick-users";
import { deleteArtifactFiles } from "./quick-storage";

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
 * @param userId - User.id to get projects for
 */
export async function getProjects(userId?: string): Promise<Project[]> {
  if (!userId) return [];

  // Get projects user has access to via access control system (now uses user_id)
  const accessibleProjects = await getUserAccessibleResources(
    userId,
    "project"
  );
  const accessibleProjectIds = accessibleProjects.map((a) => a.resource_id);

  // Return early if user has no accessible projects (avoids $in: [] query issue)
  if (accessibleProjectIds.length === 0) return [];

  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  const userProjects = await collection
    .where({ id: { $in: accessibleProjectIds } })
    .orderBy("created_at", "desc")
    .find();

  return userProjects;
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
 * @param data.creator_id - User's ID
 */
export async function createProject(data: {
  name: string;
  creator_id: string; // User's ID
  folder_id?: string | null; // Optional folder assignment
}): Promise<Project> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  // Look up user by ID to get their email for access control display
  let user = await getUserById(data.creator_id);
  
  // If user not found by ID, try to find by looking at all users and matching
  // This handles cases where Quick.db may have stored the user with a different ID format
  if (!user) {
    console.warn(`[createProject] User not found by ID: ${data.creator_id}, attempting sync...`);
    // Get identity from Quick and try to create/sync the user
    const identity = await quick.id.waitForUser();
    if (identity && identity.id === data.creator_id) {
      // Re-sync user to database
      const { getOrCreateUser } = await import("./quick-users");
      user = await getOrCreateUser({
        id: identity.id,
        email: identity.email,
        fullName: identity.fullName,
        firstName: identity.firstName,
        slackImageUrl: identity.slackImageUrl,
        slackId: identity.slackId,
        slackHandle: identity.slackHandle,
        title: identity.title,
      });
    }
  }
  
  if (!user) {
    throw new Error(`User not found for id: ${data.creator_id}. Please refresh the page and try again.`);
  }

  const projectData = {
    name: data.name,
    creator_id: data.creator_id,
    folder_id: data.folder_id || null,
  };

  const project = await collection.create(projectData);

  // Grant owner access to creator (access control uses user_id)
  await grantAccess(
    project.id,
    "project",
    user.id,
    user.email, // User's email (for display)
    "owner",
    user.id // Granted by self
  );

  // Create default page for the project
  await createPage({
    project_id: project.id,
    name: "Page 01",
    position: 0,
  });

  (window as any).quicklytics?.track("create_project", {
    project_id: project.id,
    project_name: project.name,
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

  //TODO: check access control

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

  const page = await collection.create(data);

  (window as any).quicklytics?.track("create_page", {
    page_id: page.id,
    page_name: page.name,
  });

  return page;
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

  //TODO: check access control

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
  name: string;
}): Promise<ProjectArtifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("project_artifacts");

  return await collection.create(data);
}

/**
 * Update a junction entry (e.g., change position or name)
 */
export async function updateProjectArtifact(
  id: string,
  updates: Partial<Pick<ProjectArtifact, "position" | "page_id" | "name">>
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
 * Get published artifacts created by the current user
 * Returns only artifacts where published=true and creator_id matches the user
 * Sorted by most recently created first
 * @param userEmail - User's email (will be looked up to get User.id)
 */
export async function getPublishedArtifacts(
  userId?: string
): Promise<Artifact[]> {
  if (!userId) return [];

  const user = await getUserById(userId);
  if (!user) return [];

  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  return await collection
    .where({ published: true, creator_id: user.id })
    .orderBy("created_at", "desc")
    .find();
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

  const artifactIds = junctionEntries.map((e) => e.artifact_id);

  // Fetch all artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts = await artifactsCollection
    .where({ id: { $in: artifactIds } })
    .find();

  // Combine artifacts with position from junction table
  // Use name from junction entry (ProjectArtifact.name) instead of artifact's name
  const result: ArtifactWithPosition[] = [];
  for (const entry of junctionEntries) {
    const artifact = allArtifacts.find(
      (a: Artifact) => a.id === entry.artifact_id
    );
    if (!artifact) continue;

    result.push({
      ...artifact,
      name: entry.name || artifact.name, // Prefer junction entry name
      position: entry.position,
      project_artifact_id: entry.id,
    });
  }

  // Sort by position
  return result.sort((a, b) => a.position - b.position);
}

/**
 * Get a single artifact by ID with creator and publisher user data
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

    // Fetch the publisher user (if different from creator)
    const publisher = artifact.published_by
      ? await getUserById(artifact.published_by)
      : null;

    return {
      ...artifact,
      creator: creator || undefined,
      publisher: publisher || undefined,
    };
  } catch (error) {
    console.error("Artifact not found:", id, error);
    return null;
  }
}

/**
 * Create a new standalone artifact (for public feed)
 * Does NOT create a junction entry - use addArtifactToProject for that
 * @param data.creator_id - User's ID
 */
export async function createArtifact(data: {
  type: ArtifactType;
  source_url: string;
  file_path?: string | null;
  name: string;
  creator_id: string; // User's ID
  metadata?: Record<string, unknown>;
  published?: boolean;
  description?: string;
  tags?: string[]; // Optional: tags for categorization/filtering
  reactions?: { like: string[]; dislike: string[] }; // Optional: for migration/import purposes
}): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  const artifactData = {
    type: data.type,
    source_url: data.source_url,
    file_path: data.file_path || null,
    name: data.name,
    creator_id: data.creator_id,
    metadata: data.metadata || {},
    reactions: data.reactions || { like: [], dislike: [] },
    published: data.published ?? false,
    description: data.description || "",
    tags: data.tags || [],
    published_at: new Date().toISOString(),
  };

  // NOTE: Quick.db auto-generates created_at/updated_at - we can't override them
  // Original timestamps are stored in metadata.original_created_at instead

  const response = await collection.create(artifactData);

  (window as any).quicklytics?.track("create_artifact", {
    artifact_id: response.id,
    artifact_type: response.type,
    artifact_name: response.name,
  });

  return response;
}

/**
 * Create artifact and add it to a project/page in one operation
 * Used when creating artifacts from within a project context
 * @param data.creator_id - User's ID
 */
export async function createArtifactInProject(data: {
  project_id: string;
  page_id: string;
  type: ArtifactType;
  source_url: string;
  file_path?: string | null;
  name: string;
  creator_id: string; // User's ID
  metadata?: Record<string, unknown>;
  published?: boolean;
  description?: string;
  tags?: string[]; // Optional: tags for categorization/filtering
  reactions?: { like: string[]; dislike: string[] }; // Optional: for migration/import purposes
}): Promise<{ artifact: Artifact; projectArtifact: ProjectArtifact }> {
  // Create the artifact (unpublished by default when in a project)
  const artifact = await createArtifact({
    type: data.type,
    source_url: data.source_url,
    file_path: data.file_path,
    name: data.name,
    creator_id: data.creator_id,
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
    name: data.name,
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
  name: string;
}): Promise<ProjectArtifact> {
  const position = await getNextArtifactPosition(data.page_id);

  return await createProjectArtifact({
    project_id: data.project_id,
    page_id: data.page_id,
    artifact_id: data.artifact_id,
    position,
    name: data.name,
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
 * Delete an artifact and its associated files from storage
 * Use removeArtifactFromProject for proper deletion with cascade logic
 */
export async function deleteArtifact(
  id: string,
  cascade: boolean = false
): Promise<void> {
  if (cascade) {
    await removeArtifactFromProject(id);
  } else {
    const quick = await waitForQuick();
    const collection = quick.db.collection("artifacts");
    let artifact: Artifact | null = null;
    // Get the artifact to find its files before deleting
    try {
      artifact = await collection.findById(id);
      if (artifact) {
        // Delete associated files from Quick.fs
        await deleteArtifactFiles(artifact);
      }
    } catch (error) {
      console.error("Error fetching artifact for file cleanup:", error);
      // Continue with deletion even if we couldn't get the artifact
    }

    await collection.delete(id);

    (window as any).quicklytics?.track("delete_artifact", {
      artifact_id: id,
      artifact_type: artifact?.type,
      artifact_name: artifact?.name,
    });
  }
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
  projectArtifactId: string
): Promise<{ junctionDeleted: boolean; artifactDeleted: boolean }> {
  const quick = await waitForQuick();
  const junctionCollection = quick.db.collection("project_artifacts");
  const artifactsCollection = quick.db.collection("artifacts");

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
    // Artifact is orphaned - check if it's published
    const artifact = await getArtifactById(artifactId);

    if (artifact && !artifact.published) {
      // Artifact is orphaned and unpublished - delete it and its files
      await deleteArtifactFiles(artifact);
      await artifactsCollection.delete(artifactId);
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
