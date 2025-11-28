/**
 * Centralized SWR cache keys
 *
 * These keys are used across components to enable globalMutate
 * without prop drilling. Components can refresh data by calling:
 *
 * import { mutate as globalMutate } from "swr";
 * import { cacheKeys } from "@/lib/cache-keys";
 *
 * globalMutate(cacheKeys.projectsData(user?.email));
 */

export const cacheKeys = {
  /** Projects, folders, and published artifacts for a user */
  projectsData: (email?: string) =>
    email ? `projects-folders-${email}` : null,

  /** Single folder view data */
  folderData: (folderId?: string) => (folderId ? `folder-${folderId}` : null),

  /** Single project data (for presentation page) */
  projectData: (projectId?: string) =>
    projectId ? `project-${projectId}` : null,

  /** Public artifacts feed */
  publicArtifacts: "public-artifacts",
} as const;
