import { useEffect } from "react";
import type { Project } from "@/types";

/**
 * Hook to track project access and set document title
 */
export function useProjectTracking(project: Project | null | undefined) {
  // Set document title
  useEffect(() => {
    if (!project?.name) return;
    document.title = `${project.name} | Artifact`;
  }, [project?.name]);

  // Track when project is accessed (for "last opened" sorting)
  useEffect(() => {
    if (!project?.id) return;

    async function trackAccess() {
      if (!project) return;

      try {
        const { updateProject } = await import("@/lib/quick-db");
        await updateProject(project.id, {
          last_accessed_at: new Date().toISOString(),
        });
      } catch (error) {
        // Silent fail - tracking is not critical
        console.debug("Failed to track project access:", error);
      }
    }

    // Track after a short delay to ensure project loaded
    const timer = setTimeout(trackAccess, 1000);
    return () => clearTimeout(timer);
  }, [project]);
}
