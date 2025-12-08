"use client";

import { useState, useEffect, useCallback } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserSearchAutocomplete } from "./UserSearchAutocomplete";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { UserChip } from "@/components/ui/user-chip";
import {
  getAccessListForResource,
  grantAccess,
  updateAccessLevel,
  revokeAccess,
  type AccessEntry,
  type AccessLevel,
  type ResourceType,
} from "@/lib/access-control";
import type { User } from "@/types";
import { getResourceUrl } from "@/lib/urls";

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: ResourceType;
  resourceName: string;
  currentUserId: string;
  currentUserEmail: string;
}

/**
 * SharePanel
 *
 * Unified share panel for both projects and folders.
 * Allows owner to manage access with owner/editor/viewer roles.
 */
export function SharePanel({
  isOpen,
  onClose,
  resourceId,
  resourceType,
  resourceName,
  currentUserId,
  currentUserEmail,
}: SharePanelProps) {
  const [accessList, setAccessList] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentUserAccess, setCurrentUserAccess] =
    useState<AccessLevel | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] =
    useState<AccessLevel>("editor");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Generate the shareable link
  const shareUrl = getResourceUrl(resourceType, resourceId);

  // Load access list
  const loadAccessList = useCallback(async () => {
    setLoading(true);
    try {
      const access = await getAccessListForResource(resourceId, resourceType);
      setAccessList(access);

      // Find current user's access level (by user_id)
      const userAccess = access.find((a) => a.user_id === currentUserId);
      setCurrentUserAccess(userAccess?.access_level || null);
    } catch (error) {
      console.error("Failed to load access list:", error);
      toast.error("Failed to load access list");
    } finally {
      setLoading(false);
    }
  }, [resourceId, resourceType, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    loadAccessList();
  }, [isOpen, loadAccessList]);

  // Check if current user is owner or editor (both can manage access)
  const isOwner = currentUserAccess === "owner";
  const canManageAccess =
    currentUserAccess === "owner" || currentUserAccess === "editor";

  // Handle adding a user to the invite list
  const handleAddUser = (user: User | null) => {
    if (!user) return;

    // Check if already in selected list
    if (selectedUsers.find((u) => u.id === user.id)) {
      return;
    }

    // Check if user already has access (by user_id)
    const existing = accessList.find((a) => a.user_id === user.id);

    if (existing) {
      toast.error(`${user.name} already has access`);
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
  };

  // Handle removing a user from the invite list
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Handle inviting all selected users
  async function handleInviteUsers() {
    if (selectedUsers.length === 0) return;

    try {
      // Get current user's name from access list
      const currentUser = accessList.find((a) => a.user_id === currentUserId);
      const currentUserName = currentUser?.user_name || currentUserEmail;

      // Invite all selected users (grantAccess now takes userId first)
      const promises = selectedUsers.map((user) =>
        grantAccess(
          resourceId,
          resourceType,
          user.id, // User.id (primary identifier)
          user.email, // User's email (for display)
          selectedAccessLevel,
          currentUserId, // Granted by (User.id)
          user.name,
          user.slack_image_url,
          resourceName,
          user.slack_id,
          currentUserName
        )
      );

      await Promise.all(promises);

      toast.success(
        `Invited ${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"} as ${selectedAccessLevel}`
      );
      setSelectedUsers([]); // Clear selections after invite
      await loadAccessList();
      setSelectedAccessLevel("editor"); // Reset to default
    } catch (error) {
      console.error("Failed to invite users:", error);
      toast.error("Failed to invite users");
    }
  }

  // Handle changing access level
  async function handleChangeAccessLevel(
    userId: string,
    newLevel: AccessLevel
  ) {
    try {
      await updateAccessLevel(resourceId, resourceType, userId, newLevel);
      toast.success("Access level updated");
      await loadAccessList();
    } catch (error) {
      console.error("Failed to update access level:", error);
      toast.error("Failed to update access level");
    }
  }

  // Handle removing access
  async function handleRemoveAccess(userId: string, userName: string) {
    if (!confirm(`Remove ${userName} from this ${resourceType}?`)) {
      return;
    }

    try {
      await revokeAccess(resourceId, resourceType, userId);
      toast.success(`Removed ${userName}`);
      await loadAccessList();
    } catch (error) {
      console.error("Failed to remove access:", error);
      toast.error("Failed to remove access");
    }
  }

  // Copy link to clipboard
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  // Get excluded user IDs (already has access)
  const excludeUserIds = accessList.map((a) => a.user_id);

  // Separate the owner from other users
  const owner = accessList.find((a) => a.access_level === "owner");
  const otherUsers = accessList.filter((a) => a.access_level !== "owner");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-large text-text-primary">
              Share {resourceName}
            </DialogTitle>

            {/* Copy Link Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyLink}
              className="gap-2 mr-3"
            >
              <LinkIcon className="h-4 w-4" />
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                "Copy link"
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Invite Section - Show if user can manage access (owner or editor) */}
          {canManageAccess && (
            <div className="space-y-3">
              {/* Search and Access Level */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <UserSearchAutocomplete
                    onSelect={handleAddUser}
                    selectedUser={null}
                    excludeUserIds={[
                      ...excludeUserIds,
                      ...selectedUsers.map((u) => u.id),
                    ]}
                    placeholder="Search and add people..."
                  />
                </div>

                <Select
                  value={selectedAccessLevel}
                  onValueChange={(value) =>
                    setSelectedAccessLevel(value as AccessLevel)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">editor</SelectItem>
                    <SelectItem value="viewer">viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Users Chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <UserChip
                      key={user.id}
                      email={user.email}
                      name={user.name}
                      imageUrl={user.slack_image_url}
                      onRemove={() => handleRemoveUser(user.id)}
                    />
                  ))}
                </div>
              )}

              {/* Invite Button */}
              {selectedUsers.length > 0 && (
                <Button onClick={handleInviteUsers} className="w-full">
                  Invite {selectedUsers.length}{" "}
                  {selectedUsers.length === 1 ? "person" : "people"} as{" "}
                  {selectedAccessLevel}
                </Button>
              )}
            </div>
          )}

          {/* Who has access */}
          <div className="space-y-3">
            <h3 className="text-small text-text-secondary">Who has access</h3>

            {loading ? (
              <div className="text-center py-8 text-text-secondary">
                Loading...
              </div>
            ) : accessList.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No one has access yet
              </div>
            ) : (
              <div className="space-y-3">
                {/* Owner */}
                {owner && (
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      email={owner.user_email}
                      name={owner.user_name || owner.user_email}
                      imageUrl={owner.user_avatar}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-medium truncate">
                        {owner.user_name || owner.user_email}
                        {owner.user_id === currentUserId && (
                          <span className="text-text-secondary"> (you)</span>
                        )}
                      </div>
                    </div>

                    <div className="text-small text-text-secondary">owner</div>
                  </div>
                )}

                {/* Other Users */}
                {otherUsers.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center gap-3 group"
                  >
                    <UserAvatar
                      email={access.user_email}
                      name={access.user_name || access.user_email}
                      imageUrl={access.user_avatar}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-medium truncate">
                        {access.user_name || access.user_email}
                        {access.user_id === currentUserId && (
                          <span className="text-text-secondary"> (you)</span>
                        )}
                      </div>
                    </div>

                    {/* Access Level Dropdown - Owner or editor can change */}
                    {canManageAccess ? (
                      <Select
                        value={access.access_level}
                        onValueChange={(value) => {
                          if (value === "remove") {
                            handleRemoveAccess(
                              access.user_id,
                              access.user_name || access.user_email
                            );
                          } else {
                            handleChangeAccessLevel(
                              access.user_id,
                              value as AccessLevel
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">editor</SelectItem>
                          <SelectItem value="viewer">viewer</SelectItem>
                          <SelectItem
                            value="remove"
                            className="text-small"
                            style={{ color: "var(--c-destructive)" }}
                          >
                            Remove access
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-small text-text-secondary">
                        {access.access_level}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
