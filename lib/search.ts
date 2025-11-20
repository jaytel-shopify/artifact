"use client";

import { waitForQuick } from "./quick";
import { getProjects } from "./quick-db";
import { getUserAccessibleResources } from "./access-control";
import type { Artifact, Project, Folder } from "@/types";

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
 * 1. Public artifacts (visibility: "public")
 * 2. User's accessible folders (created by user OR granted access via access control)
 * 3. User's accessible projects (created by user OR granted access via access control)
 * 4. User's personal artifacts (from accessible projects, visibility: "private")
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
  const [publicArtifacts, folders, projects, privateArtifacts] =
    await Promise.all([
      searchPublicArtifacts(normalizedQuery, quick),
      searchFolders(normalizedQuery, userEmail),
      searchProjects(normalizedQuery, userEmail),
      getPrivateArtifacts(quick),
    ]);

  // Filter personal artifacts from user's accessible projects
  // 'projects' includes all projects user has access to (owned OR granted access)
  const accessibleProjectIds = new Set(projects.map((p) => p.id));
  const personalArtifacts = privateArtifacts.filter(
    (artifact) =>
      accessibleProjectIds.has(artifact.project_id) &&
      artifact.name.toLowerCase().includes(normalizedQuery)
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
 * Uses .where() to filter by visibility at the database level
 */
async function searchPublicArtifacts(
  normalizedQuery: string,
  quick: any
): Promise<Artifact[]> {
  const collection = quick.db.collection("artifacts");

  // Use .where() to filter by visibility at the database level
  const publicArtifacts = await collection
    .where({ visibility: "public" })
    .find();

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
 * Get all private artifacts for filtering by user's accessible projects
 * Uses .where() to filter by visibility at the database level
 * These will be further filtered to only include artifacts from projects the user has access to
 */
async function getPrivateArtifacts(quick: any): Promise<Artifact[]> {
  const collection = quick.db.collection("artifacts");

  // Use .where() to filter by visibility at the database level
  // This gets ALL private artifacts, which will be filtered by accessible project IDs
  return await collection.where({ visibility: "private" }).find();
}
