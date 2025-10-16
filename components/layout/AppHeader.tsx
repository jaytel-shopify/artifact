"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PanelLeft,
  PanelLeftClose,
  Share,
  LogOut,
  Plus,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import EditableTitle from "@/components/presentation/EditableTitle";
import ShareDialog from "@/components/sharing/ShareDialog";
import ReadOnlyBadge from "@/components/sharing/ReadOnlyBanner";
import CollaboratorBadge from "@/components/sharing/CollaboratorBadge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/AuthProvider";
import UserAvatar from "@/components/auth/UserAvatar";
import { useRouter } from "next/navigation";
import SyncStatusIndicator from "@/components/presentation/SyncStatusIndicator";

interface AppHeaderProps {
  // Navigation props
  backUrl?: string;
  onBackToHome?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;

  // Project-specific props (for canvas view)
  projectId?: string;
  projectName?: string;
  shareToken?: string;
  creatorEmail?: string;
  isCreator?: boolean;
  isCollaborator?: boolean;
  isReadOnly?: boolean;
  currentFolderId?: string | null;
  folders?: any[];
  onProjectNameUpdate?: (name: string) => void;
  onMoveToFolder?: (folderId: string) => void;
  onRemoveFromFolder?: () => void;
  onArtifactAdded?: () => void;
  currentPageId?: string;

  // Column controls
  columns?: number;
  onColumnsChange?: (columns: number) => void;
  showColumnControls?: boolean;
  fitMode?: boolean;
  onFitModeChange?: (fit: boolean) => void;

  // Folder-specific props (for folder mode)
  folderId?: string;
  folderName?: string;
  onFolderNameUpdate?: (name: string) => void;
  onFolderShare?: () => void;
  onFolderRename?: () => void;
  onFolderDelete?: () => void;

  // Homepage/Folder props
  onNewProject?: () => void;

  // View mode
  mode: "homepage" | "canvas" | "folder";

  // Sync status (for canvas mode)
  isSyncReady?: boolean;
  getUsersCount?: () => number;
  getUsers?: () => any[];
}

export default function AppHeader({
  backUrl,
  onBackToHome,
  onToggleSidebar,
  sidebarOpen,
  projectId,
  projectName,
  shareToken,
  creatorEmail,
  isCreator = false,
  isCollaborator = false,
  isReadOnly = false,
  currentFolderId,
  folders = [],
  onProjectNameUpdate,
  onMoveToFolder,
  onRemoveFromFolder,
  onArtifactAdded,
  folderId,
  folderName,
  onFolderNameUpdate,
  onFolderShare,
  onFolderRename,
  onFolderDelete,
  onNewProject,
  currentPageId,
  columns = 3,
  onColumnsChange,
  showColumnControls = true,
  fitMode = false,
  onFitModeChange,
  mode,
  isSyncReady = false,
  getUsersCount,
  getUsers,
}: AppHeaderProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { user, signIn, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <header
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3 w-full max-w-[var(--section-width)]">
          {mode === "homepage" ? (
            <div className="flex items-center gap-2">
              <img
                src="/favicons/icon-256.png"
                alt="Artifact"
                className="w-8 h-8"
                style={{ imageRendering: "crisp-edges" }}
              />
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Artifact
              </h1>
            </div>
          ) : (
            /* Canvas/Folder mode: Navigation + Tools */
            <>
              {/* Back Button */}
              {backUrl ? (
                <Link href={backUrl}>
                  <Button variant="outline" size="icon" aria-label="Back">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onBackToHome}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              {/* Sidebar Toggle (only for canvas mode) */}
              {onToggleSidebar && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleSidebar}
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeft className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Add Artifact Button (hidden in read-only mode) */}
              {projectId && currentPageId && onArtifactAdded && (
                <ArtifactAdder
                  projectId={projectId}
                  pageId={currentPageId}
                  onAdded={onArtifactAdded}
                />
              )}
            </>
          )}
        </div>

        {/* Center Section - Title */}
        {mode === "canvas" && projectId && (
          <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
            <EditableTitle
              initialValue={projectName || "Untitled Project"}
              projectId={projectId}
              onUpdated={onProjectNameUpdate}
              isReadOnly={!onProjectNameUpdate}
              folders={folders}
              currentFolderId={currentFolderId}
              onMoveToFolder={onMoveToFolder}
              onRemoveFromFolder={onRemoveFromFolder}
            />
          </div>
        )}

        {mode === "folder" && folderId && (
          <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
            <EditableTitle
              initialValue={folderName || "Untitled Folder"}
              projectId={folderId}
              onUpdated={onFolderNameUpdate}
              isReadOnly={!onFolderNameUpdate}
              isFolder={true}
            />
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center justify-end gap-3 w-full max-w-[var(--section-width)]">
          {mode === "folder" ? (
            <div className="flex items-center gap-3">
              {/* Share Folder Button */}
              {onFolderShare && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={onFolderShare}
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              )}

              {/* New Project Button */}
              {onNewProject && (
                <Button className="gap-2" onClick={onNewProject}>
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}

              {/* Folder Actions Menu */}
              {(onFolderRename || onFolderDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onFolderRename && (
                      <DropdownMenuItem onClick={onFolderRename}>
                        Rename Folder
                      </DropdownMenuItem>
                    )}
                    {onFolderDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={onFolderDelete}
                      >
                        Delete Folder
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Avatar */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <UserAvatar />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled
                      className="flex flex-col items-start"
                    >
                      <span className="text-sm font-medium">
                        {user.fullName ?? "Signed in"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="gap-2"
                >
                  Sign in
                </Button>
              )}
            </div>
          ) : mode === "canvas" ? (
            <div className="flex items-center gap-3">
              {/* Collaborator Badge (shown for invited editors) */}
              {isCollaborator && creatorEmail && (
                <CollaboratorBadge creatorEmail={creatorEmail} />
              )}

              {/* Read-Only Badge (shown for viewers) */}
              {isReadOnly && !isCollaborator && <ReadOnlyBadge />}

              {/* Sync Status Indicator */}
              {getUsers && (
                <SyncStatusIndicator
                  isSyncReady={isSyncReady}
                  getUsers={getUsers}
                />
              )}

              {/* Column Count Slider */}
              {showColumnControls && onColumnsChange && (
                <div className="flex items-center gap-3">
                  {/* Fit toggle (only when columns === 1) */}
                  {columns === 1 && onFitModeChange && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        Fit
                      </span>
                      <Switch
                        checked={fitMode}
                        onCheckedChange={onFitModeChange}
                      />
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground font-medium min-w-[12px]">
                    {columns}
                  </span>
                  <div className="w-[120px]">
                    <Slider
                      min={1}
                      max={8}
                      value={[columns]}
                      onValueChange={(value: number[]) =>
                        onColumnsChange(value[0] ?? columns)
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Share Button */}
              {shareToken && projectId && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>

                  {/* Share Dialog */}
                  <ShareDialog
                    projectId={projectId}
                    projectName={projectName || "Untitled Project"}
                    shareToken={shareToken}
                    creatorEmail={creatorEmail || ""}
                    isCreator={isCreator}
                    isOpen={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                  />
                </>
              )}

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <UserAvatar />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled
                      className="flex flex-col items-start"
                    >
                      <span className="text-sm font-medium">
                        {user.fullName ?? "Signed in"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="gap-2"
                >
                  Sign in
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {onNewProject && (
                <Button onClick={onNewProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <UserAvatar />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled
                      className="flex flex-col items-start"
                    >
                      <span className="text-sm font-medium">
                        {user.fullName ?? "Signed in"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="gap-2"
                >
                  Sign in
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
