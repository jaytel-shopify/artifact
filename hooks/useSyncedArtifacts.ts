"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import { getArtifactsByPage } from "@/lib/quick-db";
import { ArtifactSyncManager, ArtifactSyncEvent } from "@/lib/artifactSync";
import type { Artifact } from "@/types";
import { waitForQuick } from "@/lib/quick";
import { useArtifactMutations } from "./useArtifactMutations";

async function fetcher(pageId: string): Promise<Artifact[]> {
  return await getArtifactsByPage(pageId);
}

// Module-level singletons to prevent duplicate sync managers (keyed by projectId)
const syncManagers = new Map<string, ArtifactSyncManager>();
const initializingProjects = new Set<string>();

// Hook for artifact data fetching, real-time sync, and CRUD operations
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
  const initialPageIdRef = useRef<string | undefined>(undefined);
  const currentProjectIdRef = useRef<string | undefined>(projectId);
  const projectChanged = currentProjectIdRef.current !== projectId;
  if (projectChanged) {
    currentProjectIdRef.current = projectId;
    initialPageIdRef.current = undefined;
  }

  // Initialize or reuse sync manager
  useEffect(() => {
    if (!projectId) return;

    const existingManager = syncManagers.get(projectId);
    if (existingManager) {
      syncManagerRef.current = existingManager;
      existingManager.ensureConnected().then((connected) => {
        setIsSyncReady(connected);
      });
      if (!pageId) return;
      return;
    }

    if (!pageId) return;

    if (!initialPageIdRef.current) {
      initialPageIdRef.current = pageId;
    }

    if (initializingProjects.has(projectId)) {
      const checkInterval = setInterval(() => {
        const mgr = syncManagers.get(projectId);
        if (mgr) {
          syncManagerRef.current = mgr;
          setIsSyncReady(mgr.isReady());
          clearInterval(checkInterval);
        }
      }, 50);

      return () => clearInterval(checkInterval);
    }

    initializingProjects.add(projectId);
    let manager: ArtifactSyncManager | null = null;

    async function initSync() {
      if (!projectId || !initialPageIdRef.current) return;

      manager = new ArtifactSyncManager(projectId, initialPageIdRef.current);
      syncManagerRef.current = manager;
      syncManagers.set(projectId, manager);

      const success = await manager.init();
      setIsSyncReady(success);
      initializingProjects.delete(projectId);
    }

    initSync().catch((error) => {
      console.error("[useSyncedArtifacts] Failed to initialize sync:", error);
      initializingProjects.delete(projectId);
    });

    return () => {
      syncManagerRef.current = null;
      if (currentProjectIdRef.current !== projectId) {
        setIsSyncReady(false);
        initializingProjects.delete(projectId);
      }
    };
  }, [projectId, pageId]);

  // Set up WebSocket event handlers
  useEffect(() => {
    const manager = syncManagerRef.current;
    if (!manager || !isSyncReady) return;

    const handleSyncEvent = () => mutate(undefined, { revalidate: true });

    const unsubscribers = [
      manager.on(ArtifactSyncEvent.CREATE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.UPDATE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.DELETE, handleSyncEvent),
      manager.on(ArtifactSyncEvent.REORDER, handleSyncEvent),
      manager.on(ArtifactSyncEvent.REPLACE_MEDIA, handleSyncEvent),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [pageId, isSyncReady, mutate]);

  // Subscribe to quick.db for cross-tab/multi-user sync
  useEffect(() => {
    if (!pageId) return;

    const setupSubscription = async () => {
      try {
        const quick = await waitForQuick();
        const artifactsCollection = quick.db.collection("artifacts");

        const unsubscribe = artifactsCollection.subscribe({
          onCreate: (doc) => {
            if (doc.page_id === pageId) mutate();
          },
          onUpdate: (doc) => {
            if (doc.page_id === pageId) mutate();
          },
          onDelete: () => mutate(),
        });

        return unsubscribe;
      } catch (error) {
        console.error(
          "[useSyncedArtifacts] Failed to setup quick.db subscription:",
          error
        );
      }
    };

    let unsubscribeFn: (() => void) | undefined;
    setupSubscription().then((fn) => {
      unsubscribeFn = fn;
    });

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  }, [pageId, mutate]);

  const mutations = useArtifactMutations({
    artifacts,
    mutate,
    projectId,
    pageId,
  });

  return {
    artifacts,
    isLoading,
    error,
    isSyncReady,
    ...mutations,
    refetch: mutate,
    getUsersCount: () => syncManagerRef.current?.getUsersCount() || 0,
    getUsers: () => syncManagerRef.current?.getUsers() || [],
    getRoom: () => syncManagerRef.current?.getRoom() || null,
  };
}
