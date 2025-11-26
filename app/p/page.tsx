"use client";

import useSWR from "swr";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PanelLeft, PanelLeftClose, Share } from "lucide-react";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import { usePages } from "@/hooks/usePages";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useSyncedArtifacts } from "@/hooks/useSyncedArtifacts";
import { toast } from "sonner";
import type { Project, Artifact } from "@/types";
import {
  getProjectById,
  updateArtifact as updateArtifactDB,
  reorderArtifacts as reorderArtifactsDB,
} from "@/lib/quick-db";
import { useArtifactCommands } from "@/hooks/useArtifactCommands";
import {
  ReorderArtifactsCommand,
  AddToCollectionCommand,
  RemoveFromCollectionCommand,
  UpdateArtifactCommand,
  DeleteArtifactCommand,
} from "@/lib/artifact-commands";
import { useResourcePermissions } from "@/hooks/useResourcePermissions";
import { useAuth } from "@/components/auth/AuthProvider";
import DevDebugPanel from "@/components/DevDebugPanel";
import QuickFollowProvider, {
  useFollow,
} from "@/components/QuickFollowProvider";
import { useFollowSync } from "@/hooks/useFollowSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useArtifactFocus } from "@/hooks/useArtifactFocus";
import { useProjectTracking } from "@/hooks/useProjectTracking";
import { useUserFolders } from "@/hooks/useUserFolders";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
import { useTitleCardEditor } from "@/hooks/useTitleCardEditor";
import { useMediaReplacement } from "@/hooks/useMediaReplacement";
import { usePageHandlers } from "@/hooks/usePageHandlers";
import { useFolderActions } from "@/hooks/useFolderActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import ColumnControl from "@/components/layout/header/ColumnControl";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import EditableTitle from "@/components/presentation/EditableTitle";
import SyncStatusIndicator from "@/components/presentation/SyncStatusIndicator";
import { SharePanel } from "@/components/access/SharePanel";
import ReadOnlyBadge from "@/components/sharing/ReadOnlyBanner";
import PageNavigationSidebar from "@/components/layout/PageNavigationSidebar";

const Canvas = dynamic(() => import("@/components/presentation/Canvas"), {
  ssr: false,
});

/**
 * Fetcher function for SWR - gets project by ID
 */
async function fetchProject(projectId: string): Promise<Project | null> {
  return await getProjectById(projectId);
}

// Inner component that uses useFollow - must be wrapped by QuickFollowProvider
function PresentationPageInner({
  onBroadcastReady,
  syncedArtifacts,
}: {
  onBroadcastReady?: (callback: () => void) => void;
  syncedArtifacts: ReturnType<typeof useSyncedArtifacts>;
}) {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("id") || "";
  const { user } = useAuth();
  const [columns, setColumns] = useState<number>(3);
  const [fitMode, setFitMode] = useState<boolean>(false);
  const [dragging, setDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Track expanded collections locally (not in DB)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );

  // Ref to the carousel container for follow sync
  const carouselRef = useRef<HTMLUListElement>(null);
  const [carouselReady, setCarouselReady] = useState(false);

  // Callback ref to track when carousel is mounted
  const setCarouselRef = useCallback((node: HTMLUListElement | null) => {
    carouselRef.current = node;
    setCarouselReady(!!node);
  }, []);

  // Follow functionality
  const {
    followUser,
    stopFollowing,
    isFollowing,
    followedUser,
    followManager,
    isInitialized: followInitialized,
  } = useFollow();

  // Artifact focus mode
  const { focusedArtifactId, focusArtifact, unfocusArtifact } =
    useArtifactFocus(columns, setColumns, setFitMode);

  // Debug mode: Override read-only state for testing
  const [debugReadOnly, setDebugReadOnly] = useState(false);

  // Presentation mode: Hide header and sidebar
  const [presentationMode, setPresentationMode] = useState(false);

  // Sidebar state (extracted from old AppLayout)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load user's folders for folder dropdown
  const userFolders = useUserFolders(user?.email);

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sidebar_open");
    if (stored !== null) {
      setSidebarOpen(JSON.parse(stored));
    }
  }, []);

  // Persist sidebar state
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("sidebar_open", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Load column and fit mode preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedColumns = window.localStorage.getItem("columns_in_view");
    if (storedColumns) {
      const next = Math.min(8, Math.max(1, Number(storedColumns)));
      setColumns(next);
    }

    const storedFitMode = window.localStorage.getItem("fit_mode");
    if (storedFitMode === "true") {
      setFitMode(true);
    }

    setHydrated(true);
  }, []);

  // Save column preference
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("columns_in_view", String(columns));
  }, [columns, hydrated]);

  // Save fit mode preference
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("fit_mode", String(fitMode));
  }, [fitMode, hydrated]);

  // Handle follow user click
  const handleFollowUser = useCallback(
    async (socketId: string) => {
      if (isFollowing && followedUser?.socketId === socketId) {
        stopFollowing();
        // Re-enable scroll snapping when stopping follow
        const carouselContainer = document.querySelector(
          ".carousel-horizontal"
        ) as HTMLElement;
        if (carouselContainer) {
          carouselContainer.style.scrollSnapType = "";
        }
      } else {
        await followUser(socketId);
      }
    },
    [isFollowing, followedUser, followUser, stopFollowing]
  );

  // Auto-disable fit mode when columns > 1
  useEffect(() => {
    if (columns > 1 && fitMode) {
      setFitMode(false);
    }
  }, [columns, fitMode]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: unfocusArtifact,
    canEscape: columns === 1 && fitMode,
    onTogglePresentationMode: () => setPresentationMode((prev) => !prev),
  });

  // Fetch project data
  const { data: project } = useSWR<Project | null>(
    projectId ? `project-${projectId}` : null,
    () => (projectId ? fetchProject(projectId) : null),
    { revalidateOnFocus: false }
  );

  // Check permissions
  const permissions = useResourcePermissions(project?.id || null, "project");

  // Allow debug override of read-only mode
  const isReadOnly = debugReadOnly || permissions.isReadOnly;
  const canEdit = !debugReadOnly && permissions.canEdit;
  const isOwner = permissions.isOwner;
  const accessLevel = permissions.accessLevel;
  const isCollaborator = accessLevel === "editor";

  // Fetch and manage pages
  const { pages, createPage, updatePage, deletePage, reorderPages } = usePages(
    project?.id
  );
  const { currentPageId, selectPage } = useCurrentPage(pages, project?.id);

  // Disable browser scroll restoration to prevent carousel scroll memory
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // Reset carousel scroll position when page changes
  useEffect(() => {
    if (carouselRef.current && currentPageId) {
      // Reset to beginning
      carouselRef.current.scrollLeft = 0;
      carouselRef.current.scrollTop = 0;
    }
  }, [currentPageId]);

  // Use follow sync hook to handle all follow broadcast/receive logic (including page changes)
  const {
    broadcastCurrentState,
    handleSetColumns,
    handleSetFitMode,
    handleSelectPage,
  } = useFollowSync({
    followManager,
    isFollowing,
    followInitialized,
    columns,
    fitMode,
    setColumns,
    setFitMode,
    carouselRef,
    carouselReady,
    currentPageId,
    selectPage,
    stopFollowing,
  });

  // Pass broadcast function to parent
  useEffect(() => {
    if (broadcastCurrentState && onBroadcastReady) {
      onBroadcastReady(broadcastCurrentState);
    }
  }, [broadcastCurrentState, onBroadcastReady]);

  // Use artifacts from prop (already fetched in parent)
  const {
    artifacts,
    createArtifact,
    reorderArtifacts,
    updateArtifact,
    deleteArtifact,
    replaceMedia: replaceMediaSync,
    refetch: refetchArtifacts,
    isPresenceReady,
    getUsersCount,
    getUsers,
    onCommandExecutionStart,
    onCommandExecutionEnd,
  } = syncedArtifacts;

  // Command executor for artifact operations (handles optimistic updates + DB writes)
  const { executeCommand } = useArtifactCommands({
    artifacts,
    mutate: refetchArtifacts,
    onError: (error, commandName) => {
      console.error(`[${commandName}] Failed:`, error);
      toast.error(
        `Failed to ${commandName.replace("Command", "").toLowerCase()}. Please try again.`
      );
    },
    onExecutionStart: onCommandExecutionStart,
    onExecutionEnd: onCommandExecutionEnd,
  });

  // Track project access and set document title
  useProjectTracking(project);

  // Artifact upload handlers
  const { uploadState, handleFileUpload, handleUrlAdd, isPending } =
    useArtifactUpload({
      projectId: project?.id,
      currentPageId: currentPageId || undefined,
      createArtifact,
      refetchArtifacts,
    });

  // Page management handlers
  const { handlePageCreate, handlePageDelete, handlePageRename } =
    usePageHandlers(pages, createPage, updatePage, deletePage, selectPage);

  // Folder actions
  const {
    handleProjectNameUpdate,
    handleMoveToFolder,
    handleRemoveFromFolder,
  } = useFolderActions(project, userFolders);

  // Title card editor
  const {
    editingTitleCard,
    setEditingTitleCard,
    titleCardError,
    setTitleCardError,
    handleEditTitleCard,
    handleTitleCardSubmit,
  } = useTitleCardEditor(artifacts, updateArtifact);

  // Media replacement
  const { handleReplaceMedia } = useMediaReplacement(
    project?.id,
    currentPageId || undefined,
    artifacts,
    replaceMediaSync
  );

  // Smart back URL: Go to folder if project is in a folder, otherwise /projects
  const backUrl = project?.folder_id
    ? `/folder/?id=${project.folder_id}`
    : "/projects/";

  const isUploading = uploadState.uploading || isPending;
  const isPageLoading = !project || pages.length === 0;

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Show loading state - but we still need to render header even when loading
  // Set header content - must be called before any return statements
  useSetHeader(
    {
      left: !presentationMode ? (
        <>
          <Link href={backUrl}>
            <Button variant="outline" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </>
      ) : undefined,
      center: (
        <>
          <ColumnControl
            columns={columns}
            onColumnsChange={handleSetColumns}
            fitMode={fitMode}
            onFitModeChange={handleSetFitMode}
          />
          {project?.id && currentPageId && canEdit && (
            <ArtifactAdder
              projectId={project.id}
              pageId={currentPageId}
              onAdded={refetchArtifacts}
              createArtifact={createArtifact}
            />
          )}
        </>
      ),
      right: !presentationMode ? (
        <>
          {isReadOnly && !isCollaborator && <ReadOnlyBadge />}
          <SyncStatusIndicator
            isPresenceReady={isPresenceReady}
            getUsers={getUsers}
            onFollowUser={handleFollowUser}
            followingUserId={followedUser?.socketId || null}
          />
          {project && user && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
          )}

          <DarkModeToggle />
        </>
      ) : undefined,
    },
    // Add dependencies that affect header content
    [
      presentationMode,
      sidebarOpen,
      project,
      canEdit,
      isReadOnly,
      isCollaborator,
      isPresenceReady,
      followedUser,
      user,
      currentPageId,
    ]
  );

  if (isPageLoading) {
    return null; // AnimatePresence will handle the fade
  }

  return (
    <>
      <div className="flex flex-1 h-[calc(100vh-var(--header-height))] relative">
        {/* Mobile backdrop overlay */}
        {sidebarOpen && !presentationMode && (
          <div
            className="fixed inset-0 bg-black/50 z-[5] lg:hidden animate-in fade-in duration-300"
            style={{
              animationTimingFunction: "var(--spring-elegant-easing-light)",
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Hidden in presentation mode */}
        {!presentationMode && (
          <div
            className={`absolute top-0 left-0 h-full z-10 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{
              transition: "translate 400ms var(--spring-elegant-easing-light)",
            }}
          >
            <PageNavigationSidebar
              isOpen={true}
              pages={pages || []}
              currentPageId={currentPageId || undefined}
              onPageSelect={handleSelectPage}
              onPageRename={handlePageRename}
              onPageCreate={canEdit ? handlePageCreate : undefined}
              onPageDelete={canEdit ? handlePageDelete : undefined}
              onPageReorder={canEdit ? reorderPages : undefined}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {/* Main Content */}
        <div
          className="flex-1 min-w-0"
          style={{
            marginLeft:
              sidebarOpen && !presentationMode ? "var(--sidebar-width)" : "0",
            transition: "margin-left 400ms var(--spring-elegant-easing-light)",
          }}
        >
          <div className="h-full relative">
            {/* Dropzone for file uploads (only for creators/editors) */}
            {project?.id && currentPageId && canEdit && (
              <DropzoneUploader
                onFiles={handleFileUpload}
                onUrl={handleUrlAdd}
                onDragStateChange={setDragging}
              />
            )}

            {/* Loading/upload overlay */}
            {(dragging || isUploading) && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div
                  className="px-[var(--spacing-xl)] py-[var(--spacing-lg)] rounded-2xl bg-white/95 text-black shadow-xl"
                  style={{ fontSize: "var(--font-size-sm)" }}
                >
                  {dragging ? (
                    <div className="text-center">
                      <div className="font-medium">Drop to upload</div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 min-w-[200px]">
                      <div className="font-medium">
                        Uploading
                        {uploadState.totalFiles > 1
                          ? ` ${uploadState.completedFiles + 1} of ${uploadState.totalFiles}`
                          : ""}
                        ...
                      </div>
                      {uploadState.uploading && (
                        <div className="space-y-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                              style={{
                                width: `${uploadState.currentProgress}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {uploadState.currentProgress}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canvas */}
            <div className="h-full pt-[var(--spacing-md)]">
              <Canvas
                ref={setCarouselRef}
                columns={columns}
                fitMode={fitMode}
                artifacts={artifacts}
                expandedCollections={expandedCollections}
                pageId={currentPageId || undefined}
                onReorder={async (reorderedArtifacts) => {
                  const command = new ReorderArtifactsCommand(
                    reorderedArtifacts,
                    artifacts
                  );
                  await executeCommand(command, "ReorderCommand");
                }}
                onCreateCollection={async (draggedId, targetId) => {
                  const command = new AddToCollectionCommand(
                    draggedId,
                    targetId,
                    artifacts
                  );
                  await executeCommand(command, "AddToCollectionCommand");
                }}
                onRemoveFromCollection={async (artifactId, newPosition) => {
                  const command = new RemoveFromCollectionCommand(
                    artifactId,
                    newPosition,
                    artifacts
                  );
                  await executeCommand(command, "RemoveFromCollectionCommand");
                }}
                onToggleCollection={async (collectionId) => {
                  // Toggle collection expanded state locally (no DB write)
                  setExpandedCollections((prev) => {
                    const next = new Set(prev);
                    if (next.has(collectionId)) {
                      next.delete(collectionId);
                    } else {
                      next.add(collectionId);
                    }
                    return next;
                  });
                }}
                onUpdateArtifact={async (artifactId, updates) => {
                  const command = new UpdateArtifactCommand(
                    artifactId,
                    updates,
                    artifacts
                  );
                  await executeCommand(command, "UpdateArtifactCommand");
                }}
                onDeleteArtifact={async (artifactId) => {
                  if (!user?.email) return;
                  const command = new DeleteArtifactCommand(
                    artifactId,
                    user.email,
                    artifacts
                  );
                  await executeCommand(command, "DeleteArtifactCommand");
                }}
                onReplaceMedia={canEdit ? handleReplaceMedia : undefined}
                onEditTitleCard={canEdit ? handleEditTitleCard : undefined}
                onFocusArtifact={(artifactId) => {
                  // If already in focused mode (columns=1, fitMode=true), restore
                  if (columns === 1 && fitMode) {
                    unfocusArtifact();
                    return;
                  }

                  focusArtifact(artifactId);

                  // Immediately scroll after synchronous render
                  requestAnimationFrame(() => {
                    const element = document.querySelector(
                      `[data-id="${artifactId}"]`
                    );
                    if (element) {
                      element.scrollIntoView({
                        behavior: "instant",
                        block: "nearest",
                        inline: "start",
                      });
                    }
                  });
                }}
                focusedArtifactId={focusedArtifactId}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share Panel */}
      {project && user && (
        <SharePanel
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          resourceId={project.id}
          resourceType="project"
          resourceName={project.name || "Untitled Project"}
          currentUserEmail={user.email}
        />
      )}

      {/* Title Card Edit Dialog */}
      <Dialog
        open={editingTitleCard !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingTitleCard(null);
            setTitleCardError("");
          }
        }}
      >
        <DialogContent
          className="w-full max-w-2xl text-white border-white/10"
          style={{ backgroundColor: "var(--color-background-secondary)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Edit Title Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Headline</label>
              <Input
                value={editingTitleCard?.headline || ""}
                onChange={(e) =>
                  setEditingTitleCard((prev) =>
                    prev ? { ...prev, headline: e.target.value } : null
                  )
                }
                placeholder="Enter headline"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Subheadline</label>
              <Input
                value={editingTitleCard?.subheadline || ""}
                onChange={(e) =>
                  setEditingTitleCard((prev) =>
                    prev ? { ...prev, subheadline: e.target.value } : null
                  )
                }
                placeholder="Enter subheadline"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            {titleCardError && (
              <div className="text-sm text-destructive">{titleCardError}</div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingTitleCard(null);
                setTitleCardError("");
              }}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTitleCardSubmit}
              disabled={
                !editingTitleCard?.headline && !editingTitleCard?.subheadline
              }
              className="bg-white text-black hover:bg-white/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dev Debug Panel - Press '/' to toggle */}
      <DevDebugPanel
        isReadOnly={debugReadOnly}
        onToggleReadOnly={setDebugReadOnly}
        projectInfo={
          project
            ? {
                id: project.id,
                name: project.name,
                creator_id: project.creator_id,
              }
            : undefined
        }
        userEmail={user?.email}
      />
    </>
  );
}

// Simple wrapper - PresentationPageInner gets the room and wraps itself with provider
function PresentationPageContent() {
  return <PresentationPageInnerWithProvider />;
}

// Component that gets room and provides QuickFollowProvider
function PresentationPageInnerWithProvider() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("id") || "";
  const [broadcastCallback, setBroadcastCallback] = useState<
    (() => void) | null
  >(null);

  const wrappedSetBroadcastCallback = useCallback(
    (callback: (() => void) | null) => {
      // Wrap the callback to prevent React from treating it as a functional updater
      setBroadcastCallback(() => callback);
    },
    []
  );

  // Fetch project
  const { data: project } = useSWR<Project | null>(
    projectId ? `project-${projectId}` : null,
    () => (projectId ? fetchProject(projectId) : null),
    { revalidateOnFocus: false }
  );

  const { pages } = usePages(project?.id);
  const { currentPageId } = useCurrentPage(pages, project?.id);

  // Single call to useSyncedArtifacts - get everything needed
  const syncedArtifacts = useSyncedArtifacts(
    project?.id,
    currentPageId || undefined
  );

  const room = syncedArtifacts.getRoom();

  // Wait for room to be ready before wrapping with provider
  if (!room || !syncedArtifacts.isPresenceReady) {
    return null; // Loading state
  }

  return (
    <QuickFollowProvider
      room={room}
      key={project?.id || "no-project"}
      onBroadcastInitialState={broadcastCallback || undefined}
    >
      <PresentationPageInner
        onBroadcastReady={wrappedSetBroadcastCallback}
        syncedArtifacts={syncedArtifacts}
      />
    </QuickFollowProvider>
  );
}

function PresentationPageWithProvider() {
  return <PresentationPageContent />;
}

export default function PresentationPage() {
  return (
    <Suspense fallback={null}>
      <PresentationPageWithProvider />
    </Suspense>
  );
}
