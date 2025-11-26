"use client";

import { waitForQuick } from "./quick";
import { getProjects } from "./quick-db";
import { getUserAccessibleResources } from "./access-control";
import type { Artifact, Project, Folder, ProjectArtifact } from "@/types";

/**
 * Search Results
 *
 * Grouped results from searching across all user-accessible resources
 */
export type SearchResults = {
  publicArtifacts: Artifact[];
  folders: Folder[];
  projects: Project[];
  personalArtifacts: Artifact[];
};

/**
 * Search through all resources accessible to a user
 *
 * Searches:
 * 1. Public artifacts (published: true)
 * 2. User's accessible folders (created by user OR granted access via access control)
 * 3. User's accessible projects (created by user OR granted access via access control)
 * 4. User's personal artifacts (linked to accessible projects via junction table, published: false)
 *
 * @param query - Search term (case-insensitive)
 * @param userEmail - Email of the user performing the search
 * @returns SearchResults grouped by resource type
 */
export async function searchResources(
  query: string,
  userEmail: string
): Promise<SearchResults> {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();

  // Handle empty query
  if (!normalizedQuery) {
    return {
      publicArtifacts: [],
      folders: [],
      projects: [],
      personalArtifacts: [],
    };
  }

  // Validate userEmail
  if (!userEmail || !userEmail.trim()) {
    throw new Error("User email is required for search");
  }

  const quick = await waitForQuick();

  // Execute all searches in parallel for performance
  const [publicArtifacts, folders, projects] = await Promise.all([
    searchPublicArtifacts(normalizedQuery, quick),
    searchFolders(normalizedQuery, userEmail),
    searchProjects(normalizedQuery, userEmail),
  ]);

  // Get personal artifacts linked to user's accessible projects
  const accessibleProjectIds = projects.map((p) => p.id);
  const personalArtifacts = await getPersonalArtifactsViaJunction(
    normalizedQuery,
    accessibleProjectIds,
    quick
  );

  return {
    publicArtifacts,
    folders,
    projects,
    personalArtifacts,
  };
}

/**
 * Search for public artifacts by name
 * Uses .where() to filter by published at the database level
 */
async function searchPublicArtifacts(
  normalizedQuery: string,
  quick: any
): Promise<Artifact[]> {
  const collection = quick.db.collection("artifacts");

  // Use .where() to filter by published at the database level
  const publicArtifacts = await collection.where({ published: true }).find();

  // Client-side filtering for name substring match (case-insensitive)
  return publicArtifacts.filter((artifact: Artifact) =>
    artifact.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for user's accessible folders by name
 * Includes folders the user created OR has been granted access to via access control
 */
async function searchFolders(
  normalizedQuery: string,
  userEmail: string
): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Get all folders
  const allFolders = await collection.find();

  // Get folders user has access to via access control system
  const accessibleFolders = await getUserAccessibleResources(
    userEmail,
    "folder"
  );
  const accessibleFolderIds = new Set(
    accessibleFolders.map((a) => a.resource_id)
  );

  // Filter folders: user is creator OR user has access via access control
  const userFolders = allFolders.filter(
    (f: Folder) => f.creator_id === userEmail || accessibleFolderIds.has(f.id)
  );

  // Client-side filtering for name substring match (case-insensitive)
  return userFolders.filter((folder: Folder) =>
    folder.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for user's accessible projects by name
 * Uses getProjects() which returns projects the user created OR has been granted access to
 */
async function searchProjects(
  normalizedQuery: string,
  userEmail: string
): Promise<Project[]> {
  const userProjects = await getProjects(userEmail);

  // Client-side filtering for name substring match (case-insensitive)
  return userProjects.filter((project) =>
    project.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get personal artifacts linked to accessible projects via junction table
 * Only returns unpublished artifacts that match the search query
 */
async function getPersonalArtifactsViaJunction(
  normalizedQuery: string,
  accessibleProjectIds: string[],
  quick: any
): Promise<Artifact[]> {
  if (accessibleProjectIds.length === 0) {
    return [];
  }

  // Get junction entries for accessible projects
  const junctionCollection = quick.db.collection("project_artifacts");
  const allJunctionEntries: ProjectArtifact[] = await junctionCollection.find();

  // Filter junction entries to only those in accessible projects
  const accessibleProjectIdSet = new Set(accessibleProjectIds);
  const relevantJunctionEntries = allJunctionEntries.filter(
    (entry: ProjectArtifact) => accessibleProjectIdSet.has(entry.project_id)
  );

  if (relevantJunctionEntries.length === 0) {
    return [];
  }

  // Get unique artifact IDs from junction entries
  const artifactIds = new Set(
    relevantJunctionEntries.map((entry: ProjectArtifact) => entry.artifact_id)
  );

  // Fetch all artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts: Artifact[] = await artifactsCollection.find();

  // Filter to:
  // 1. Only artifacts linked to accessible projects
  // 2. Only unpublished artifacts
  // 3. Only artifacts matching the search query
  return allArtifacts.filter(
    (artifact: Artifact) =>
      artifactIds.has(artifact.id) &&
      !artifact.published &&
      artifact.name.toLowerCase().includes(normalizedQuery)
  );
}
