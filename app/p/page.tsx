"use client";

import useSWR from "swr";
import { Suspense, useEffect, useState, useTransition, useCallback } from "react";
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
import type { Project } from "@/types";
import { getProjectByShareToken } from "@/lib/quick-db";
import { uploadFile, getArtifactTypeFromMimeType } from "@/lib/quick-storage";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useAuth } from "@/components/auth/AuthProvider";
import DevDebugPanel from "@/components/DevDebugPanel";

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
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  
  // Debug mode: Override read-only state for testing
  const [debugReadOnly, setDebugReadOnly] = useState(false);
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

  // Load column preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("columns_in_view");
    if (stored) {
      const next = Math.min(8, Math.max(1, Number(stored)));
      setColumns(next);
    }
    setHydrated(true);
  }, []);

  // Save column preference
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("columns_in_view", String(columns));
  }, [columns, hydrated]);

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
  const { artifacts, createArtifact, reorderArtifacts, updateArtifact, deleteArtifact, refetch: refetchArtifacts } = usePageArtifacts(project?.id, currentPageId || undefined);

  // Set document title
  useEffect(() => {
    if (!project?.name) return;
    document.title = `${project.name} | Artifact`;
  }, [project?.name]);

  // File upload handler with progress tracking
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!project?.id || !currentPageId) return;
    if (files.length === 0) return;
    
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
            ((completedCount * 100) + fileProgress) / files.length
          );
          
          setUploadState(prev => ({
            ...prev,
            currentProgress: overallProgress,
          }));
        });
        
        // Determine file type from MIME type
        const type = getArtifactTypeFromMimeType(upResult.mimeType);
            
        // Create artifact with generated name
        const artifactName = generateArtifactName(type, upResult.fullUrl, file);
        await createArtifact({
          type,
          source_url: upResult.fullUrl,  // Use fullUrl for display
          file_path: upResult.url,        // Store relative url
          name: artifactName,
        });
        
        completedCount++;
        setUploadState(prev => ({
          ...prev,
          completedFiles: completedCount,
          currentProgress: Math.round((completedCount / files.length) * 100),
        }));
      }
      
      toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      
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
  }, [project?.id, currentPageId, createArtifact, refetchArtifacts]);

  // URL add handler
  const handleUrlAdd = useCallback(async (url: string) => {
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
      
      setUploadState(prev => ({
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
  }, [project?.id, currentPageId, createArtifact, refetchArtifacts]);

  // Page management handlers
  const handlePageCreate = useCallback(async () => {
    try {
      const newPage = await createPage(`Page ${String(pages.length + 1).padStart(2, '0')}`);
      if (newPage) {
        selectPage(newPage.id);
      }
    } catch (err) {
      toast.error("Failed to create page. Please try again.");
      console.error('Failed to create page:', err);
    }
  }, [createPage, pages.length, selectPage]);

  const handlePageDelete = useCallback(async (pageId: string) => {
    try {
      await deletePage(pageId);
      // selectPage will be handled automatically by useCurrentPage hook
    } catch (err) {
      toast.error("Failed to delete page. Please try again.");
      console.error('Failed to delete page:', err);
    }
  }, [deletePage]);

  const handlePageRename = useCallback(async (pageId: string, newName: string) => {
    try {
      await updatePage(pageId, { name: newName });
    } catch (err) {
      toast.error("Failed to rename page. Please try again.");
      console.error('Failed to rename page:', err);
      throw err; // Re-throw so the component can handle the error
    }
  }, [updatePage]);

  const handleProjectNameUpdate = useCallback((name: string) => {
    if (!project) return;
    project.name = name;
  }, [project]);

  const handleBackToHome = useCallback(() => {
    router.push('/projects');
  }, [router]);

  const isUploading = uploadState.uploading || isPending;
  const isLoading = !project || pages.length === 0;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
        <div className="text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout
      mode="canvas"
      projectId={project.id}
      projectName={project.name}
      shareToken={project.share_token}
      creatorEmail={project.creator_id}
      isCreator={isCreator}
      isCollaborator={isCollaborator}
      isReadOnly={isReadOnly}
      onProjectNameUpdate={canEdit ? handleProjectNameUpdate : undefined}
      onArtifactAdded={canEdit ? refetchArtifacts : undefined}
      columns={columns}
      onColumnsChange={setColumns}
      showColumnControls={true}
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
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {dragging ? (
                <div className="text-center">
                  <div className="font-medium">Drop to upload</div>
                </div>
              ) : (
                <div className="text-center space-y-3 min-w-[200px]">
                  <div className="font-medium">
                    Uploading{uploadState.totalFiles > 1 ? ` ${uploadState.completedFiles + 1} of ${uploadState.totalFiles}` : ''}...
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
            artifacts={artifacts}
            onReorder={async (reorderedArtifacts) => {
              try {
                await reorderArtifacts(reorderedArtifacts);
              } catch (error) {
                toast.error("Failed to reorder artifacts. Please try again.");
                console.error('Failed to reorder artifacts:', error);
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
  );
}




export default function PresentationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <PresentationPageContent />
    </Suspense>
  );
}
