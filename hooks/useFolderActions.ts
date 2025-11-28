import { useCallback } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { cacheKeys } from "@/lib/cache-keys";
import type { Project } from "@/types";

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
  userEmail?: string
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
      try {
        const { moveProjectToFolder } = await import("@/lib/quick-folders");
        await moveProjectToFolder(project.id, folderId);
        const folder = userFolders.find((f) => f.id === folderId);
        toast.success(`Moved to ${folder?.name || "folder"}`);
        // Update local project state
        project.folder_id = folderId;
        // Invalidate caches
        await globalMutate(cacheKeys.projectsData(userEmail));
        if (oldFolderId) {
          await globalMutate(cacheKeys.folderData(oldFolderId));
        }
        await globalMutate(cacheKeys.folderData(folderId));
      } catch (error) {
        toast.error("Failed to move project");
        console.error(error);
      }
    },
    [project, userFolders, userEmail]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!project) return;

    const oldFolderId = project.folder_id;
    try {
      const { removeProjectFromFolder } = await import("@/lib/quick-folders");
      await removeProjectFromFolder(project.id);
      toast.success("Removed from folder");
      // Update local project state
      project.folder_id = null;
      // Invalidate caches
      await globalMutate(cacheKeys.projectsData(userEmail));
      if (oldFolderId) {
        await globalMutate(cacheKeys.folderData(oldFolderId));
      }
    } catch (error) {
      toast.error("Failed to remove from folder");
      console.error(error);
    }
  }, [project, userEmail]);

  return {
    handleProjectNameUpdate,
    handleMoveToFolder,
    handleRemoveFromFolder,
  };
}

