"use client";

import useSWR from "swr";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import AppLayout from "@/components/layout/AppLayout";
import { usePages } from "@/hooks/usePages";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useSyncedArtifacts } from "@/hooks/useSyncedArtifacts";
import { toast } from "sonner";
import type { Project, Artifact } from "@/types";
import { getProjectById } from "@/lib/quick-db";
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
}: {
  onBroadcastReady?: (callback: () => void) => void;
}) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "";
  const { user } = useAuth();
  const [columns, setColumns] = useState<number>(3);
  const [fitMode, setFitMode] = useState<boolean>(false);
  const [dragging, setDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  // Load user's folders for folder dropdown
  const userFolders = useUserFolders(user?.email);

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

  // Fetch page-specific artifacts with real-time sync
  const {
    artifacts,
    createArtifact,
    reorderArtifacts,
    updateArtifact,
    deleteArtifact,
    replaceMedia: replaceMediaSync,
    refetch: refetchArtifacts,
    isSyncReady,
    getUsersCount,
    getUsers,
  } = useSyncedArtifacts(project?.id, currentPageId || undefined);

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

  // Show loading state
  if (isPageLoading) {
    return null; // AnimatePresence will handle the fade
  }

  return (
      <AppLayout
        mode="canvas"
        projectId={project.id}
        projectName={project.name}
        creatorEmail={project.creator_id}
      isCreator={isOwner}
      isCollaborator={accessLevel === "editor" || accessLevel === "viewer"}
      isReadOnly={isReadOnly}
      currentFolderId={project.folder_id}
      folders={userFolders}
      onProjectNameUpdate={canEdit ? handleProjectNameUpdate : undefined}
      onMoveToFolder={canEdit ? handleMoveToFolder : undefined}
      onRemoveFromFolder={canEdit ? handleRemoveFromFolder : undefined}
      onArtifactAdded={canEdit ? refetchArtifacts : undefined}
      columns={columns}
      onColumnsChange={handleSetColumns}
      showColumnControls={true}
      fitMode={fitMode}
      onFitModeChange={handleSetFitMode}
      pages={pages}
      currentPageId={currentPageId || undefined}
      onPageSelect={handleSelectPage}
      onPageRename={handlePageRename}
      onPageCreate={canEdit ? handlePageCreate : undefined}
      onPageDelete={canEdit ? handlePageDelete : undefined}
      onPageReorder={canEdit ? reorderPages : undefined}
      presentationMode={presentationMode}
      backUrl={backUrl}
      isSyncReady={isSyncReady}
      getUsersCount={getUsersCount}
      getUsers={getUsers}
      onFollowUser={handleFollowUser}
      followingUserId={followedUser?.socketId || null}
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
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadState.currentProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">
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
            pageId={currentPageId || undefined}
            onReorder={async (reorderedArtifacts) => {
              try {
                // With the new structure, the visual order IS the data order!
                await reorderArtifacts(reorderedArtifacts);
              } catch (error) {
                toast.error("Failed to reorder artifacts. Please try again.");
                console.error("Failed to reorder artifacts:", error);
              }
            }}
            onCreateCollection={async (draggedId, targetId) => {
              try {
                const draggedArtifact = artifacts.find(
                  (a) => a.id === draggedId
                );
                const targetArtifact = artifacts.find((a) => a.id === targetId);

                if (!draggedArtifact || !targetArtifact) {
                  toast.error("Could not find artifacts for collection");
                  return;
                }

                const draggedMetadata = draggedArtifact.metadata as any;
                const targetMetadata = targetArtifact.metadata as any;

                // Check if items are already in the same collection
                if (
                  draggedMetadata?.collection_id &&
                  draggedMetadata.collection_id ===
                    targetMetadata?.collection_id
                ) {
                  toast.error("Item is already in this collection");
                  return;
                }

                // Determine collection ID to use
                let collectionId: string;
                if (targetMetadata?.collection_id) {
                  // Target is already in a collection
                  collectionId = targetMetadata.collection_id;
                } else {
                  // Create new collection
                  collectionId = `collection-${Date.now()}`;

                  // Add target to the collection
                  await updateArtifact(targetId, {
                    metadata: {
                      ...targetArtifact.metadata,
                      collection_id: collectionId,
                      is_expanded: false,
                    },
                  });
                }

                // Add dragged item to the collection
                await updateArtifact(draggedId, {
                  metadata: {
                    ...draggedArtifact.metadata,
                    collection_id: collectionId,
                  },
                });

                // Ensure target comes BEFORE dragged in the artifacts array
                // Target should be index 0 (the "cover" of the collection)
                const draggedIndex = artifacts.findIndex(
                  (a) => a.id === draggedId
                );
                const targetIndex = artifacts.findIndex(
                  (a) => a.id === targetId
                );

                if (
                  draggedIndex !== -1 &&
                  targetIndex !== -1 &&
                  draggedIndex < targetIndex
                ) {
                  // Dragged is currently before target, need to reorder
                  // Remove dragged from its position and insert it after target
                  const reordered = [...artifacts];
                  const [removed] = reordered.splice(draggedIndex, 1);
                  const newTargetIndex = reordered.findIndex(
                    (a) => a.id === targetId
                  );
                  reordered.splice(newTargetIndex + 1, 0, removed);

                  await reorderArtifacts(reordered);
                }
              } catch (error) {
                toast.error("Failed to create collection. Please try again.");
                console.error("Failed to create collection:", error);
              }
            }}
            onToggleCollection={async (artifactId) => {
              try {
                const artifact = artifacts.find((a) => a.id === artifactId);
                if (!artifact) return;

                const metadata = artifact.metadata as any;
                const collectionId = metadata?.collection_id;

                if (!collectionId) return;

                // Find all items in the collection
                const collectionArtifacts = artifacts.filter(
                  (a) => (a.metadata as any)?.collection_id === collectionId
                );

                if (collectionArtifacts.length === 0) return;

                // Get current expanded state from first item
                const firstArtifact = collectionArtifacts[0];
                const firstMeta = firstArtifact.metadata as any;
                const isExpanded = firstMeta?.is_expanded || false;

                // Only update the first item - this is sufficient since
                // isCollectionExpanded() only checks the first item
                await updateArtifact(firstArtifact.id, {
                  metadata: {
                    ...firstArtifact.metadata,
                    is_expanded: !isExpanded,
                  },
                });
              } catch (error) {
                toast.error("Failed to toggle collection");
                console.error("Failed to toggle collection:", error);
              }
            }}
            onUpdateArtifact={async (artifactId, updates) => {
              await updateArtifact(artifactId, updates);
            }}
            onDeleteArtifact={async (artifactId) => {
              await deleteArtifact(artifactId);
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
              <div className="text-sm text-red-400">{titleCardError}</div>
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
    </AppLayout>
  );
}

// Simple wrapper - PresentationPageInner gets the room and wraps itself with provider
function PresentationPageContent() {
  return <PresentationPageInnerWithProvider />;
}

// Component that gets room and provides QuickFollowProvider
function PresentationPageInnerWithProvider() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "";
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

  // Get the room from artifact sync - this is the ONLY call to useSyncedArtifacts
  const { getRoom, isSyncReady } = useSyncedArtifacts(
    project?.id,
    currentPageId || undefined
  );

  const room = getRoom();

  // Wait for room to be ready before wrapping with provider
  if (!room || !isSyncReady) {
    return null; // Loading state
  }

  return (
    <QuickFollowProvider
      room={room}
      key={project?.id || "no-project"}
      onBroadcastInitialState={broadcastCallback || undefined}
    >
      <PresentationPageInner onBroadcastReady={wrappedSetBroadcastCallback} />
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
