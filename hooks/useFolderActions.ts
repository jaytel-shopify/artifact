import { useCallback } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { cacheKeys } from "@/lib/cache-keys";
import type { Project } from "@/types";
import type { ProjectsData } from "./useProjectsData";

interface Folder {
  id: string;
  name: string;
}

/**
 * Hook to handle moving projects in/out of folders
 */
export function useFolderActions(
  project: Project | null | undefined,
  userFolders: Folder[],
  userId?: string
) {
  const handleProjectNameUpdate = useCallback(
    (name: string) => {
      if (!project) return;
      project.name = name;
    },
    [project]
  );

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      if (!project) return;

      const oldFolderId = project.folder_id;
      const folder = userFolders.find((f) => f.id === folderId);
      const projectsKey = cacheKeys.projectsData(userId);

      // Optimistically update the cache - this happens synchronously
      globalMutate(
        projectsKey,
        (currentData: ProjectsData | undefined) => {
          if (!currentData) return currentData;

          const updatedProjects = currentData.projects.map((p) =>
            p.id === project.id ? { ...p, folder_id: folderId } : p
          );

          const updatedFolders = currentData.folders.map((f) => {
            if (f.id === folderId) {
              return { ...f, projectCount: f.projectCount + 1 };
            }
            if (f.id === oldFolderId) {
              return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
            }
            return f;
          });

          return {
            projects: updatedProjects,
            folders: updatedFolders,
          };
        },
        { revalidate: false }
      );

      // Show success immediately (optimistic)
      toast.success(`Moved to ${folder?.name || "folder"}`);

      // Do server work in background - don't await
      (async () => {
        try {
          const { moveProjectToFolder } = await import("@/lib/quick-folders");
          await moveProjectToFolder(project.id, folderId);

          // Silently revalidate folder caches in background
          if (oldFolderId) {
            globalMutate(cacheKeys.folderData(oldFolderId));
          }
          globalMutate(cacheKeys.folderData(folderId));
        } catch (error) {
          // Revert optimistic update on error
          console.error("Failed to move project:", error);
          toast.error("Failed to move project - reverting");
          globalMutate(projectsKey);
        }
      })();
    },
    [project, userFolders, userId]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!project) return;

    const oldFolderId = project.folder_id;
    const projectsKey = cacheKeys.projectsData(userId);

    // Optimistically update the cache - this happens synchronously
    globalMutate(
      projectsKey,
      (currentData: ProjectsData | undefined) => {
        if (!currentData) return currentData;

        const updatedProjects = currentData.projects.map((p) =>
          p.id === project.id ? { ...p, folder_id: null } : p
        );

        const updatedFolders = currentData.folders.map((f) => {
          if (f.id === oldFolderId) {
            return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
          }
          return f;
        });

        return {
          projects: updatedProjects,
          folders: updatedFolders,
        };
      },
      { revalidate: false }
    );

    // Show success immediately (optimistic)
    toast.success("Removed from folder");

    // Do server work in background - don't await
    (async () => {
      try {
        const { removeProjectFromFolder } = await import("@/lib/quick-folders");
        await removeProjectFromFolder(project.id);

        // Silently revalidate folder cache in background
        if (oldFolderId) {
          globalMutate(cacheKeys.folderData(oldFolderId));
        }
      } catch (error) {
        // Revert optimistic update on error
        console.error("Failed to remove from folder:", error);
        toast.error("Failed to remove from folder - reverting");
        globalMutate(projectsKey);
      }
    })();
  }, [project, userId]);

  return {
    handleProjectNameUpdate,
    handleMoveToFolder,
    handleRemoveFromFolder,
  };
}
