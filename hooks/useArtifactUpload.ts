import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  uploadFile,
  getArtifactTypeFromMimeType,
  validateFile,
} from "@/lib/quick-storage";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";
import { generateAndUploadUrlScreenshot } from "@/lib/url-screenshots";
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
import type { PendingUpload } from "@/components/upload/UploadPreviewDialog";

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

/** Files pending preview before upload */
export interface PendingFiles {
  files: File[];
  context?: UploadContext;
  /** If true, user must select project/page in dialog */
  requireProjectSelection?: boolean;
}

/** URL pending preview before upload */
export interface PendingUrl {
  url: string;
  context?: UploadContext;
  /** If true, user must select project/page in dialog */
  requireProjectSelection?: boolean;
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
  const [pendingFiles, setPendingFiles] = useState<PendingFiles | null>(null);
  const [pendingUrl, setPendingUrl] = useState<PendingUrl | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setUploadState(initialUploadState);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const clearPendingFiles = useCallback(() => {
    setPendingFiles(null);
  }, []);

  const clearPendingUrl = useCallback(() => {
    setPendingUrl(null);
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
        description?: string;
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
          description: artifactData.description,
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
        description: artifactData.description,
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
   * Stage files for preview before upload
   * Opens the preview dialog where user can set name/description
   * @param files - Files to stage
   * @param context - Optional project context (overrides defaultContext)
   * @param requireProjectSelection - If true, user must select project/page in dialog
   */
  const stageFilesForUpload = useCallback(
    (
      files: File[],
      context?: UploadContext,
      requireProjectSelection?: boolean
    ) => {
      if (files.length === 0) return;
      if (!user?.id) {
        toast.error("Unable to upload: please sign in first");
        return;
      }

      // Validate all files first
      for (const file of files) {
        const validation = validateFile(file, { maxSizeMB: maxFileSizeMB });
        if (!validation.valid) {
          toast.error(validation.error || "File too large");
          return;
        }
      }

      const effectiveContext = context || defaultContext;
      setPendingFiles({
        files,
        context: effectiveContext,
        requireProjectSelection,
      });
    },
    [defaultContext, user?.id, maxFileSizeMB]
  );

  /**
   * Confirm and upload staged files with user-provided metadata
   * Called after user confirms in the preview dialog
   * @param uploads - Pending uploads with name/description from dialog
   * @param context - Optional context from dialog (overrides pendingFiles.context)
   */
  const confirmFileUpload = useCallback(
    async (uploads: PendingUpload[], context?: UploadContext) => {
      if (uploads.length === 0) return;
      if (!user?.id) {
        toast.error("Unable to upload: please sign in first");
        return;
      }

      // Use context from dialog if provided, otherwise use stored context
      const effectiveContext = context || pendingFiles?.context;

      setUploadState({
        uploading: true,
        totalFiles: uploads.length,
        currentFileIndex: 0,
        currentFileName: "",
        currentProgress: 0,
        error: null,
      });

      try {
        for (let i = 0; i < uploads.length; i++) {
          const upload = uploads[i];
          setUploadState((prev) => ({
            ...prev,
            currentFileName: upload.file.name,
            currentFileIndex: i + 1,
            currentProgress: 0,
          }));

          // Upload file to Quick.fs
          const upResult = await uploadFile(upload.file, (progress) => {
            setUploadState((prev) => ({
              ...prev,
              currentProgress: progress.percentage,
            }));
          });

          // Build metadata with dimensions and type-specific defaults
          const metadata: Record<string, unknown> = {};

          // Add dimensions if available
          if (upResult.width && upResult.height) {
            metadata.width = upResult.width;
            metadata.height = upResult.height;
          }

          // Add video-specific defaults
          if (upload.type === "video") {
            metadata.hideUI = true;
            metadata.loop = true;
            metadata.muted = true;
          }

          // Create artifact with user-provided name and description
          const artifact = await createArtifactInternal(
            {
              type: upload.type,
              source_url: upResult.fullUrl,
              file_path: upResult.url,
              name: upload.name || upload.suggestedName,
              description: upload.description || undefined,
              metadata,
            },
            effectiveContext
          );

          // Generate thumbnail asynchronously for videos
          if (upload.type === "video" && artifact) {
            generateAndUploadThumbnail(upload.file, artifact.id).catch(
              (err) => {
                console.error("Thumbnail generation failed:", err);
              }
            );
          }
        }

        toast.success(
          `Successfully uploaded ${uploads.length} file${uploads.length > 1 ? "s" : ""}`
        );
        clearPendingFiles();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setUploadState((prev) => ({ ...prev, error: message }));
        toast.error(message || "Upload failed. Please try again.");
      } finally {
        resetState();
      }
    },
    [
      pendingFiles?.context,
      user?.id,
      createArtifactInternal,
      clearPendingFiles,
      resetState,
    ]
  );

  /**
   * Handle file input change event - stages files for preview
   */
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      stageFilesForUpload(files);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [stageFilesForUpload]
  );

  /**
   * Trigger file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Stage a URL for preview before upload
   * Opens the URL preview dialog where user can set name/description
   * @param url - URL to stage
   * @param context - Optional project context (overrides defaultContext)
   * @param requireProjectSelection - If true, user must select project/page in dialog
   */
  const stageUrlForUpload = useCallback(
    (
      url: string,
      context?: UploadContext,
      requireProjectSelection?: boolean
    ) => {
      if (!url) return;
      if (!user?.id) {
        toast.error("Unable to add URL: please sign in first");
        return;
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        toast.error("Invalid URL");
        return;
      }

      const effectiveContext = context || defaultContext;
      setPendingUrl({
        url,
        context: effectiveContext,
        requireProjectSelection,
      });
    },
    [defaultContext, user?.id]
  );

  /**
   * Handle URL artifact creation
   * @param url - URL to embed
   * @param viewport - Viewport size (default: laptop)
   * @param name - Optional custom name for the artifact
   * @param description - Optional description for the artifact
   * @param context - Optional project context (overrides defaultContext)
   */
  const handleUrlUpload = useCallback(
    async (
      url: string,
      viewport: ViewportKey = DEFAULT_VIEWPORT_KEY,
      name?: string,
      description?: string,
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
        // Use provided name, or fall back to URL hostname
        let urlName = name?.trim() || "";
        if (!urlName) {
          try {
            urlName = new URL(url).hostname;
          } catch {
            urlName = "URL";
          }
        }

        const artifact = await createArtifactInternal(
          {
            type: "url",
            source_url: url,
            name: urlName,
            description: description?.trim() || undefined,
            metadata: {
              viewport,
              width: dims.width,
              height: dims.height,
            },
          },
          effectiveContext
        );

        // Generate screenshot asynchronously for URL artifacts
        if (artifact) {
          generateAndUploadUrlScreenshot(url, artifact.id).catch((err) => {
            console.error("URL screenshot generation failed:", err);
          });
        }

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
   * Confirm and upload URL with user-provided metadata
   * Called after user confirms in the URL preview dialog
   * @param url - The URL to upload (from dialog, may differ from staged URL)
   * @param name - User-provided name
   * @param description - User-provided description
   * @param viewport - Selected viewport
   * @param context - Optional context from dialog (overrides pendingUrl.context)
   */
  const confirmUrlUpload = useCallback(
    async (
      url: string,
      name: string,
      description: string,
      viewport: ViewportKey = DEFAULT_VIEWPORT_KEY,
      context?: UploadContext
    ) => {
      if (!url) return;

      // Use context from dialog if provided, otherwise use stored context
      const effectiveContext = context || pendingUrl?.context;

      await handleUrlUpload(url, viewport, name, description, effectiveContext);
      clearPendingUrl();
    },
    [pendingUrl?.context, handleUrlUpload, clearPendingUrl]
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

  // Check if preview dialog should be shown
  const showPreviewDialog =
    pendingFiles !== null && pendingFiles.files.length > 0;

  // Check if URL preview dialog should be shown
  const showUrlPreviewDialog = pendingUrl !== null;

  return {
    uploadState,
    fileInputRef,
    canUpload,
    // File preview flow
    pendingFiles,
    showPreviewDialog,
    stageFilesForUpload,
    confirmFileUpload,
    clearPendingFiles,
    // URL preview flow
    pendingUrl,
    showUrlPreviewDialog,
    stageUrlForUpload,
    confirmUrlUpload,
    clearPendingUrl,
    // File input handlers
    handleFileInputChange,
    openFilePicker,
    // Other upload handlers
    handleUrlUpload,
    handleTitleCardUpload,
    resetState,
  };
}
