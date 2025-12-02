"use client";

import { waitForQuick } from "./quick";
import { getProjects } from "./quick-db";
import { getUserAccessibleResources } from "./access-control";
import type { Artifact, Project, Folder, ProjectArtifact } from "@/types";

/**
 * Search mode determines which resources to search
 * - "public": Only published artifacts (for homepage)
 * - "dashboard": Only user's folders, projects, and personal artifacts
 * - "all": Search everything (default)
 */
export type SearchMode = "public" | "dashboard" | "all";

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
 * Searches based on mode:
 * - "public": Only published artifacts
 * - "dashboard": User's folders, projects, and personal artifacts
 * - "all": Everything (default)
 *
 * @param query - Search term (case-insensitive)
 * @param userId - User.id of the user performing the search
 * @param mode - Search mode ("public" | "dashboard" | "all")
 * @returns SearchResults grouped by resource type
 */
export async function searchResources(
  query: string,
  userId: string,
  mode: SearchMode = "all"
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

  // Validate userId
  if (!userId || !userId.trim()) {
    throw new Error("User ID is required for search");
  }

  const quick = await waitForQuick();

  // Search based on mode
  if (mode === "public") {
    // Only search published artifacts
    const publicArtifacts = await searchPublicArtifacts(normalizedQuery, quick);
    return {
      publicArtifacts,
      folders: [],
      projects: [],
      personalArtifacts: [],
    };
  }

  if (mode === "dashboard") {
    // Only search user's dashboard content (folders, projects, personal artifacts)
    const [folders, projects] = await Promise.all([
      searchFolders(normalizedQuery, userId),
      searchProjects(normalizedQuery, userId),
    ]);

    // Get personal artifacts linked to user's accessible projects
    const accessibleProjectIds = projects.map((p) => p.id);
    const personalArtifacts = await getPersonalArtifactsViaJunction(
      normalizedQuery,
      accessibleProjectIds,
      quick
    );

    return {
      publicArtifacts: [],
      folders,
      projects,
      personalArtifacts,
    };
  }

  // Default: search everything
  const [publicArtifacts, folders, projects] = await Promise.all([
    searchPublicArtifacts(normalizedQuery, quick),
    searchFolders(normalizedQuery, userId),
    searchProjects(normalizedQuery, userId),
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
 * @param userId - User.id to check access for
 */
async function searchFolders(
  normalizedQuery: string,
  userId: string
): Promise<Folder[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("folders");

  // Get all folders
  const allFolders = await collection.find();

  // Get folders user has access to via access control system (now uses user_id)
  const accessibleFolders = await getUserAccessibleResources(
    userId,
    "folder"
  );
  const accessibleFolderIds = new Set(
    accessibleFolders.map((a) => a.resource_id)
  );

  // Filter folders: user is creator (by User.id) OR user has access via access control
  const userFolders = allFolders.filter(
    (f: Folder) => f.creator_id === userId || accessibleFolderIds.has(f.id)
  );

  // Client-side filtering for name substring match (case-insensitive)
  return userFolders.filter((folder: Folder) =>
    folder.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for user's accessible projects by name
 * Uses getProjects() which returns projects the user created OR has been granted access to
 * @param userId - User.id to check access for
 */
async function searchProjects(
  normalizedQuery: string,
  userId: string
): Promise<Project[]> {
  const userProjects = await getProjects(userId);

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
