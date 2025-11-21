import useSWR from "swr";
import type { Project, Artifact, Folder } from "@/types";
import {
  getProjects,
  getPublishedArtifacts,
  getProjectCoverArtifacts,
} from "@/lib/quick-db";
import { getProjectCountInFolder } from "@/lib/quick-folders";
import { getUserAccessibleResources } from "@/lib/access-control";

export type ProjectWithCover = Project & { coverArtifacts: Artifact[] };
export type FolderWithCount = Folder & { projectCount: number };

export interface ProjectsData {
  projects: ProjectWithCover[];
  folders: FolderWithCount[];
  publishedArtifacts: Artifact[];
}

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts from the first page for covers
 */
async function fetcher(userEmail?: string): Promise<ProjectsData> {
  // Parallel loading - fetch projects, folders, and published artifacts simultaneously
  const [projects, userFoldersAccess, publishedArtifacts] = await Promise.all([
    getProjects(userEmail),
    getUserAccessibleResources(userEmail || "", "folder"),
    userEmail ? getPublishedArtifacts(userEmail) : Promise.resolve([]),
  ]);

  // Get full folder details from access entries
  const { getFolderById } = await import("@/lib/quick-folders");
  const userFolders = await Promise.all(
    userFoldersAccess.map((access) => getFolderById(access.resource_id))
  );
  const validFolders = userFolders.filter((f): f is Folder => f !== null);

  // Get cover artifacts for projects from their first page (in parallel)
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      const coverArtifacts = await getProjectCoverArtifacts(project.id);
      return {
        ...project,
        coverArtifacts,
      };
    })
  );

  // Get project counts for folders (in parallel)
  const foldersWithCounts = await Promise.all(
    validFolders.map(async (folder) => {
      const count = await getProjectCountInFolder(folder.id);
      return { ...folder, projectCount: count };
    })
  );

  return {
    projects: projectsWithCovers,
    folders: foldersWithCounts,
    publishedArtifacts,
  };
}

/**
 * Hook to fetch and manage projects, folders, and published artifacts data
 */
export function useProjectsData(userEmail?: string) {
  const { data, isLoading, error, mutate } = useSWR<ProjectsData>(
    userEmail ? `projects-folders-${userEmail}` : null,
    () =>
      userEmail
        ? fetcher(userEmail)
        : { projects: [], folders: [], publishedArtifacts: [] },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  );

  const projects = data?.projects || [];
  const folders = data?.folders || [];
  const publishedArtifacts = data?.publishedArtifacts || [];

  return {
    projects,
    folders,
    publishedArtifacts,
    isLoading,
    error,
    mutate,
  };
}
