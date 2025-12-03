"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { uploadFile } from "@/lib/quick-storage";
import {
  createProject,
  createArtifactInProject,
  getProjects,
  getPages,
} from "@/lib/quick-db";
import type { Project, Page } from "@/types";
import type {
  FigmaFrame,
  FigmaToArtifactMessage,
  ArtifactToFigmaMessage,
  ImportState,
  ImportProgress,
} from "@/types/figma-import";

/**
 * Convert a base64 data URL to a File object
 */
function base64ToFile(base64: string, filename: string): File {
  // Handle both raw base64 and data URL formats
  const dataUrlPrefix = "data:image/png;base64,";
  const base64Data = base64.startsWith("data:")
    ? base64.split(",")[1]
    : base64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });
  return new File([blob], `${filename}.png`, { type: "image/png" });
}

export interface UseFigmaImportReturn {
  // State
  state: ImportState;
  frames: FigmaFrame[];
  progress: ImportProgress;
  error: string | null;
  projects: Project[];
  pages: Page[];
  isLoadingProjects: boolean;

  // Actions
  loadProjects: () => Promise<void>;
  loadPages: (projectId: string) => Promise<void>;
  importFrames: (params: {
    projectId: string | null;
    pageId: string | null;
    newProjectName?: string;
  }) => Promise<{ projectId: string; projectName: string } | null>;
  reset: () => void;

  // For testing: manually add frames
  addFramesFromFiles: (files: File[]) => Promise<void>;
}

/**
 * Hook for handling Figma plugin import functionality
 *
 * Manages:
 * - postMessage communication with Figma plugin
 * - Frame data reception and storage
 * - Project/page selection
 * - File upload and artifact creation
 */
export function useFigmaImport(): UseFigmaImportReturn {
  const { user } = useAuth();

  // Import state
  const [state, setState] = useState<ImportState>("waiting");
  const [frames, setFrames] = useState<FigmaFrame[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    completed: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Project/page data
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Track if we're in iframe mode
  const isIframeMode = useRef(false);

  /**
   * Send a message back to the Figma plugin (parent window)
   */
  const sendToFigma = useCallback((message: ArtifactToFigmaMessage) => {
    if (isIframeMode.current && window.parent !== window) {
      window.parent.postMessage(message, "*");
    }
  }, []);

  /**
   * Handle incoming messages from Figma plugin
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate message structure
      const data = event.data as FigmaToArtifactMessage;
      if (!data || typeof data.type !== "string") return;

      console.log("[FigmaImport] Received message:", data.type);

      switch (data.type) {
        case "PING":
          isIframeMode.current = true;
          sendToFigma({ type: "READY" });
          break;

        case "FRAMES_READY":
          if (data.frames && Array.isArray(data.frames)) {
            setFrames(data.frames);
            setState("frames_received");
            console.log(
              "[FigmaImport] Received frames:",
              data.frames.length
            );
          }
          break;
      }
    },
    [sendToFigma]
  );

  // Set up message listener
  useEffect(() => {
    window.addEventListener("message", handleMessage);

    // Send ready message in case we're in an iframe
    if (window.parent !== window) {
      isIframeMode.current = true;
      sendToFigma({ type: "READY" });
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage, sendToFigma]);

  /**
   * Load user's projects
   */
  const loadProjects = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingProjects(true);
    try {
      const userProjects = await getProjects(user.id);
      setProjects(userProjects);
    } catch (err) {
      console.error("[FigmaImport] Failed to load projects:", err);
      setError("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user?.id]);

  /**
   * Load pages for a project
   */
  const loadPages = useCallback(async (projectId: string) => {
    try {
      const projectPages = await getPages(projectId);
      setPages(projectPages);
    } catch (err) {
      console.error("[FigmaImport] Failed to load pages:", err);
      setError("Failed to load pages");
    }
  }, []);

  /**
   * Import frames to a project
   */
  const importFrames = useCallback(
    async (params: {
      projectId: string | null;
      pageId: string | null;
      newProjectName?: string;
    }): Promise<{ projectId: string; projectName: string } | null> => {
      if (!user?.id) {
        setError("You must be logged in to import");
        return null;
      }

      if (frames.length === 0) {
        setError("No frames to import");
        return null;
      }

      let targetProjectId = params.projectId;
      let targetPageId = params.pageId;
      let projectName = "";

      setState("importing");
      setProgress({ completed: 0, total: frames.length });
      sendToFigma({ type: "IMPORT_STARTED", frameCount: frames.length });

      try {
        // Create new project if needed
        if (!targetProjectId && params.newProjectName) {
          const newProject = await createProject({
            name: params.newProjectName,
            creator_id: user.id,
          });
          targetProjectId = newProject.id;
          projectName = newProject.name;

          // Get the default page created with the project
          const projectPages = await getPages(newProject.id);
          if (projectPages.length > 0) {
            targetPageId = projectPages[0].id;
          }
        } else if (targetProjectId) {
          // Find project name for existing project
          const project = projects.find((p) => p.id === targetProjectId);
          projectName = project?.name || "Untitled Project";
        }

        if (!targetProjectId || !targetPageId) {
          throw new Error("No project or page selected");
        }

        // Import each frame
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];

          setProgress({
            completed: i,
            total: frames.length,
            currentFrameName: frame.name,
          });

          sendToFigma({
            type: "IMPORT_PROGRESS",
            completed: i,
            total: frames.length,
            currentFrameName: frame.name,
          });

          // Convert base64 to File
          const file = base64ToFile(frame.imageData, frame.name);

          // Upload to Quick.fs
          const uploadResult = await uploadFile(file);

          // Create artifact
          await createArtifactInProject({
            project_id: targetProjectId,
            page_id: targetPageId,
            type: "image",
            source_url: uploadResult.fullUrl,
            file_path: uploadResult.url,
            name: frame.name,
            creator_id: user.id,
            metadata: {
              width: frame.width,
              height: frame.height,
              figma_frame_id: frame.id,
            },
          });
        }

        // Complete
        setProgress({
          completed: frames.length,
          total: frames.length,
        });

        setState("complete");

        sendToFigma({
          type: "IMPORT_COMPLETE",
          projectId: targetProjectId,
          projectName,
          artifactCount: frames.length,
        });

        return { projectId: targetProjectId, projectName };
      } catch (err) {
        console.error("[FigmaImport] Import failed:", err);
        const message =
          err instanceof Error ? err.message : "Import failed";
        setError(message);
        setState("error");
        sendToFigma({ type: "IMPORT_ERROR", message });
        return null;
      }
    },
    [user?.id, frames, projects, sendToFigma]
  );

  /**
   * Add frames from local files (for testing without Figma)
   */
  const addFramesFromFiles = useCallback(async (files: File[]) => {
    const newFrames: FigmaFrame[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      // Read file as base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Get dimensions
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(file);
        }
      );

      newFrames.push({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        imageData: base64,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    if (newFrames.length > 0) {
      setFrames((prev) => [...prev, ...newFrames]);
      setState("frames_received");
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState("waiting");
    setFrames([]);
    setProgress({ completed: 0, total: 0 });
    setError(null);
  }, []);

  return {
    state,
    frames,
    progress,
    error,
    projects,
    pages,
    isLoadingProjects,
    loadProjects,
    loadPages,
    importFrames,
    reset,
    addFramesFromFiles,
  };
}

