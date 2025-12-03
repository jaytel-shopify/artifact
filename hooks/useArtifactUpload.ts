import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  uploadFile,
  getArtifactTypeFromMimeType,
  validateFile,
} from "@/lib/quick-storage";
import { generateArtifactName } from "@/lib/artifactNames";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";
import {
  DEFAULT_VIEWPORT_KEY,
  getViewportDimensions,
  type ViewportKey,
} from "@/lib/viewports";
import {
  createArtifactInProject,
  createArtifact as createStandaloneArtifact,
} from "@/lib/quick-db";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Artifact, ArtifactType, ArtifactWithPosition } from "@/types";

export interface UploadState {
  uploading: boolean;
  totalFiles: number;
  currentFileIndex: number;
  currentFileName: string;
  currentProgress: number;
  error: string | null;
}

const initialUploadState: UploadState = {
  uploading: false,
  totalFiles: 0,
  currentFileIndex: 0,
  currentFileName: "",
  currentProgress: 0,
  error: null,
};

/** Context for project-linked uploads */
export interface UploadContext {
  projectId: string | null;
  pageId: string | null;
}

interface UseArtifactUploadOptions {
  /** Default project context - can be overridden per-call */
  defaultContext?: UploadContext;
  /** Callback when artifact is created */
  onArtifactCreated?: (artifact: Artifact | ArtifactWithPosition) => void;
  /** Max file size in MB (default 250) */
  maxFileSizeMB?: number;
}

/**
 * Hook to handle all artifact upload operations (files, URLs, title cards)
 *
 * Supports two modes:
 * 1. Project mode (context provided): Creates artifacts linked to a project/page
 * 2. Standalone mode (no context): Creates published standalone artifacts
 *
 * Context can be provided as defaultContext or passed to each handler call.
 */
export function useArtifactUpload({
  defaultContext,
  onArtifactCreated,
  maxFileSizeMB = 250,
}: UseArtifactUploadOptions = {}) {
  const { user } = useAuth();
  const [uploadState, setUploadState] =
    useState<UploadState>(initialUploadState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setUploadState(initialUploadState);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /**
   * Internal helper to create an artifact
   * Supports both project-linked and standalone artifacts
   */
  const createArtifactInternal = useCallback(
    async (
      artifactData: {
        type: ArtifactType;
        source_url: string;
        file_path?: string | null;
        name?: string;
        metadata?: Record<string, unknown>;
      },
      context?: UploadContext
    ): Promise<Artifact | ArtifactWithPosition | null> => {
      if (!user?.id) return null;

      // Project mode: create artifact linked to project/page
      if (context?.projectId && context?.pageId) {
        const { artifact, projectArtifact } = await createArtifactInProject({
          project_id: context.projectId,
          page_id: context.pageId,
          type: artifactData.type,
          source_url: artifactData.source_url,
          file_path: artifactData.file_path || undefined,
          name: artifactData.name || "Untitled",
          creator_id: user.id,
          metadata: artifactData.metadata || {},
          published: false,
        });

        const artifactWithPosition: ArtifactWithPosition = {
          ...artifact,
          position: projectArtifact.position,
          project_artifact_id: projectArtifact.id,
        };

        onArtifactCreated?.(artifactWithPosition);
        return artifactWithPosition;
      }

      // Standalone mode: create published artifact not linked to any project
      const artifact = await createStandaloneArtifact({
        type: artifactData.type,
        source_url: artifactData.source_url,
        file_path: artifactData.file_path || undefined,
        name: artifactData.name || "Untitled",
        creator_id: user.id,
        metadata: artifactData.metadata || {},
        published: true,
      });

      onArtifactCreated?.(artifact);
      return artifact;
    },
    [user?.id, onArtifactCreated]
  );

  /**
   * Handle media file uploads (images/videos)
   * @param files - Files to upload
   * @param context - Optional project context (overrides defaultContext)
   */
  const handleFileUpload = useCallback(
    async (files: File[], context?: UploadContext) => {
      if (files.length === 0) return;
      if (!user?.id) {
        toast.error("Unable to upload: please sign in first");
        return;
      }

      const effectiveContext = context || defaultContext;

      setUploadState({
        uploading: true,
        totalFiles: files.length,
        currentFileIndex: 0,
        currentFileName: "",
        currentProgress: 0,
        error: null,
      });

      try {
        // Validate all files first
        for (const file of files) {
          const validation = validateFile(file, { maxSizeMB: maxFileSizeMB });
          if (!validation.valid) {
            toast.error(validation.error || "File too large");
            resetState();
            return;
          }
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadState((prev) => ({
            ...prev,
            currentFileName: file.name,
            currentFileIndex: i + 1,
            currentProgress: 0,
          }));

          // Upload file to Quick.fs
          const upResult = await uploadFile(file, (progress) => {
            setUploadState((prev) => ({
              ...prev,
              currentProgress: progress.percentage,
            }));
          });

          // Determine file type from MIME type
          const type = getArtifactTypeFromMimeType(upResult.mimeType);

          // Build metadata with dimensions and type-specific defaults
          const metadata: Record<string, unknown> = {};

          // Add dimensions if available
          if (upResult.width && upResult.height) {
            metadata.width = upResult.width;
            metadata.height = upResult.height;
          }

          // Add video-specific defaults
          if (type === "video") {
            metadata.hideUI = true;
            metadata.loop = true;
            metadata.muted = true;
          }

          // Create artifact with generated name
          const artifactName = generateArtifactName(
            type,
            upResult.fullUrl,
            file
          );
          const artifact = await createArtifactInternal(
            {
              type,
              source_url: upResult.fullUrl,
              file_path: upResult.url,
              name: artifactName,
              metadata,
            },
            effectiveContext
          );

          // Generate thumbnail asynchronously for videos
          if (type === "video" && artifact) {
            generateAndUploadThumbnail(file, artifact.id).catch((err) => {
              console.error("Thumbnail generation failed:", err);
            });
          }
        }

        toast.success(
          `Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setUploadState((prev) => ({ ...prev, error: message }));
        toast.error(message || "Upload failed. Please try again.");
      } finally {
        resetState();
      }
    },
    [
      defaultContext,
      user?.id,
      createArtifactInternal,
      maxFileSizeMB,
      resetState,
    ]
  );

  /**
   * Handle file input change event
   */
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  /**
   * Trigger file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle URL artifact creation
   * @param url - URL to embed
   * @param viewport - Viewport size (default: laptop)
   * @param context - Optional project context (overrides defaultContext)
   */
  const handleUrlUpload = useCallback(
    async (
      url: string,
      viewport: ViewportKey = DEFAULT_VIEWPORT_KEY,
      context?: UploadContext
    ) => {
      if (!url) return;
      if (!user?.id) {
        toast.error("Unable to add URL: please sign in first");
        return;
      }

      const effectiveContext = context || defaultContext;

      setUploadState({
        uploading: true,
        totalFiles: 1,
        currentFileIndex: 1,
        currentFileName: url,
        currentProgress: 50,
        error: null,
      });

      try {
        const dims = getViewportDimensions(viewport);
        const artifactName = generateArtifactName("url", url);

        await createArtifactInternal(
          {
            type: "url",
            source_url: url,
            name: artifactName,
            metadata: {
              viewport,
              width: dims.width,
              height: dims.height,
            },
          },
          effectiveContext
        );

        toast.success("Successfully added URL artifact");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to add URL";
        setUploadState((prev) => ({ ...prev, error: message }));
        toast.error(message || "Failed to add URL. Please try again.");
        throw e;
      } finally {
        resetState();
      }
    },
    [defaultContext, user?.id, createArtifactInternal, resetState]
  );

  /**
   * Handle title card creation
   * @param headline - Title card headline
   * @param subheadline - Title card subheadline
   * @param context - Optional project context (overrides defaultContext)
   */
  const handleTitleCardUpload = useCallback(
    async (headline: string, subheadline: string, context?: UploadContext) => {
      if (!headline && !subheadline) {
        const error = "Please enter at least a headline or subheadline";
        setUploadState((prev) => ({ ...prev, error }));
        return;
      }
      if (!user?.id) {
        toast.error("Unable to create title card: please sign in first");
        return;
      }

      const effectiveContext = context || defaultContext;

      setUploadState({
        uploading: true,
        totalFiles: 1,
        currentFileIndex: 1,
        currentFileName: headline || "Title Card",
        currentProgress: 50,
        error: null,
      });

      try {
        await createArtifactInternal(
          {
            type: "titleCard",
            source_url: "",
            name: headline || "Title Card",
            metadata: {
              headline,
              subheadline,
            },
          },
          effectiveContext
        );

        toast.success("Successfully added title card");
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to add title card";
        setUploadState((prev) => ({ ...prev, error: message }));
        toast.error(message || "Failed to add title card. Please try again.");
        throw e;
      } finally {
        resetState();
      }
    },
    [defaultContext, user?.id, createArtifactInternal, resetState]
  );

  // Check if upload is possible (user is authenticated)
  const canUpload = Boolean(user?.id);

  return {
    uploadState,
    fileInputRef,
    canUpload,
    handleFileUpload,
    handleFileInputChange,
    handleUrlUpload,
    handleTitleCardUpload,
    openFilePicker,
    resetState,
  };
}
