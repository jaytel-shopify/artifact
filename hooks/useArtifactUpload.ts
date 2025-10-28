import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { uploadFile, getArtifactTypeFromMimeType } from "@/lib/quick-storage";
import { generateArtifactName } from "@/lib/artifactNames";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";

interface UploadState {
  uploading: boolean;
  totalFiles: number;
  completedFiles: number;
  currentProgress: number;
}

interface UseArtifactUploadOptions {
  projectId: string | undefined;
  currentPageId: string | undefined;
  createArtifact: (data: any) => Promise<any>;
  refetchArtifacts: () => void;
}

/**
 * Hook to handle artifact upload (files and URLs)
 */
export function useArtifactUpload({
  projectId,
  currentPageId,
  createArtifact,
  refetchArtifacts,
}: UseArtifactUploadOptions) {
  const [isPending, startTransition] = useTransition();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    totalFiles: 0,
    completedFiles: 0,
    currentProgress: 0,
  });

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!projectId || !currentPageId) return;
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
            source_url: upResult.fullUrl,
            file_path: upResult.url,
            name: artifactName,
            metadata: defaultMetadata,
          });

          // Generate thumbnail asynchronously for videos
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
    [projectId, currentPageId, createArtifact, refetchArtifacts]
  );

  const handleUrlAdd = useCallback(
    async (url: string) => {
      if (!projectId || !currentPageId) return;

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
    [projectId, currentPageId, createArtifact, refetchArtifacts]
  );

  return {
    uploadState,
    handleFileUpload,
    handleUrlAdd,
    isPending,
  };
}

