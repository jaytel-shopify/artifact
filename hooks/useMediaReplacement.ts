import { useCallback } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/quick/fs";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";
import type { Artifact } from "@/types";

/**
 * Hook to handle replacing artifact media files
 */
export function useMediaReplacement(
  projectId: string | undefined,
  currentPageId: string | undefined,
  artifacts: Artifact[],
  replaceMediaSync: (artifactId: string, updates: any) => Promise<any>
) {
  const handleReplaceMedia = useCallback(
    async (artifactId: string, file: File) => {
      if (!projectId || !currentPageId) return;

      try {
        // Find the artifact to get its type
        const artifact = artifacts.find((a) => a.id === artifactId);
        if (!artifact) {
          toast.error("Artifact not found");
          return;
        }

        // Validate file
        const { validateFile, getArtifactTypeFromMimeType } = await import(
          "@/lib/quick/fs"
        );
        const validation = validateFile(file, { maxSizeMB: 50 });
        if (!validation.valid) {
          toast.error(validation.error || "Invalid file");
          return;
        }

        // Verify MIME type matches artifact type
        const newFileType = getArtifactTypeFromMimeType(file.type);
        if (newFileType !== artifact.type) {
          toast.error(
            `File type mismatch. Please select a ${artifact.type} file.`
          );
          return;
        }

        // Show uploading toast
        toast.loading("Replacing media...", { id: "replace-media" });

        // Upload new file
        const uploadResult = await uploadFile(file);

        // Add cache-busting timestamp to force browser reload
        const cacheBuster = `?t=${Date.now()}`;
        const sourceUrlWithCacheBuster = uploadResult.fullUrl + cacheBuster;

        // Update artifact in database with new source (synced with other users)
        // Preserve existing content fields and update the URL
        await replaceMediaSync(artifactId, {
          content: {
            ...artifact.content,
            url: uploadResult.url,
          },
        });

        // For videos, generate new thumbnail (happens asynchronously)
        if (artifact.type === "video") {
          generateAndUploadThumbnail(file, artifactId).catch((err) => {
            console.error("Thumbnail generation failed:", err);
          });
        }

        toast.success("Media replaced successfully", { id: "replace-media" });
      } catch (error) {
        console.error("Failed to replace media:", error);
        toast.error("Failed to replace media. Please try again.", {
          id: "replace-media",
        });
      }
    },
    [projectId, currentPageId, artifacts, replaceMediaSync]
  );

  return { handleReplaceMedia };
}
