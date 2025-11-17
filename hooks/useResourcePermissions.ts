"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  checkUserAccess,
  type AccessLevel,
  type ResourceType,
} from "@/lib/access-control";

/**
 * Hook to determine user permissions for a resource (project or folder)
 * 
 * Returns:
 * - accessLevel: The user's access level (owner/editor/viewer/null)
 * - isOwner: True if user is the owner
 * - canEdit: True if user can edit (owner or editor)
 * - canView: True if user can view (any access level)
 * - isReadOnly: True if user cannot edit
 * - loading: True while checking access
 */
export function useResourcePermissions(
  resourceId: string | null,
  resourceType: ResourceType
) {
  const { user } = useAuth();
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [loading, setLoading] = useState(true);

  // Load access level
  useEffect(() => {
    async function checkAccess() {
      if (!resourceId || !user) {
        setLoading(false);
        return;
      }

      try {
        const level = await checkUserAccess(resourceId, resourceType, user.email);
        setAccessLevel(level);
      } catch (error) {
        console.error("Failed to check user access:", error);
        setAccessLevel(null);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [resourceId, resourceType, user]);

  const isOwner = useMemo(() => accessLevel === "owner", [accessLevel]);
  const canEdit = useMemo(
    () => accessLevel === "owner" || accessLevel === "editor",
    [accessLevel]
  );
  const canView = useMemo(() => accessLevel !== null, [accessLevel]);

  return {
    accessLevel,
    isOwner,
    canEdit,
    canView,
    isReadOnly: !canEdit,
    loading,
  };
}