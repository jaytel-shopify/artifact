"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Project } from "@/types";
import { getProjectAccessList } from "@/lib/quick-db";
import { getFolderAccessList } from "@/lib/quick-folders";

/**
 * Hook to determine user permissions for a project
 * 
 * Returns:
 * - isCreator: True if user is the project creator
 * - canEdit: True if user can edit (creator or has editor access)
 * - canView: True if user can view (always true for Shopify employees)
 * - isReadOnly: True if user cannot edit
 * - isCollaborator: True if user has editor access (but is not creator)
 */
export function useProjectPermissions(project: Project | null) {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<any[]>([]);
  const [folderAccessList, setFolderAccessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load project and folder access lists
  useEffect(() => {
    async function checkAccess() {
      if (!project?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Get project access
        const projectAccess = await getProjectAccessList(project.id);
        setAccessList(projectAccess);

        // Get folder access if project is in a folder
        if (project.folder_id) {
          const folderAccess = await getFolderAccessList(project.folder_id);
          setFolderAccessList(folderAccess);
        }
      } catch (error) {
        console.error("Failed to load project access:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [project?.id, project?.folder_id]);

  const isCreator = useMemo(() => {
    if (!project || !user) return false;
    return project.creator_id === user.email;
  }, [project, user]);

  const isCollaborator = useMemo(() => {
    if (!user || isCreator || loading) return false;
    
    // Check if user has editor access in project_access table
    return accessList.some(
      (access) => access.user_email === user.email && access.role === "editor"
    );
  }, [accessList, user, isCreator, loading]);

  const isFolderCollaborator = useMemo(() => {
    if (!user || isCreator || loading || !project?.folder_id) return false;
    
    // Check if user has editor access to the parent folder
    return folderAccessList.some(
      (access) => access.user_email === user.email && access.role === "editor"
    );
  }, [folderAccessList, user, isCreator, loading, project?.folder_id]);

  const canEdit = isCreator || isCollaborator || isFolderCollaborator;
  const canView = true; // Everyone at Shopify can view

  return {
    isCreator,
    canEdit,
    canView,
    isReadOnly: !canEdit,
    isCollaborator: isCollaborator || isFolderCollaborator,
    isFolderCollaborator,
    loading,
  };
}

