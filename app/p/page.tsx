"use client";

import useSWR from "swr";
import {
  Suspense,
  useEffect,
  useState,
  useTransition,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import AppLayout from "@/components/layout/AppLayout";
import { usePages } from "@/hooks/usePages";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { usePageArtifacts } from "@/hooks/usePageArtifacts";
import { useRouter } from "next/navigation";
import { generateArtifactName } from "@/lib/artifactNames";
import { toast } from "sonner";
import type { Project, Folder } from "@/types";
import { getProjectByShareToken } from "@/lib/quick-db";
import { uploadFile, getArtifactTypeFromMimeType } from "@/lib/quick-storage";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useAuth } from "@/components/auth/AuthProvider";
import DevDebugPanel from "@/components/DevDebugPanel";
import PageTransition from "@/components/transitions/PageTransition";

const Canvas = dynamic(() => import("@/components/presentation/Canvas"), {
  ssr: false,
});

/**
 * Fetcher function for SWR - gets project by share token
 */
async function fetchProject(shareToken: string): Promise<Project | null> {
  return await getProjectByShareToken(shareToken);
}

function PresentationPageContent() {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("token") || "";
  const router = useRouter();
  const { user } = useAuth();
  const [columns, setColumns] = useState<number>(3);
  const [fitMode, setFitMode] = useState<boolean>(false);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // Debug mode: Override read-only state for testing
  const [debugReadOnly, setDebugReadOnly] = useState(false);

  // Load user's folders for folder dropdown
  const [userFolders, setUserFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!user?.email) return;

    async function loadFolders() {
      if (!user) return;

      try {
        const { getUserFolders } = await import("@/lib/quick-folders");
        const folders = await getUserFolders(user.email);
        setUserFolders(folders);
      } catch (error) {
        console.error("Failed to load folders:", error);
      }
    }

    loadFolders();
  }, [user]);
  const [uploadState, setUploadState] = useState<{
    uploading: boolean;
    totalFiles: number;
    completedFiles: number;
    currentProgress: number;
  }>({
    uploading: false,
    totalFiles: 0,
    completedFiles: 0,
    currentProgress: 0,
  });

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

  // Auto-disable fit mode when columns > 1
  useEffect(() => {
    if (columns > 1 && fitMode) {
      setFitMode(false);
    }
  }, [columns, fitMode]);

  // Fetch project data
  const { data: project } = useSWR<Project | null>(
    shareToken ? `project-token-${shareToken}` : null,
    () => (shareToken ? fetchProject(shareToken) : null),
    { revalidateOnFocus: false }
  );

  // Check permissions
  const permissions = useProjectPermissions(project || null);

  // Allow debug override of read-only mode
  const isReadOnly = debugReadOnly || permissions.isReadOnly;
  const canEdit = !debugReadOnly && permissions.canEdit;
  const isCreator = permissions.isCreator;
  const isCollaborator = permissions.isCollaborator;

  // Fetch and manage pages
  const { pages, createPage, updatePage, deletePage } = usePages(project?.id);
  const { currentPageId, selectPage } = useCurrentPage(pages, project?.id);

  // Fetch page-specific artifacts
  const {
    artifacts,
    createArtifact,
    reorderArtifacts,
    updateArtifact,
    deleteArtifact,
    refetch: refetchArtifacts,
  } = usePageArtifacts(project?.id, currentPageId || undefined);

  // Set document title
  useEffect(() => {
    if (!project?.name) return;
    document.title = `${project.name} | Artifact`;
  }, [project?.name]);

  // Track when project is accessed (for "last opened" sorting)
  useEffect(() => {
    if (!project?.id) return;

    async function trackAccess() {
      if (!project) return;

      try {
        const { updateProject } = await import("@/lib/quick-db");
        await updateProject(project.id, {
          last_accessed_at: new Date().toISOString(),
        });
      } catch (error) {
        // Silent fail - tracking is not critical
        console.debug("Failed to track project access:", error);
      }
    }

    // Track after a short delay to ensure project loaded
    const timer = setTimeout(trackAccess, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // File upload handler with progress tracking
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!project?.id || !currentPageId) return;
      if (files.length === 0) return;

      // Validate all files first (50MB limit)
      const { validateFile } = await import("@/lib/quick-storage");
      for (const file of files) {
        const validation = validateFile(file, { maxSizeMB: 50 });
        if (!validation.valid) {
          toast.error(validation.error || "File too large");
          return;
        }
      }

      // Initialize upload state
      setUploadState({
        uploading: true,
        totalFiles: files.length,
        completedFiles: 0,
        currentProgress: 0,
      });

      try {
        let completedCount = 0;

        for (const file of files) {
          // Upload file to Quick.fs with progress tracking
          const upResult = await uploadFile(file, (progress) => {
            const fileProgress = progress.percentage;
            const overallProgress = Math.round(
              (completedCount * 100 + fileProgress) / files.length
            );

            setUploadState((prev) => ({
              ...prev,
              currentProgress: overallProgress,
            }));
          });

          // Determine file type from MIME type
          const type = getArtifactTypeFromMimeType(upResult.mimeType);

          // Set default metadata for videos (muted, loop, hide controls)
          const defaultMetadata =
            type === "video" ? { hideUI: true, loop: true, muted: true } : {};

          // Create artifact with generated name
          const artifactName = generateArtifactName(
            type,
            upResult.fullUrl,
            file
          );
          const artifact = await createArtifact({
            type,
            source_url: upResult.fullUrl, // Use fullUrl for display
            file_path: upResult.url, // Store relative url
            name: artifactName,
            metadata: defaultMetadata,
          });

          // Generate thumbnail asynchronously for videos (don't await)
          if (type === "video" && artifact) {
            generateAndUploadThumbnail(file, artifact.id).catch((err) => {
              console.error("Thumbnail generation failed:", err);
            });
          }

          completedCount++;
          setUploadState((prev) => ({
            ...prev,
            completedFiles: completedCount,
            currentProgress: Math.round((completedCount / files.length) * 100),
          }));
        }

        toast.success(
          `Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`
        );

        startTransition(() => {
          refetchArtifacts();
        });
      } catch (err) {
        toast.error("Failed to upload files. Please try again.");
        console.error(err);
      } finally {
        setUploadState({
          uploading: false,
          totalFiles: 0,
          completedFiles: 0,
          currentProgress: 0,
        });
      }
    },
    [project?.id, currentPageId, createArtifact, refetchArtifacts]
  );

  // URL add handler
  const handleUrlAdd = useCallback(
    async (url: string) => {
      if (!project?.id || !currentPageId) return;

      setUploadState({
        uploading: true,
        totalFiles: 1,
        completedFiles: 0,
        currentProgress: 50,
      });

      try {
        const artifactName = generateArtifactName("url", url);
        await createArtifact({
          type: "url",
          source_url: url,
          name: artifactName,
        });

        setUploadState((prev) => ({
          ...prev,
          completedFiles: 1,
          currentProgress: 100,
        }));

        toast.success("Successfully added URL artifact");

        startTransition(() => {
          refetchArtifacts();
        });
      } catch (err) {
        toast.error("Failed to add URL artifact. Please try again.");
        console.error(err);
      } finally {
        setUploadState({
          uploading: false,
          totalFiles: 0,
          completedFiles: 0,
          currentProgress: 0,
        });
      }
    },
    [project?.id, currentPageId, createArtifact, refetchArtifacts]
  );

  // Page management handlers
  const handlePageCreate = useCallback(async () => {
    try {
      const newPage = await createPage(
        `Page ${String(pages.length + 1).padStart(2, "0")}`
      );
      if (newPage) {
        selectPage(newPage.id);
      }
    } catch (err) {
      toast.error("Failed to create page. Please try again.");
      console.error("Failed to create page:", err);
    }
  }, [createPage, pages.length, selectPage]);

  const handlePageDelete = useCallback(
    async (pageId: string) => {
      try {
        await deletePage(pageId);
        // selectPage will be handled automatically by useCurrentPage hook
      } catch (err) {
        toast.error("Failed to delete page. Please try again.");
        console.error("Failed to delete page:", err);
      }
    },
    [deletePage]
  );

  const handlePageRename = useCallback(
    async (pageId: string, newName: string) => {
      try {
        await updatePage(pageId, { name: newName });
      } catch (err) {
        toast.error("Failed to rename page. Please try again.");
        console.error("Failed to rename page:", err);
        throw err; // Re-throw so the component can handle the error
      }
    },
    [updatePage]
  );

  const handleProjectNameUpdate = useCallback(
    (name: string) => {
      if (!project) return;
      project.name = name;
    },
    [project]
  );

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      if (!project) return;

      try {
        const { moveProjectToFolder } = await import("@/lib/quick-folders");
        await moveProjectToFolder(project.id, folderId);
        const folder = userFolders.find((f) => f.id === folderId);
        toast.success(`Moved to ${folder?.name || "folder"}`);
        // Update local project state
        project.folder_id = folderId;
      } catch (error) {
        toast.error("Failed to move project");
        console.error(error);
      }
    },
    [project, userFolders]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!project) return;

    try {
      const { removeProjectFromFolder } = await import("@/lib/quick-folders");
      await removeProjectFromFolder(project.id);
      toast.success("Removed from folder");
      // Update local project state
      project.folder_id = null;
    } catch (error) {
      toast.error("Failed to remove from folder");
      console.error(error);
    }
  }, [project]);

  const handleBackToHome = useCallback(() => {
    // Smart back: Go to folder if project is in a folder, otherwise /projects
    if (project?.folder_id) {
      router.push(`/folder?id=${project.folder_id}`);
    } else {
      router.push("/projects");
    }
  }, [router, project]);

  const isUploading = uploadState.uploading || isPending;
  const isPageLoading = !project || pages.length === 0;

  // Show loading state
  if (isPageLoading) {
    return null; // AnimatePresence will handle the fade
  }

  return (
    <PageTransition isLoading={false}>
      <AppLayout
        mode="canvas"
        projectId={project.id}
        projectName={project.name}
        shareToken={project.share_token}
        creatorEmail={project.creator_id}
        isCreator={isCreator}
        isCollaborator={isCollaborator}
        isReadOnly={isReadOnly}
        currentFolderId={project.folder_id}
        folders={userFolders}
        onProjectNameUpdate={canEdit ? handleProjectNameUpdate : undefined}
        onMoveToFolder={canEdit ? handleMoveToFolder : undefined}
        onRemoveFromFolder={canEdit ? handleRemoveFromFolder : undefined}
        onArtifactAdded={canEdit ? refetchArtifacts : undefined}
        columns={columns}
        onColumnsChange={setColumns}
        showColumnControls={true}
        fitMode={fitMode}
        onFitModeChange={setFitMode}
        pages={pages}
        currentPageId={currentPageId || undefined}
        onPageSelect={selectPage}
        onPageRename={handlePageRename}
        onPageCreate={canEdit ? handlePageCreate : undefined}
        onPageDelete={canEdit ? handlePageDelete : undefined}
        onBackToHome={handleBackToHome}
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
              columns={columns}
              fitMode={fitMode}
              artifacts={artifacts}
              onReorder={async (reorderedArtifacts) => {
                try {
                  await reorderArtifacts(reorderedArtifacts);
                } catch (error) {
                  toast.error("Failed to reorder artifacts. Please try again.");
                  console.error("Failed to reorder artifacts:", error);
                }
              }}
              onUpdateArtifact={async (artifactId, updates) => {
                await updateArtifact(artifactId, updates);
              }}
              onDeleteArtifact={async (artifactId) => {
                await deleteArtifact(artifactId);
              }}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

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
                  share_token: project.share_token,
                }
              : undefined
          }
          userEmail={user?.email}
        />
      </AppLayout>
    </PageTransition>
  );
}

export default function PresentationPage() {
  return (
    <Suspense fallback={null}>
      <PresentationPageContent />
    </Suspense>
  );
}
