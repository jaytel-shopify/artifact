import useSWR from "swr";
import type { Project, Artifact, Folder } from "@/types";
import {
  getProjects,
  getPublishedArtifacts,
  getProjectCoverArtifacts,
  getProjectArtifactsByProject,
} from "@/lib/quick-db";
import { getProjectCountInFolder } from "@/lib/quick-folders";
import { getUserAccessibleResources } from "@/lib/access-control";
import { cacheKeys } from "@/lib/cache-keys";

export type ProjectWithCover = Project & {
  coverArtifacts: Artifact[];
  artifactCount: number;
};
export type FolderWithCount = Folder & { projectCount: number };

export interface ProjectsData {
  projects: ProjectWithCover[];
  folders: FolderWithCount[];
  publishedArtifacts: Artifact[];
}

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts from the first page for covers
 * @param userId - User.id to fetch data for
 * @param userEmail - User email (still needed for some legacy functions)
 */
async function fetcher(userId?: string): Promise<ProjectsData> {
  // Parallel loading - fetch projects, folders, and published artifacts simultaneously
  const [projects, userFoldersAccess, publishedArtifacts] = await Promise.all([
    getProjects(userId),
    getUserAccessibleResources(userId || "", "folder"),
    userId ? getPublishedArtifacts(userId) : Promise.resolve([]),
  ]);

  // Get full folder details from access entries
  const { getFolderById } = await import("@/lib/quick-folders");
  const userFolders = await Promise.all(
    userFoldersAccess.map((access) => getFolderById(access.resource_id))
  );
  const validFolders = userFolders.filter((f): f is Folder => f !== null);

  // Get cover artifacts and total artifact count for projects (in parallel)
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      const [coverArtifacts, allProjectArtifacts] = await Promise.all([
        getProjectCoverArtifacts(project.id),
        getProjectArtifactsByProject(project.id),
      ]);
      return {
        ...project,
        coverArtifacts,
        artifactCount: allProjectArtifacts.length,
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
 * @param userId - User.id to fetch data for
 */
export function useProjectsData(userId?: string) {
  const { data, isLoading, error, mutate } = useSWR<ProjectsData>(
    cacheKeys.projectsData(userId),
    () =>
      userId
        ? fetcher(userId)
        : { projects: [], folders: [], publishedArtifacts: [] },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // Reduced to allow rapid mutations
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
