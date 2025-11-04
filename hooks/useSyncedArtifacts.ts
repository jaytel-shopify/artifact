"use client";

import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getArtifactsByPage,
  createArtifact as createArtifactDB,
  updateArtifact as updateArtifactDB,
  deleteArtifact as deleteArtifactDB,
  reorderArtifacts as reorderArtifactsDB,
  getNextPosition,
} from "@/lib/quick-db";
import {
  ArtifactSyncManager,
  ArtifactSyncEvent,
  ArtifactEventPayload,
} from "@/lib/artifactSync";
import type { Artifact, ArtifactType } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(pageId: string): Promise<Artifact[]> {
  return await getArtifactsByPage(pageId);
}

/**
 * Module-level singleton to prevent duplicate sync managers
 * This persists across React component mounts/unmounts (including Strict Mode)
 * Key is projectId since rooms are per-project, not per-page
 */
const syncManagers = new Map<string, ArtifactSyncManager>();
const initializingProjects = new Set<string>();

/**
 * Hook to manage artifacts with real-time synchronization
 * This hook provides artifact CRUD operations and automatically syncs
 * changes across all connected users via WebSocket
 */
export function useSyncedArtifacts(
  projectId: string | undefined,
  pageId: string | undefined
) {
  const {
    data: artifacts = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Artifact[]>(
    pageId ? `synced-artifacts-${pageId}` : null,
    () => (pageId ? fetcher(pageId) : []),
    {
      revalidateOnFocus: false,
      dedupingInterval: 0, // Allow immediate refetching for real-time sync
      keepPreviousData: true,
    }
  );

  const syncManagerRef = useRef<ArtifactSyncManager | null>(null);
  const [isSyncReady, setIsSyncReady] = useState(false);
  // Store the initial pageId used to create the manager - don't change it when page changes
  const initialPageIdRef = useRef<string | undefined>(undefined);
  // Track the current projectId to detect when it actually changes
  const currentProjectIdRef = useRef<string | undefined>(projectId);
  const projectChanged = currentProjectIdRef.current !== projectId;
  if (projectChanged) {
    currentProjectIdRef.current = projectId;
    initialPageIdRef.current = undefined; // Reset initial page on project change
  }

  // Initialize or reuse sync manager (keyed by projectId, not pageId)
  useEffect(() => {
    if (!projectId || !pageId) return;
    
    // Set the initial pageId only once per project
    if (!initialPageIdRef.current) {
      initialPageIdRef.current = pageId;
    }

    // Check module-level singleton first (prevents React Strict Mode duplication)
    const existingManager = syncManagers.get(projectId);
    if (existingManager) {
      syncManagerRef.current = existingManager;

      // Set initial ready state
      const initialReady = existingManager.isReady();
      setIsSyncReady(initialReady);

      // If not ready yet, listen for connection
      if (!initialReady) {
        const checkReady = setInterval(() => {
          if (existingManager.isReady()) {
            setIsSyncReady(true);
            clearInterval(checkReady);
          }
        }, 100);

        return () => {
          clearInterval(checkReady);
          // Don't clear state here - handled by main cleanup below
        };
      }

      // Already ready, no cleanup needed (handled by main cleanup below)
      return;
    }

    // If currently initializing, wait for it
    if (initializingProjects.has(projectId)) {
      // Poll for the manager to be available
      const checkInterval = setInterval(() => {
        const mgr = syncManagers.get(projectId);
        if (mgr) {
          syncManagerRef.current = mgr;
          setIsSyncReady(mgr.isReady());
          clearInterval(checkInterval);
        }
      }, 50);

      return () => {
        clearInterval(checkInterval);
        // Don't clear state here - handled by main cleanup below
      };
    }

    // Mark as initializing in module-level tracker
    initializingProjects.add(projectId);
    let manager: ArtifactSyncManager | null = null;

    async function initSync() {
      // Guard against undefined (TypeScript doesn't narrow in async function)
      if (!projectId || !initialPageIdRef.current) return;

      manager = new ArtifactSyncManager(projectId, initialPageIdRef.current);
      syncManagerRef.current = manager;
      // Store in module-level singleton (keyed by projectId, not pageId)
      syncManagers.set(projectId, manager);

      const success = await manager.init();
      setIsSyncReady(success);

      // Remove from initializing set now that init is complete
      initializingProjects.delete(projectId);
    }

    initSync().catch((error) => {
      console.error("[useSyncedArtifacts] Failed to initialize sync:", error);
      // Remove from initializing set on error
      initializingProjects.delete(projectId);
    });

    return () => {
      // Only clear state if project is actually changing (not just page changing)
      // This prevents blinking when switching between pages in the same project
      if (currentProjectIdRef.current !== projectId) {
        syncManagerRef.current = null;
        setIsSyncReady(false);
        initializingProjects.delete(projectId);
      }
    };
  }, [projectId, pageId]); // Include pageId to trigger effect when it becomes available, but logic above prevents recreation

  // Set up event handlers for this component instance
  // This runs for EVERY component, whether it creates or reuses a manager
  useEffect(() => {
    const manager = syncManagerRef.current;
    if (!manager || !isSyncReady) return;

    // All sync events trigger a refetch - use a single handler
    const handleSyncEvent = () => mutate(undefined, { revalidate: true });

    // Set up event listeners for remote changes with current mutate closure
    const unsubscribers = [
      manager.on(ArtifactSyncEvent.CREATE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.UPDATE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.DELETE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.REORDER, handleSyncEvent),
      manager.on(ArtifactSyncEvent.REPLACE_MEDIA, handleSyncEvent),
    ];

    // Clean up event handlers on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [pageId, isSyncReady, mutate]);

  /**
   * Create a new artifact and broadcast to other users
   */
  const createArtifact = useCallback(
    async (artifactData: {
      type: ArtifactType;
      source_url: string;
      file_path?: string | null;
      name?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!projectId || !pageId) return null;

      try {
        // Get next available position
        const nextPosition = await getNextPosition(
          "artifacts",
          pageId,
          "page_id"
        );

        // Create the artifact
        const artifact = await createArtifactDB({
          project_id: projectId,
          page_id: pageId,
          type: artifactData.type,
          source_url: artifactData.source_url,
          file_path: artifactData.file_path || undefined,
          name: artifactData.name || "Untitled",
          position: nextPosition,
          metadata: artifactData.metadata || {},
        });

        // Broadcast to other users
        if (syncManagerRef.current?.isReady()) {
          syncManagerRef.current.broadcastCreate(artifact);
        }

        // Update local state
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to create artifact:", error);
        throw error;
      }
    },
    [projectId, pageId, mutate]
  );

  /**
   * Update an artifact and broadcast to other users
   */
  const updateArtifact = useCallback(
    async (
      artifactId: string,
      updates: { name?: string; metadata?: Record<string, unknown> }
    ) => {
      if (!projectId) return null;

      try {
        const artifact = await updateArtifactDB(artifactId, updates);

        // Broadcast to other users
        if (syncManagerRef.current?.isReady()) {
          syncManagerRef.current.broadcastUpdate(artifactId, updates);
        }

        // Update local state
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to update artifact:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  /**
   * Delete an artifact and broadcast to other users
   */
  const deleteArtifact = useCallback(
    async (artifactId: string): Promise<void> => {
      if (!projectId) return;

      try {
        await deleteArtifactDB(artifactId);

        // Broadcast to other users
        if (syncManagerRef.current?.isReady()) {
          syncManagerRef.current.broadcastDelete(artifactId);
        }

        // Update local state
        await mutate();
      } catch (error) {
        console.error("Failed to delete artifact:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  /**
   * Reorder artifacts and broadcast to other users
   */
  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      if (!projectId || !pageId) return;

      // Optimistic update
      mutate(reorderedArtifacts, false);

      try {
        // Update positions in database
        const updates = reorderedArtifacts.map((artifact, index) => ({
          id: artifact.id,
          position: index,
        }));

        await reorderArtifactsDB(updates);

        // Broadcast to other users
        if (syncManagerRef.current?.isReady()) {
          const orderedIds = reorderedArtifacts.map((a) => a.id);
          syncManagerRef.current.broadcastReorder(orderedIds);
        }

        await mutate();
      } catch (error) {
        // Revert on error
        await mutate();
        console.error("Failed to reorder artifacts:", error);
        throw error;
      }
    },
    [projectId, pageId, mutate]
  );

  /**
   * Replace media for an artifact and broadcast to other users
   */
  const replaceMedia = useCallback(
    async (artifactId: string, updates: Partial<Artifact>) => {
      if (!projectId) return null;

      try {
        const artifact = await updateArtifactDB(artifactId, updates);

        // Broadcast to other users
        if (syncManagerRef.current?.isReady()) {
          syncManagerRef.current.broadcastReplaceMedia(artifactId, updates);
        }

        // Update local state
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to replace media:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  return {
    artifacts,
    isLoading,
    error,
    isSyncReady,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    reorderArtifacts,
    replaceMedia,
    refetch: mutate,
    getUsersCount: () => syncManagerRef.current?.getUsersCount() || 0,
    getUsers: () => syncManagerRef.current?.getUsers() || [],
    getRoom: () => syncManagerRef.current?.getRoom() || null,
  };
}
