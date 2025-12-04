"use client";

import { waitForQuick } from "./quick";
import { getProjects } from "./quick-db";
import { searchUsers as searchUsersFromAccessControl } from "./access-control";
import type { Artifact, Project, User, ProjectArtifact, Page } from "@/types";
import type { ProjectWithCover } from "@/hooks/useProjectsData";

/**
 * Search Results
 *
 * Grouped results from searching across resources
 */
export type SearchResults = {
  projects: ProjectWithCover[];
  publishedArtifacts: Artifact[];
  users: User[];
};

/**
 * Search through resources
 *
 * Always returns:
 * - Projects the user belongs to (matching query) with cover data
 * - All published artifacts (matching query)
 * - Users (matching query)
 *
 * @param query - Search term (case-insensitive)
 * @param userId - User.id of the user performing the search
 * @returns SearchResults grouped by resource type
 */
export async function searchResources(
  query: string,
  userId: string
): Promise<SearchResults> {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();

  // Handle empty query
  if (!normalizedQuery) {
    return {
      projects: [],
      publishedArtifacts: [],
      users: [],
    };
  }

  // Validate userId
  if (!userId || !userId.trim()) {
    throw new Error("User ID is required for search");
  }

  const quick = await waitForQuick();

  // Search all three in parallel
  const [projects, publishedArtifacts, users] = await Promise.all([
    searchProjectsWithCovers(normalizedQuery, userId, quick),
    searchPublishedArtifacts(normalizedQuery, quick),
    searchUsers(normalizedQuery, quick),
  ]);

  return {
    projects,
    publishedArtifacts,
    users,
  };
}

/**
 * Search for user's accessible projects by name and enrich with cover data
 * @param userId - User.id to check access for
 */
async function searchProjectsWithCovers(
  normalizedQuery: string,
  userId: string,
  quick: any
): Promise<ProjectWithCover[]> {
  const userProjects = await getProjects(userId);

  // Filter by query first
  const matchingProjects = userProjects.filter((project) =>
    project.name.toLowerCase().includes(normalizedQuery)
  );

  if (matchingProjects.length === 0) {
    return [];
  }

  // Enrich with cover data
  const projectIds = matchingProjects.map((p) => p.id);

  // Batch fetch pages and junction entries
  const [allPages, allJunctionEntries] = await Promise.all([
    quick.db
      .collection("pages")
      .where({ project_id: { $in: projectIds } })
      .find(),
    quick.db
      .collection("project_artifacts")
      .where({ project_id: { $in: projectIds } })
      .find(),
  ]);

  // Group pages by project_id
  const pagesByProject = new Map<string, Page[]>();
  for (const page of allPages) {
    const pages = pagesByProject.get(page.project_id) || [];
    pages.push(page);
    pagesByProject.set(page.project_id, pages);
  }

  // Group junction entries by project_id and collect artifact IDs
  const junctionByProject = new Map<string, ProjectArtifact[]>();
  const allArtifactIds = new Set<string>();
  for (const entry of allJunctionEntries) {
    const entries = junctionByProject.get(entry.project_id) || [];
    entries.push(entry);
    junctionByProject.set(entry.project_id, entries);
    allArtifactIds.add(entry.artifact_id);
  }

  // Batch fetch artifacts for covers
  const allArtifacts: Artifact[] =
    allArtifactIds.size > 0
      ? await quick.db
          .collection("artifacts")
          .where({ id: { $in: Array.from(allArtifactIds) } })
          .find()
      : [];

  // Create artifact lookup map
  const artifactById = new Map<string, Artifact>();
  for (const artifact of allArtifacts) {
    artifactById.set(artifact.id, artifact);
  }

  // Build projects with covers
  return matchingProjects.map((project) => {
    const projectJunctions = junctionByProject.get(project.id) || [];
    const projectPages = pagesByProject.get(project.id) || [];

    // Find first page
    const sortedPages = projectPages.sort((a, b) => a.position - b.position);
    const firstPage =
      sortedPages.find((p) => p.position === 0) || sortedPages[0];

    // Get cover artifacts (first 3 from first page)
    let coverArtifacts: Artifact[] = [];
    if (firstPage) {
      const firstPageJunctions = projectJunctions
        .filter((j) => j.page_id === firstPage.id)
        .sort((a, b) => a.position - b.position);

      coverArtifacts = firstPageJunctions
        .slice(0, 3)
        .map((j) => {
          const artifact = artifactById.get(j.artifact_id);
          if (!artifact) return null;
          return { ...artifact, name: j.name || artifact.name };
        })
        .filter((a): a is Artifact => a !== null);
    }

    return {
      ...project,
      coverArtifacts,
      artifactCount: projectJunctions.length,
    };
  });
}

/**
 * Search for published artifacts by name
 * Uses .where() to filter by published at the database level
 */
async function searchPublishedArtifacts(
  normalizedQuery: string,
  quick: any
): Promise<Artifact[]> {
  const collection = quick.db.collection("artifacts");

  // Use .where() to filter by published at the database level
  const publishedArtifacts = await collection.where({ published: true }).find();

  // Client-side filtering for name substring match (case-insensitive)
  return publishedArtifacts.filter((artifact: Artifact) =>
    artifact.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for users by name
 * Falls back to database users in local dev when /users.json isn't available
 */
async function searchUsers(
  normalizedQuery: string,
  quick: any
): Promise<User[]> {
  // Try the access control search first (fetches from /users.json)
  const users = await searchUsersFromAccessControl(normalizedQuery);

  // If we got results, return them
  if (users.length > 0) {
    return users;
  }

  // Normalize to remove diacritics (e.g., "ë" -> "e", "é" -> "e")
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const normalizedSearchQuery = normalize(normalizedQuery);

  // Fall back to searching users in the database (for local dev with mock data)
  try {
    const dbUsers: User[] = await quick.db.collection("users").find();
    return dbUsers.filter((user) =>
      normalize(user.name || "").includes(normalizedSearchQuery)
    );
  } catch {
    return [];
  }
}
