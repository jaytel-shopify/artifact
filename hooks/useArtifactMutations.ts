import { useCallback } from "react";
import type { KeyedMutator } from "swr";
import type { Artifact, ArtifactType } from "@/types";
import {
  createArtifact as createArtifactDB,
  getNextPosition,
} from "@/lib/quick-db";
import {
  UpdateArtifactCommand,
  DeleteArtifactCommand,
  ReorderArtifactsCommand,
} from "@/lib/artifact-commands";

interface UseArtifactMutationsProps {
  artifacts: Artifact[];
  mutate: KeyedMutator<Artifact[]>;
  projectId?: string;
  pageId?: string;
}

// Hook for artifact CRUD operations using Command Pattern
export function useArtifactMutations({
  artifacts,
  mutate,
  projectId,
  pageId,
}: UseArtifactMutationsProps) {
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
        const nextPosition = await getNextPosition(
          "artifacts",
          pageId,
          "page_id"
        );

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

        return artifact;
      } catch (error) {
        console.error("Failed to create artifact:", error);
        throw error;
      }
    },
    [projectId, pageId]
  );

  const updateArtifact = useCallback(
    async (
      artifactId: string,
      updates: { name?: string; metadata?: Record<string, unknown> }
    ) => {
      if (!projectId) return null;

      try {
        const command = new UpdateArtifactCommand(
          artifactId,
          updates,
          artifacts
        );

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to update artifact:", error);
        mutate();
      }
    },
    [projectId, artifacts, mutate]
  );

  const deleteArtifact = useCallback(
    async (artifactId: string): Promise<void> => {
      if (!projectId) return;

      try {
        const command = new DeleteArtifactCommand(artifactId, artifacts);

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to delete artifact:", error);
        mutate();
        throw error;
      }
    },
    [projectId, mutate, artifacts]
  );

  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      if (!projectId || !pageId) return;

      try {
        const command = new ReorderArtifactsCommand(
          reorderedArtifacts,
          artifacts
        );

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to reorder artifacts:", error);
        mutate();
      }
    },
    [projectId, pageId, mutate, artifacts]
  );

  const replaceMedia = useCallback(
    async (artifactId: string, updates: Partial<Artifact>) => {
      if (!projectId) return null;

      try {
        const command = new UpdateArtifactCommand(
          artifactId,
          updates,
          artifacts
        );

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to replace media:", error);
        mutate();
      }
    },
    [projectId, artifacts, mutate]
  );

  return {
    createArtifact,
    updateArtifact,
    deleteArtifact,
    reorderArtifacts,
    replaceMedia,
  };
}

