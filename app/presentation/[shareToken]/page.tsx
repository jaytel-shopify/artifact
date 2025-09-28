"use client";

import useSWR from "swr";
import { use, useEffect, useState, useTransition, useCallback } from "react";
import dynamic from "next/dynamic";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import AppLayout from "@/components/layout/AppLayout";
import { usePages } from "@/hooks/usePages";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { usePageArtifacts } from "@/hooks/usePageArtifacts";
import { useRouter } from "next/navigation";
import { generateArtifactName } from "@/lib/artifactNames";
import { toast } from "sonner";
import type { Project } from "@/types";

const Canvas = dynamic(() => import("@/components/presentation/Canvas"), {
  ssr: false,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PresentationPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const router = useRouter();
  const [columns, setColumns] = useState<number>(3);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
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
  const { data: projectRes } = useSWR<{ project: Project }>(
    () => (shareToken ? `/api/projects/by-share?token=${shareToken}` : null),
    fetcher,
    { revalidateOnFocus: false }
  );
  const project = projectRes?.project;

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
        // Upload file with progress tracking
        const form = new FormData();
        form.append("file", file);
        form.append("project_id", project.id);
        
        // Create XMLHttpRequest for progress tracking
        const uploadPromise = new Promise<{publicUrl: string, path: string}>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const fileProgress = Math.round((e.loaded / e.total) * 100);
              const overallProgress = Math.round(
                ((completedCount * 100) + fileProgress) / files.length
              );
              
              setUploadState(prev => ({
                ...prev,
                currentProgress: overallProgress,
              }));
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch {
                reject(new Error('Failed to parse upload response'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });
          
          xhr.open('POST', '/api/upload');
          xhr.send(form);
        });
        
        const upResult = await uploadPromise;
        
        // Determine file type
        const type = file.type.startsWith("video/")
          ? "video"
          : file.type === "application/pdf"
            ? "pdf"
            : "image";
            
        // Create artifact with generated name
        const artifactName = generateArtifactName(type, upResult.publicUrl, file);
        await createArtifact({
          type,
          source_url: upResult.publicUrl,
          file_path: upResult.path,
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

  const handleBackToHome = useCallback(() => {
    router.push('/');
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
      onArtifactAdded={refetchArtifacts}
      columns={columns}
      onColumnsChange={setColumns}
      showColumnControls={true}
      pages={pages}
      currentPageId={currentPageId || undefined}
      onPageSelect={selectPage}
      onPageRename={handlePageRename}
      onPageCreate={handlePageCreate}
      onPageDelete={handlePageDelete}
      onBackToHome={handleBackToHome}
    >
      <div className="h-full relative">
        {/* Dropzone for file uploads */}
        {project?.id && currentPageId && (
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
        <div className="h-full pt-[var(--spacing-xl)]">
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
            onUpdateArtifact={updateArtifact}
            onDeleteArtifact={deleteArtifact}
          />
        </div>
      </div>
    </AppLayout>
  );
}


