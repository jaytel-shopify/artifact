import useSWR from "swr";
import type { Project, Artifact, Folder, ProjectArtifact, Page } from "@/types";
import { getProjects } from "@/lib/quick-db";
import { getUserAccessibleResources } from "@/lib/access-control";
import { cacheKeys } from "@/lib/cache-keys";
import { waitForQuick } from "@/lib/quick";

export type ProjectWithCover = Project & {
  coverArtifacts: Artifact[];
  artifactCount: number;
};
export type FolderWithCount = Folder & { projectCount: number };

export interface ProjectsData {
  projects: ProjectWithCover[];
  folders: FolderWithCount[];
}

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts from the first page for covers
 * Optimized to use batch queries instead of N+1 queries per project
 * @param userId - User.id to fetch data for
 */
async function fetcher(userId?: string): Promise<ProjectsData> {
  const quick = await waitForQuick();

  // Parallel loading - fetch projects and folder access simultaneously
  const [projects, userFoldersAccess] = await Promise.all([
    getProjects(userId),
    getUserAccessibleResources(userId || "", "folder"),
  ]);

  const projectIds = projects.map((p) => p.id);

  // Batch fetch all data needed for project covers in parallel
  const [allPages, allJunctionEntries, folderDocs] = await Promise.all([
    // Get all pages for all projects in one query
    projectIds.length > 0
      ? quick.db
          .collection("pages")
          .where({ project_id: { $in: projectIds } })
          .find()
      : Promise.resolve([]),
    // Get all junction entries for all projects in one query
    projectIds.length > 0
      ? quick.db
          .collection("project_artifacts")
          .where({ project_id: { $in: projectIds } })
          .find()
      : Promise.resolve([]),
    // Get all folders in one query
    userFoldersAccess.length > 0
      ? quick.db
          .collection("folders")
          .where({ id: { $in: userFoldersAccess.map((a) => a.resource_id) } })
          .find()
      : Promise.resolve([]),
  ]);

  // Group pages by project_id
  const pagesByProject = new Map<string, Page[]>();
  for (const page of allPages) {
    const pages = pagesByProject.get(page.project_id) || [];
    pages.push(page);
    pagesByProject.set(page.project_id, pages);
  }

  // Group junction entries by project_id and collect all artifact IDs
  const junctionByProject = new Map<string, ProjectArtifact[]>();
  const allArtifactIds = new Set<string>();
  for (const entry of allJunctionEntries) {
    const entries = junctionByProject.get(entry.project_id) || [];
    entries.push(entry);
    junctionByProject.set(entry.project_id, entries);
    allArtifactIds.add(entry.artifact_id);
  }

  // Batch fetch all artifacts referenced by junction entries
  const allArtifacts =
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

  // Build projects with covers using the pre-fetched data
  const projectsWithCovers: ProjectWithCover[] = projects.map((project) => {
    const projectJunctions = junctionByProject.get(project.id) || [];
    const projectPages = pagesByProject.get(project.id) || [];

    // Find first page (position 0 or first in list)
    const sortedPages = projectPages.sort((a, b) => a.position - b.position);
    const firstPage = sortedPages.find((p) => p.position === 0) || sortedPages[0];

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

  // Build folders with project counts
  const validFolders = folderDocs.filter((f): f is Folder => f !== null);

  // Count projects per folder from already-loaded projects
  const projectCountByFolder = new Map<string, number>();
  for (const project of projects) {
    if (project.folder_id) {
      const count = projectCountByFolder.get(project.folder_id) || 0;
      projectCountByFolder.set(project.folder_id, count + 1);
    }
  }

  const foldersWithCounts: FolderWithCount[] = validFolders.map((folder) => ({
    ...folder,
    projectCount: projectCountByFolder.get(folder.id) || 0,
  }));

  return {
    projects: projectsWithCovers,
    folders: foldersWithCounts,
  };
}

/**
 * Hook to fetch and manage projects, folders, and published artifacts data
 * @param userId - User.id to fetch data for
 */
export function useProjectsData(userId?: string) {
  const { data, isLoading, error, mutate } = useSWR<ProjectsData>(
    cacheKeys.projectsData(userId),
    () => (userId ? fetcher(userId) : { projects: [], folders: [] }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      refreshInterval: 60000,
      keepPreviousData: true, // Prevent flashing during revalidation
    }
  );

  const projects = data?.projects || [];
  const folders = data?.folders || [];

  // Only show loading on initial load (no data yet), not during revalidation
  const isInitialLoading = isLoading && !data;

  return {
    projects,
    folders,
    isLoading: isInitialLoading,
    error,
    mutate,
  };
}
