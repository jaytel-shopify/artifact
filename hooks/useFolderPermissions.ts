"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Folder } from "@/types";
import { getFolderAccessList } from "@/lib/quick-folders";

/**
 * Hook to determine user permissions for a folder
 * 
 * Returns:
 * - isOwner: True if user is the folder creator
 * - canEdit: True if user can edit (owner or has editor access)
 * - canView: True if user can view (always true for Shopify employees)
 * - isReadOnly: True if user cannot edit
 * - isCollaborator: True if user has editor access (but is not owner)
 */
export function useFolderPermissions(folder: Folder | null) {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load folder access list
  useEffect(() => {
    async function checkAccess() {
      if (!folder?.id) {
        setLoading(false);
        return;
      }

      try {
        const access = await getFolderAccessList(folder.id);
        setAccessList(access);
      } catch (error) {
        console.error("Failed to load folder access:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [folder?.id]);

  const isOwner = useMemo(() => {
    if (!folder || !user) return false;
    return folder.creator_id === user.email;
  }, [folder, user]);

  const isCollaborator = useMemo(() => {
    if (!user || isOwner || loading) return false;

    // Check if user has editor access in folder_access table
    return accessList.some(
      (access) => access.user_email === user.email && access.role === "editor"
    );
  }, [accessList, user, isOwner, loading]);

  const canEdit = isOwner || isCollaborator;
  const canView = true; // Everyone at Shopify can view

  return {
    isOwner,
    canEdit,
    canView,
    isReadOnly: !canEdit,
    isCollaborator,
    loading,
  };
}

