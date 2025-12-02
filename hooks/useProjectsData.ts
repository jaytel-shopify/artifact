import useSWR from "swr";
import type { Project, Artifact, Folder } from "@/types";
import {
  getProjects,
  getProjectCoverArtifacts,
  getProjectArtifactsByProject,
} from "@/lib/quick-db";
import { getProjectCountInFolder, getFolderById } from "@/lib/quick-folders";
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
}

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts from the first page for covers
 * @param userId - User.id to fetch data for
 * @param userEmail - User email (still needed for some legacy functions)
 */
async function fetcher(userId?: string): Promise<ProjectsData> {
  // Parallel loading - fetch projects, folders, and published artifacts simultaneously
  const [projects, userFoldersAccess] = await Promise.all([
    getProjects(userId),
    getUserAccessibleResources(userId || "", "folder"),
  ]);

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
      const count = await getProjectCountInFolder(folder.id, userId);
      return { ...folder, projectCount: count };
    })
  );

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
      dedupingInterval: 2000, // Reduced to allow rapid mutations
      refreshInterval: 60000,
    }
  );

  const projects = data?.projects || [];
  const folders = data?.folders || [];

  return {
    projects,
    folders,
    isLoading,
    error,
    mutate,
  };
}
