import { useCallback } from "react";
import type { KeyedMutator } from "swr";
import type { ArtifactWithPosition, ArtifactType, Artifact } from "@/types";
import {
  createArtifactInProject,
  getNextArtifactPosition,
} from "@/lib/quick-db";
import {
  UpdateArtifactCommand,
  DeleteArtifactCommand,
  ReorderArtifactsCommand,
  ToggleLikeCommand,
  ToggleDislikeCommand,
} from "@/lib/artifact-commands";
import { useAuth } from "@/components/auth/AuthProvider";

interface UseArtifactMutationsProps {
  artifacts: ArtifactWithPosition[];
  mutate: KeyedMutator<ArtifactWithPosition[]>;
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
  const { user } = useAuth();

  const createArtifact = useCallback(
    async (artifactData: {
      type: ArtifactType;
      source_url: string;
      file_path?: string | null;
      name?: string;
      metadata?: Record<string, unknown>;
      published?: boolean;
    }) => {
      if (!projectId || !pageId || !user?.email) return null;

      try {
        const { artifact, projectArtifact } = await createArtifactInProject({
          project_id: projectId,
          page_id: pageId,
          type: artifactData.type,
          source_url: artifactData.source_url,
          file_path: artifactData.file_path || undefined,
          name: artifactData.name || "Untitled",
          creator_id: user.email,
          metadata: artifactData.metadata || {},
          published: artifactData.published || false,
        });

        // Return artifact with position context
        const artifactWithPosition: ArtifactWithPosition = {
          ...artifact,
          position: projectArtifact.position,
          project_artifact_id: projectArtifact.id,
        };

        return artifactWithPosition;
      } catch (error) {
        console.error("Failed to create artifact:", error);
        throw error;
      }
    },
    [projectId, pageId, user?.email]
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
      if (!projectId || !user?.email) return;

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
    [projectId, user?.email, mutate, artifacts]
  );

  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: ArtifactWithPosition[]) => {
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

  const toggleLike = useCallback(
    async (artifactId: string, userId: string) => {
      try {
        const command = new ToggleLikeCommand(artifactId, userId, artifacts);

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to toggle like:", error);
        mutate();
      }
    },
    [artifacts, mutate]
  );

  const toggleDislike = useCallback(
    async (artifactId: string, userId: string) => {
      try {
        const command = new ToggleDislikeCommand(artifactId, userId, artifacts);

        mutate(command.getOptimisticState(), { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error("Failed to toggle dislike:", error);
        mutate();
      }
    },
    [artifacts, mutate]
  );

  return {
    createArtifact,
    updateArtifact,
    deleteArtifact,
    reorderArtifacts,
    replaceMedia,
    toggleLike,
    toggleDislike,
  };
}
