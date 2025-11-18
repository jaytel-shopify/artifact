"use client";

import useSWR from "swr";
import { useEffect, useRef, useState, useMemo } from "react";
import { getArtifactsByPage } from "@/lib/quick-db";
import { PresenceManager } from "@/lib/presence-manager";
import type { Artifact } from "@/types";
import { waitForQuick } from "@/lib/quick";
import { useArtifactMutations } from "./useArtifactMutations";
import { debounce } from "@/lib/utils";

async function fetcher(pageId: string): Promise<Artifact[]> {
  return await getArtifactsByPage(pageId);
}

// Module-level singletons to prevent duplicate presence managers (keyed by projectId)
const presenceManagers = new Map<string, PresenceManager>();
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

  const presenceManagerRef = useRef<PresenceManager | null>(null);
  const [isPresenceReady, setIsPresenceReady] = useState(false);
  const initialPageIdRef = useRef<string | undefined>(undefined);
  const currentProjectIdRef = useRef<string | undefined>(projectId);
  const projectChanged = currentProjectIdRef.current !== projectId;
  if (projectChanged) {
    currentProjectIdRef.current = projectId;
    initialPageIdRef.current = undefined;
  }

  // Initialize or reuse presence manager
  useEffect(() => {
    if (!projectId) return;

    const existingManager = presenceManagers.get(projectId);
    if (existingManager) {
      presenceManagerRef.current = existingManager;
      existingManager.ensureConnected().then((connected) => {
        setIsPresenceReady(connected);
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
        const mgr = presenceManagers.get(projectId);
        if (mgr) {
          presenceManagerRef.current = mgr;
          setIsPresenceReady(mgr.isReady());
          clearInterval(checkInterval);
        }
      }, 50);

      return () => clearInterval(checkInterval);
    }

    initializingProjects.add(projectId);
    let manager: PresenceManager | null = null;

    async function initPresence() {
      if (!projectId || !initialPageIdRef.current) return;

      manager = new PresenceManager(projectId, initialPageIdRef.current);
      presenceManagerRef.current = manager;
      presenceManagers.set(projectId, manager);

      const success = await manager.init();
      setIsPresenceReady(success);
      initializingProjects.delete(projectId);
    }

    initPresence().catch((error) => {
      console.error(
        "[useSyncedArtifacts] Failed to initialize presence:",
        error
      );
      initializingProjects.delete(projectId);
    });

    return () => {
      presenceManagerRef.current = null;
      if (currentProjectIdRef.current !== projectId) {
        setIsPresenceReady(false);
        initializingProjects.delete(projectId);
      }
    };
  }, [projectId, pageId]);

  // Subscribe to quick.db for CRUD sync
  const debouncedMutate = useMemo(
    () => debounce(() => mutate(), 100),
    [mutate]
  );

  useEffect(() => {
    if (!pageId) return;

    const setupSubscription = async () => {
      try {
        const quick = await waitForQuick();
        const artifactsCollection = quick.db.collection("artifacts");

        const unsubscribe = artifactsCollection.subscribe({
          onCreate: (doc) => {
            if (doc.page_id === pageId) debouncedMutate();
          },
          onUpdate: (doc) => {
            if (doc.page_id === pageId) debouncedMutate();
          },
          onDelete: () => debouncedMutate(),
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
  }, [pageId, debouncedMutate]);

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
    isPresenceReady,
    ...mutations,
    refetch: mutate,
    getUsersCount: () => presenceManagerRef.current?.getUsersCount() || 0,
    getUsers: () => presenceManagerRef.current?.getUsers() || [],
    getRoom: () => presenceManagerRef.current?.getRoom() || null,
  };
}
