import { useState, useEffect } from "react";
import type { Folder } from "@/types";

/**
 * Hook to load user's folders
 */
export function useUserFolders(userEmail: string | undefined) {
  const [userFolders, setUserFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!userEmail) return;

    async function loadFolders() {
      if (!userEmail) return;

      try {
        const { getUserFolders } = await import("@/lib/quick-folders");
        const folders = await getUserFolders(userEmail);
        setUserFolders(folders);
      } catch (error) {
        console.error("Failed to load folders:", error);
      }
    }

    loadFolders();
  }, [userEmail]);

  return userFolders;
}
