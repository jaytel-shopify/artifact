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
  getAccessList,
  grantAccess,
  updateAccessLevel,
  revokeAccess,
  type AccessEntry,
  type AccessLevel,
  type ResourceType,
  type ShopifyUser,
} from "@/lib/access-control";
import { getResourceUrl } from "@/lib/urls";

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: ResourceType;
  resourceName: string;
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
  currentUserEmail,
}: SharePanelProps) {
  const [accessList, setAccessList] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentUserAccess, setCurrentUserAccess] =
    useState<AccessLevel | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] =
    useState<AccessLevel>("editor");
  const [selectedUsers, setSelectedUsers] = useState<ShopifyUser[]>([]);

  // Generate the shareable link
  const shareUrl = getResourceUrl(resourceType, resourceId);

  // Load access list
  const loadAccessList = useCallback(async () => {
    setLoading(true);
    try {
      const access = await getAccessList(resourceId, resourceType);
      setAccessList(access);

      // Find current user's access level
      const userAccess = access.find(
        (a) => a.user_email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      setCurrentUserAccess(userAccess?.access_level || null);
    } catch (error) {
      console.error("Failed to load access list:", error);
      toast.error("Failed to load access list");
    } finally {
      setLoading(false);
    }
  }, [resourceId, resourceType, currentUserEmail]);

  useEffect(() => {
    if (!isOpen) return;
    loadAccessList();
  }, [isOpen, loadAccessList]);

  // Check if current user is owner
  const isOwner = currentUserAccess === "owner";

  // Handle adding a user to the invite list
  const handleAddUser = (user: ShopifyUser | null) => {
    if (!user) return;

    // Check if already in selected list
    if (selectedUsers.find((u) => u.email === user.email)) {
      return;
    }

    // Check if user already has access
    const existing = accessList.find(
      (a) => a.user_email.toLowerCase() === user.email.toLowerCase()
    );

    if (existing) {
      toast.error(`${user.fullName} already has access`);
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
  };

  // Handle removing a user from the invite list
  const handleRemoveUser = (email: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.email !== email));
  };

  // Handle inviting all selected users
  async function handleInviteUsers() {
    if (selectedUsers.length === 0) return;

    try {
      // Get current user's name from access list
      const currentUser = accessList.find(
        (a) => a.user_email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      const currentUserName = currentUser?.user_name || currentUserEmail;

      // Invite all selected users
      const promises = selectedUsers.map((user) =>
        grantAccess(
          resourceId,
          resourceType,
          user.email,
          selectedAccessLevel,
          currentUserEmail,
          user.fullName,
          user.slackImageUrl,
          resourceName,
          user.slackId,
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
    userEmail: string,
    newLevel: AccessLevel
  ) {
    try {
      await updateAccessLevel(resourceId, resourceType, userEmail, newLevel);
      toast.success("Access level updated");
      await loadAccessList();
    } catch (error) {
      console.error("Failed to update access level:", error);
      toast.error("Failed to update access level");
    }
  }

  // Handle removing access
  async function handleRemoveAccess(userEmail: string, userName: string) {
    if (!confirm(`Remove ${userName} from this ${resourceType}?`)) {
      return;
    }

    try {
      await revokeAccess(resourceId, resourceType, userEmail);
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

  // Get excluded emails (already has access)
  const excludeEmails = accessList.map((a) => a.user_email);

  // Separate the owner from other users
  const owner = accessList.find((a) => a.access_level === "owner");
  const otherUsers = accessList.filter((a) => a.access_level !== "owner");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
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
          {/* Invite Section - Only show if user is owner */}
          {isOwner && (
            <div className="space-y-3">
              {/* Search and Access Level */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <UserSearchAutocomplete
                    onSelect={handleAddUser}
                    selectedUser={null}
                    excludeEmails={[
                      ...excludeEmails,
                      ...selectedUsers.map((u) => u.email),
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
                      key={user.email}
                      email={user.email}
                      name={user.fullName}
                      imageUrl={user.slackImageUrl}
                      onRemove={() => handleRemoveUser(user.email)}
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

              <p className="text-xs text-muted-foreground">
                Search and select people to invite. They&apos;ll receive a Slack
                notification.
              </p>
            </div>
          )}

          {/* Who has access */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-muted-foreground">
              Who has access
            </h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : accessList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No one has access yet
              </div>
            ) : (
              <div className="space-y-2">
                {/* Owner */}
                {owner && (
                  <div className="flex items-center gap-3 py-3">
                    <UserAvatar
                      email={owner.user_email}
                      name={owner.user_name || owner.user_email}
                      imageUrl={owner.user_avatar}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {owner.user_name || owner.user_email}
                        {owner.user_email.toLowerCase() ===
                          currentUserEmail.toLowerCase() && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">owner</div>
                  </div>
                )}

                {/* Other Users */}
                {otherUsers.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <UserAvatar
                      email={access.user_email}
                      name={access.user_name || access.user_email}
                      imageUrl={access.user_avatar}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {access.user_name || access.user_email}
                        {access.user_email.toLowerCase() ===
                          currentUserEmail.toLowerCase() && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </div>
                    </div>

                    {/* Access Level Dropdown - Only owner can change */}
                    {isOwner ? (
                      <Select
                        value={access.access_level}
                        onValueChange={(value) => {
                          if (value === "remove") {
                            handleRemoveAccess(
                              access.user_email,
                              access.user_name || access.user_email
                            );
                          } else {
                            handleChangeAccessLevel(
                              access.user_email,
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
                            className="text-destructive"
                          >
                            Remove access
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground">
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
