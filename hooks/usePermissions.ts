"use client";

import { useEffect, useState } from "react";
import { useUser } from "./useUser";
import { FolderMember } from "@/types";
import { getFolderMembersByFolderId, getFolderById } from "@/lib/quick/db-new";

export function usePermissions(folderId: string | null) {
  const [folderMembers, setFolderMembers] = useState<FolderMember[]>([]);
  useEffect(() => {
    const fetchFolderMembers = async (folderId: string | null) => {
      const folder = await getFolderById(folderId);
      const folderMembers = await getFolderMembersByFolderId(
        folder?.id || null
      );
      if (folderMembers.length > 0) {
        setFolderMembers(folderMembers);
      } else if (folder?.parent_id) {
        const parentFolder = await getFolderById(folder?.parent_id || null);
        fetchFolderMembers(parentFolder?.id || null);
      } else {
        setFolderMembers([]);
      }
    };
    fetchFolderMembers(folderId);
  }, [folderId]);

  const { user } = useUser();
  const [permissions, setPermissions] = useState<FolderMember | null>(null);
  useEffect(() => {
    setPermissions(
      folderMembers.find((member) => member.user_id === user?.id) || null
    );
  }, [folderMembers, user]);

  const isOwner = permissions?.role === "owner";
  const canView = !permissions?.role || permissions?.role === "viewer";
  const canEdit =
    permissions?.role === "owner" || permissions?.role === "editor";

  return {
    isOwner,
    canEdit,
    canView,
    isReadOnly: !canEdit,
  };
}
