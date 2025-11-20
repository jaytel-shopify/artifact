import { useCallback } from "react";
import type { KeyedMutator } from "swr";
import type { Artifact, ArtifactType } from "@/types";
import {
  createArtifact as createArtifactDB,
  getAllFoldersArtifacts,
} from "@/lib/quick/db-new";
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
        // Calculate next position from junction table
        const foldersArtifacts = await getAllFoldersArtifacts();
        const pageArtifacts = foldersArtifacts.filter(
          (fa) => fa.folder_id === pageId
        );
        const maxPosition = pageArtifacts.reduce(
          (max, fa) => Math.max(max, fa.position || 0),
          -1
        );
        const nextPosition = maxPosition + 1;

        // Map old schema to new schema with content object
        const url = artifactData.file_path || artifactData.source_url;
        const metadata = artifactData.metadata || {};
        
        const content: any = { url };
        
        // Map metadata fields to content based on artifact type
        if (artifactData.type === "url") {
          content.viewport = metadata.viewport;
          content.width = metadata.width;
          content.height = metadata.height;
        } else if (artifactData.type === "video") {
          content.thumbnail_url = metadata.thumbnail_url;
        } else if (artifactData.type === "image") {
          content.width = metadata.width;
          content.height = metadata.height;
        } else if (artifactData.type === "titleCard") {
          content.headline = metadata.headline;
          content.subheadline = metadata.subheadline;
        }

        const artifact = await createArtifactDB({
          type: artifactData.type,
          title: artifactData.name || "Untitled",
          content,
          folder_id: pageId,
          position: nextPosition,
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
