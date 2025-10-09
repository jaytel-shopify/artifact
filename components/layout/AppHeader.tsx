"use client";

import { useState } from "react";
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
import { useAppShell } from "./AppShellProvider";

export default function AppHeader() {
  const { user, signIn, signOut, loading } = useAuth();
  const router = useRouter();
  const { config, sidebarOpen, setSidebarOpen } = useAppShell();
  const mode = config.mode ?? "homepage";
  const navigation = config.navigation;
  const project = config.project;
  const columnControls = config.columnControls;
  const folder = config.folder;
  const pageSidebar = config.pageSidebar;
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const columns = columnControls?.columns ?? 3;

  return (
    <header
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center justify-between h-full px-8">
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
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={navigation?.onBackToHome}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {pageSidebar && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeft className="h-4 w-4" />
                  )}
                </Button>
              )}

              {project?.id &&
                pageSidebar?.currentPageId &&
                project.onArtifactAdded && (
                  <ArtifactAdder
                    projectId={project.id}
                    pageId={pageSidebar.currentPageId}
                    onAdded={project.onArtifactAdded}
                  />
                )}

              {columnControls?.showColumnControls &&
                columnControls.onColumnsChange && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium min-w-[12px]">
                      {columns}
                    </span>
                    <div className="w-24">
                      <Slider
                        min={1}
                        max={8}
                        value={[columns]}
                        onValueChange={(value: number[]) =>
                          columnControls.onColumnsChange?.(value[0] ?? columns)
                        }
                        className="w-full"
                      />
                    </div>
                    {columns === 1 && columnControls.onFitModeChange && (
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Fit
                        </span>
                        <Switch
                          checked={columnControls.fitMode}
                          onCheckedChange={columnControls.onFitModeChange}
                        />
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>

        {mode === "canvas" && project?.id && (
          <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
            <EditableTitle
              initialValue={project.name || "Untitled Project"}
              projectId={project.id}
              onUpdated={project.onProjectNameUpdate}
              isReadOnly={!project.onProjectNameUpdate}
              folders={project.folders}
              currentFolderId={project.currentFolderId}
              onMoveToFolder={project.onMoveToFolder}
              onRemoveFromFolder={project.onRemoveFromFolder}
            />
          </div>
        )}

        {mode === "folder" && folder?.id && (
          <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
            <EditableTitle
              initialValue={folder.name || "Untitled Folder"}
              projectId={folder.id}
              onUpdated={folder.onFolderNameUpdate}
              isReadOnly={!folder.onFolderNameUpdate}
              isFolder
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 w-full max-w-[var(--section-width)]">
          {mode === "folder" ? (
            <div className="flex items-center gap-3">
              {folder?.onFolderShare && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={folder.onFolderShare}
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              )}

              {folder?.onNewProject && (
                <Button className="gap-2" onClick={folder.onNewProject}>
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}

              {(folder?.onFolderRename || folder?.onFolderDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {folder?.onFolderRename && (
                      <DropdownMenuItem onClick={folder.onFolderRename}>
                        Rename Folder
                      </DropdownMenuItem>
                    )}
                    {folder?.onFolderDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={folder.onFolderDelete}
                      >
                        Delete Folder
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {user ? (
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
              {project?.isCollaborator && project.creatorEmail && (
                <CollaboratorBadge creatorEmail={project.creatorEmail} />
              )}

              {project?.isReadOnly && !project.isCollaborator && (
                <ReadOnlyBadge />
              )}

              {project?.shareToken && project.id && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                  <ShareDialog
                    projectId={project.id}
                    projectName={project.name || "Untitled Project"}
                    shareToken={project.shareToken}
                    creatorEmail={project.creatorEmail || ""}
                    isCreator={project.isCreator ?? false}
                    isOpen={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                  />
                </>
              )}

              {user ? (
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
              {navigation?.onBackToHome && (
                <Button onClick={navigation.onBackToHome} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
              {user ? (
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
