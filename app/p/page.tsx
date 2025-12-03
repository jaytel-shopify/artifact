"use client";

import useSWR from "swr";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, PanelLeft, PanelLeftClose, Plus } from "lucide-react";
import { usePages } from "@/hooks/usePages";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useSyncedArtifacts } from "@/hooks/useSyncedArtifacts";
import { toast } from "sonner";
import type { Project, Page } from "@/types";
import { getProjectById } from "@/lib/quick-db";
import { useArtifactCommands } from "@/hooks/useArtifactCommands";
import {
  ReorderArtifactsCommand,
  AddToCollectionCommand,
  RemoveFromCollectionCommand,
  UpdateArtifactCommand,
  DeleteArtifactCommand,
} from "@/lib/artifact-commands";
import { cacheKeys } from "@/lib/cache-keys";
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
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import ColumnControl from "@/components/layout/header/ColumnControl";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import SyncStatusIndicator from "@/components/presentation/SyncStatusIndicator";
import { SharePanel } from "@/components/access/SharePanel";
import ReadOnlyBadge from "@/components/sharing/ReadOnlyBanner";
import PageNavigationSidebar from "@/components/layout/PageNavigationSidebar";

const Canvas = dynamic(() => import("@/components/presentation/Canvas"), {
  ssr: false,
});

/**
 * Builds header configuration for the presentation page.
 * Used by both the initial header (with defaults) and the full header (with real state).
 */
function buildPresentationHeader({
  backUrl = "/projects/",
  sidebarOpen = false,
  onSidebarToggle,
  columns = 3,
  onColumnsChange = () => {},
  onOverscroll = () => {},
  presentationMode = false,
  centerExtra,
  rightExtra,
}: {
  backUrl?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  columns?: number;
  onColumnsChange?: (n: number) => void;
  onOverscroll?: (amount: number) => void;
  presentationMode?: boolean;
  centerExtra?: React.ReactNode;
  rightExtra?: React.ReactNode;
}) {
  return {
    left: !presentationMode ? (
      <>
        <Button href={backUrl} variant="default" size="icon" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
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
          onColumnsChange={onColumnsChange}
          onOverscroll={onOverscroll}
        />
        {/* Always reserve space for plus button to prevent layout shift */}
        {centerExtra || (
          <Button
            variant="primary"
            size="icon"
            style={{ visibility: "hidden" }}
            aria-hidden
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </>
    ),
    right: !presentationMode ? (
      <>
        {rightExtra}
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ) : undefined,
  };
}

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
  project,
  pages,
  currentPageId,
  selectPage: selectPageProp,
  createPage,
  updatePage,
  deletePage,
  reorderPages,
}: {
  onBroadcastReady?: (callback: () => void) => void;
  syncedArtifacts: ReturnType<typeof useSyncedArtifacts>;
  project: Project | null | undefined;
  pages: Page[];
  currentPageId: string | null;
  selectPage: (pageId: string) => void;
  createPage: (name: string) => Promise<Page | null>;
  updatePage: (
    pageId: string,
    updates: Partial<Pick<Page, "name" | "position">>
  ) => Promise<Page | null>;
  deletePage: (pageId: string) => Promise<void>;
  reorderPages: (reorderedPages: Page[]) => Promise<void>;
}) {
  const { user } = useAuth();
  const [columns, setColumns] = useState<number>(3);
  const [fitMode, setFitMode] = useState<boolean>(false);
  // const [dragging, setDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [columnControlsOverscrollAmount, setColumnControlsOverscrollAmount] =
    useState(0);
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

  // Check permissions (access already verified in parent, this is for edit permissions)
  const permissions = useResourcePermissions(project?.id || null, "project");

  // Allow debug override of read-only mode
  const isReadOnly = debugReadOnly || permissions.isReadOnly;
  const canEdit = !debugReadOnly && permissions.canEdit;
  const accessLevel = permissions.accessLevel;
  const isCollaborator = accessLevel === "editor";

  // Use page state from props (managed by parent to keep artifacts in sync)
  const selectPage = selectPageProp;

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

  const handleOverscroll = (overscroll: number) => {
    setColumnControlsOverscrollAmount(Math.max(0, overscroll));
  };

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

  // // Artifact upload handlers
  // const { uploadState, handleFileUpload, handleUrlAdd, isPending } =
  //   useArtifactUpload({
  //     projectId: project?.id,
  //     currentPageId: currentPageId || undefined,
  //     createArtifact,
  //     refetchArtifacts,
  //   });

  // Page management handlers
  const { handlePageCreate, handlePageDelete, handlePageRename } =
    usePageHandlers(pages, createPage, updatePage, deletePage, selectPage);

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

  // const isUploading = uploadState.uploading || isPending;
  const isPageLoading = !project || pages.length === 0;

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Set header content using shared helper - must be called before any return statements
  useSetHeader(
    buildPresentationHeader({
      backUrl,
      sidebarOpen,
      onSidebarToggle: () => setSidebarOpen((prev) => !prev),
      columns,
      onColumnsChange: handleSetColumns,
      onOverscroll: handleOverscroll,
      presentationMode,
      centerExtra: project?.id && currentPageId && canEdit && (
        <div
          style={{
            transform: `translateX(${columnControlsOverscrollAmount}px)`,
          }}
        >
          <ArtifactAdder
            variant="icon"
            projectId={project.id}
            pageId={currentPageId}
            onAdded={refetchArtifacts}
            createArtifact={createArtifact}
          />
        </div>
      ),
      rightExtra: project ? (
        <>
          {isReadOnly && !isCollaborator && <ReadOnlyBadge />}
          <SyncStatusIndicator
            isPresenceReady={isPresenceReady}
            getUsers={getUsers}
            onFollowUser={handleFollowUser}
            followingUserId={followedUser?.socketId || null}
          />
          {user && (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => setShareDialogOpen(true)}
            >
              Share
            </Button>
          )}
        </>
      ) : undefined,
    }),
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
      columnControlsOverscrollAmount,
    ]
  );

  if (isPageLoading) {
    return null;
  }

  return (
    <>
      <div className="flex flex-1 h-[calc(100vh-var(--header-height))] max-w-screen overflow-x-clip relative">
        {/* Mobile backdrop overlay */}
        {sidebarOpen && !presentationMode && (
          <div
            className="fixed inset-0 bg-primary/50 z-[5] lg:hidden animate-in fade-in duration-300"
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
            transform:
              sidebarOpen && !presentationMode
                ? "translateX(var(--sidebar-width))"
                : "translateX(0)",
            transition: "transform 400ms var(--spring-elegant-easing-light)",
          }}
        >
          <div className="h-full relative">
            {/* Canvas */}
            <div className="h-full">
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
                  const command = new DeleteArtifactCommand(
                    artifactId,
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
          currentUserId={user.id}
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
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Edit Title Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-small text-text-primary/70">
                Headline
              </label>
              <Input
                value={editingTitleCard?.headline || ""}
                onChange={(e) =>
                  setEditingTitleCard((prev) =>
                    prev ? { ...prev, headline: e.target.value } : null
                  )
                }
                placeholder="Enter headline"
                className="w-full bg-white/5 border-white/15 text-text-primary placeholder:text-text-primary/60 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-small text-text-primary/70">
                Subheadline
              </label>
              <Input
                value={editingTitleCard?.subheadline || ""}
                onChange={(e) =>
                  setEditingTitleCard((prev) =>
                    prev ? { ...prev, subheadline: e.target.value } : null
                  )
                }
                placeholder="Enter subheadline"
                className="w-full bg-white/5 border-white/15 text-text-primary placeholder:text-text-primary/60 focus:border-white/30 focus:ring-white/20"
              />
            </div>

            {titleCardError && (
              <div className="text-small text-destructive">
                {titleCardError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingTitleCard(null);
                setTitleCardError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTitleCardSubmit}
              disabled={
                !editingTitleCard?.headline && !editingTitleCard?.subheadline
              }
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
        userId={user?.id}
      />
    </>
  );
}

// Component that checks access before loading project data
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

  // Check access FIRST before loading any project data
  const permissions = useResourcePermissions(projectId || null, "project");

  // Show loading while checking access
  if (permissions.loading) {
    return null;
  }

  // Show access denied if user doesn't have permission
  if (!permissions.canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] gap-4">
        <h1 className="text-xlarge">Access Denied</h1>
        <p className="text-text-secondary">
          You don&apos;t have permission to view this project.
        </p>
        <Button href="/projects/" variant="primary">
          Go to Projects
        </Button>
      </div>
    );
  }

  // Only render the actual project content if user has access
  return (
    <PresentationPageContent
      projectId={projectId}
      broadcastCallback={broadcastCallback}
      setBroadcastCallback={wrappedSetBroadcastCallback}
    />
  );
}

// Separate component that loads project data - only rendered after access is confirmed
function PresentationPageContent({
  projectId,
  broadcastCallback,
  setBroadcastCallback,
}: {
  projectId: string;
  broadcastCallback: (() => void) | null;
  setBroadcastCallback: (callback: (() => void) | null) => void;
}) {
  // Fetch project - only happens after access is confirmed
  const { data: project } = useSWR<Project | null>(
    cacheKeys.projectData(projectId),
    () => (projectId ? fetchProject(projectId) : null),
    { revalidateOnFocus: false }
  );

  // Page state managed here so artifacts stay in sync with selected page
  const { pages, createPage, updatePage, deletePage, reorderPages } = usePages(
    project?.id
  );
  const { currentPageId, selectPage } = useCurrentPage(pages, project?.id);

  // Single call to useSyncedArtifacts - get everything needed
  const syncedArtifacts = useSyncedArtifacts(
    project?.id,
    currentPageId || undefined
  );

  const room = syncedArtifacts.getRoom();

  // Wait for room to be ready before wrapping with provider
  if (!room || !syncedArtifacts.isPresenceReady) {
    return null;
  }

  return (
    <QuickFollowProvider
      room={room}
      key={project?.id || "no-project"}
      onBroadcastInitialState={broadcastCallback || undefined}
    >
      <PresentationPageInner
        onBroadcastReady={setBroadcastCallback}
        syncedArtifacts={syncedArtifacts}
        project={project}
        pages={pages}
        currentPageId={currentPageId}
        selectPage={selectPage}
        createPage={createPage}
        updatePage={updatePage}
        deletePage={deletePage}
        reorderPages={reorderPages}
      />
    </QuickFollowProvider>
  );
}

export default function PresentationPage() {
  // Set header immediately with defaults - PresentationPageInner will override with real state
  useSetHeader(buildPresentationHeader({}));

  return (
    <Suspense fallback={null}>
      <PresentationPageInnerWithProvider />
    </Suspense>
  );
}
