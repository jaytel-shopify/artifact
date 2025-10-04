"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Project } from "@/types";
import { getProjectAccessList } from "@/lib/quick-db";

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
  const [loading, setLoading] = useState(true);

  // Load project access list
  useEffect(() => {
    async function checkAccess() {
      if (!project?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const access = await getProjectAccessList(project.id);
        setAccessList(access);
      } catch (error) {
        console.error("Failed to load project access:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [project?.id]);

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

  const canEdit = isCreator || isCollaborator;
  const canView = true; // Everyone at Shopify can view

  return {
    isCreator,
    canEdit,
    canView,
    isReadOnly: !canEdit,
    isCollaborator,
    loading,
  };
}

