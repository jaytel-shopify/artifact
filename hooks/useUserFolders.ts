import { useState, useEffect } from "react";
import type { Folder } from "@/types";

/**
 * Hook to load user's accessible folders using the new access control system
 */
export function useUserFolders(userEmail: string | undefined) {
  const [userFolders, setUserFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!userEmail) return;

    async function loadFolders() {
      if (!userEmail) return;

      try {
        // Get folders the user has access to via the new access control system
        const { getUserAccessibleResources } = await import("@/lib/access-control");
        const { getFolderById } = await import("@/lib/quick-folders");
        
        const folderAccessEntries = await getUserAccessibleResources(userEmail, "folder");
        
        // Fetch full folder details for each access entry
        const folders = await Promise.all(
          folderAccessEntries.map((access) => getFolderById(access.resource_id))
        );
        
        // Filter out any null folders (in case a folder was deleted but access entry remains)
        const validFolders = folders.filter((f): f is Folder => f !== null);
        
        setUserFolders(validFolders);
      } catch (error) {
        console.error("Failed to load folders:", error);
      }
    }

    loadFolders();
  }, [userEmail]);

  return userFolders;
}
