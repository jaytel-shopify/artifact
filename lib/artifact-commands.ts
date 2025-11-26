// Command Pattern for artifact operations
// Each command calculates optimistic state, executes DB writes, and can revert on error

import type { ArtifactWithPosition } from "@/types";
import {
  updateArtifact as updateArtifactDB,
  removeArtifactFromProject,
  reorderProjectArtifacts,
} from "@/lib/quick-db";
import { getCollectionCleanupIfNeeded } from "@/lib/collection-utils";

export interface ArtifactCommand {
  getOptimisticState(): ArtifactWithPosition[];
  execute(): Promise<void>;
  getPreviousState(): ArtifactWithPosition[];
}

// Base class to reduce boilerplate
abstract class BaseCommand implements ArtifactCommand {
  constructor(protected currentArtifacts: ArtifactWithPosition[]) {}

  abstract getOptimisticState(): ArtifactWithPosition[];
  abstract execute(): Promise<void>;

  getPreviousState(): ArtifactWithPosition[] {
    return this.currentArtifacts;
  }
}

// Helper: Remove collection metadata from artifact
function removeCollectionMetadata(
  metadata: Record<string, any>
): Record<string, any> {
  const cleaned = { ...metadata };
  delete cleaned.collection_id;
  return cleaned;
}

// Helper: Reorder array by moving item from one index to another
function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

// Helper: Build position updates for DB (using project_artifact_id)
function buildPositionUpdates(artifacts: ArtifactWithPosition[]) {
  return artifacts.map((artifact, index) => ({
    id: artifact.project_artifact_id,
    position: index,
  }));
}

export class ReorderArtifactsCommand extends BaseCommand {
  constructor(
    private reorderedArtifacts: ArtifactWithPosition[],
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.reorderedArtifacts;
  }

  async execute(): Promise<void> {
    await reorderProjectArtifacts(buildPositionUpdates(this.reorderedArtifacts));
  }
}

export class AddToCollectionCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];
  private collectionId: string;
  private draggedArtifact: ArtifactWithPosition;
  private targetArtifact: ArtifactWithPosition;
  private needsReorder: boolean;

  constructor(
    private draggedId: string,
    private targetId: string,
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);

    this.draggedArtifact = currentArtifacts.find((a) => a.id === draggedId)!;
    this.targetArtifact = currentArtifacts.find((a) => a.id === targetId)!;

    if (!this.draggedArtifact || !this.targetArtifact) {
      throw new Error("Could not find artifacts for collection");
    }

    const targetMetadata = this.targetArtifact.metadata as any;
    this.collectionId =
      targetMetadata?.collection_id || `collection-${Date.now()}`;

    const draggedIndex = currentArtifacts.findIndex((a) => a.id === draggedId);
    const targetIndex = currentArtifacts.findIndex((a) => a.id === targetId);
    this.needsReorder = draggedIndex !== targetIndex + 1;

    this.optimisticState = this.calculateOptimisticState();
  }

  private calculateOptimisticState(): ArtifactWithPosition[] {
    const targetMetadata = this.targetArtifact.metadata as any;
    const isNewCollection = !targetMetadata?.collection_id;

    let result = this.currentArtifacts.map((a) => {
      if (a.id === this.targetId && isNewCollection) {
        return {
          ...a,
          metadata: {
            ...a.metadata,
            collection_id: this.collectionId,
          },
        };
      }
      if (a.id === this.draggedId) {
        return {
          ...a,
          metadata: { ...a.metadata, collection_id: this.collectionId },
        };
      }
      return a;
    });

    if (this.needsReorder) {
      const draggedIndex = result.findIndex((a) => a.id === this.draggedId);
      const targetIndex = result.findIndex((a) => a.id === this.targetId);
      result = reorderArray(result, draggedIndex, targetIndex + 1);
    }

    return result;
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const targetMetadata = this.targetArtifact.metadata as any;
    const metadataUpdates: Promise<any>[] = [];

    if (!targetMetadata?.collection_id) {
      metadataUpdates.push(
        updateArtifactDB(this.targetId, {
          metadata: {
            ...this.targetArtifact.metadata,
            collection_id: this.collectionId,
          },
        })
      );
    }

    metadataUpdates.push(
      updateArtifactDB(this.draggedId, {
        metadata: {
          ...this.draggedArtifact.metadata,
          collection_id: this.collectionId,
        },
      })
    );

    await Promise.all(metadataUpdates);

    if (this.needsReorder) {
      await reorderProjectArtifacts(buildPositionUpdates(this.optimisticState));
    }
  }
}

export class RemoveFromCollectionCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];

  constructor(
    private artifactId: string,
    private newPosition: number,
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);
    this.optimisticState = this.calculateOptimisticState();
  }

  private calculateOptimisticState(): ArtifactWithPosition[] {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    );
    if (!artifact) throw new Error("Artifact not found");

    const metadata = artifact.metadata as any;
    const collectionId = metadata?.collection_id;
    if (!collectionId) return this.currentArtifacts;

    // Find cleanup artifact if needed
    const collectionArtifacts = this.currentArtifacts.filter(
      (a) => (a.metadata as any)?.collection_id === collectionId
    );
    const cleanupArtifactId =
      collectionArtifacts.length === 2
        ? collectionArtifacts.find((a) => a.id !== this.artifactId)?.id
        : null;

    // Remove collection metadata
    let result = this.currentArtifacts.map((a) => {
      if (a.id === this.artifactId || a.id === cleanupArtifactId) {
        return { ...a, metadata: removeCollectionMetadata(a.metadata as any) };
      }
      return a;
    });

    // Reorder to new position
    const currentIndex = result.findIndex((a) => a.id === this.artifactId);
    if (currentIndex !== this.newPosition) {
      result = reorderArray(result, currentIndex, this.newPosition);
    }

    return result;
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    )!;
    const metadata = artifact.metadata as any;
    const collectionId = metadata?.collection_id;

    const collectionArtifacts = this.currentArtifacts.filter(
      (a) => (a.metadata as any)?.collection_id === collectionId
    );
    const cleanupArtifactId =
      collectionArtifacts.length === 2
        ? collectionArtifacts.find((a) => a.id !== this.artifactId)?.id
        : null;

    // Update metadata
    await updateArtifactDB(this.artifactId, {
      metadata: removeCollectionMetadata(metadata),
    });

    if (cleanupArtifactId) {
      const cleanupArtifact = this.currentArtifacts.find(
        (a) => a.id === cleanupArtifactId
      )!;
      await updateArtifactDB(cleanupArtifactId, {
        metadata: removeCollectionMetadata(cleanupArtifact.metadata as any),
      });
    }

    // Update positions
    await reorderProjectArtifacts(buildPositionUpdates(this.optimisticState));
  }
}

export class UpdateArtifactCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];

  constructor(
    private artifactId: string,
    private updates: { name?: string; metadata?: Record<string, unknown> },
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);

    this.optimisticState = currentArtifacts.map((a) =>
      a.id === artifactId
        ? {
            ...a,
            ...(updates.name && { name: updates.name }),
            ...(updates.metadata && {
              metadata: { ...a.metadata, ...updates.metadata },
            }),
          }
        : a
    );
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    await updateArtifactDB(this.artifactId, this.updates);
  }
}

export class DeleteArtifactCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];
  private cleanup: {
    artifactId: string;
    metadata: Record<string, unknown>;
  } | null;
  private projectArtifactId: string;

  constructor(
    private artifactId: string,
    private currentUserEmail: string,
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);

    const artifactToDelete = currentArtifacts.find((a) => a.id === artifactId);
    if (!artifactToDelete) {
      throw new Error("Artifact not found");
    }

    this.projectArtifactId = artifactToDelete.project_artifact_id;
    this.cleanup = getCollectionCleanupIfNeeded(artifactToDelete, currentArtifacts);

    this.optimisticState = currentArtifacts
      .filter((a) => a.id !== artifactId)
      .map((a) =>
        a.id === this.cleanup?.artifactId && this.cleanup.metadata
          ? { ...a, metadata: this.cleanup.metadata }
          : a
      );
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    if (this.cleanup) {
      await updateArtifactDB(this.cleanup.artifactId, {
        metadata: this.cleanup.metadata,
      });
    }
    // Use removeArtifactFromProject which handles cascade logic
    await removeArtifactFromProject(this.projectArtifactId, this.currentUserEmail);
  }
}

export class ToggleLikeCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];

  constructor(
    private artifactId: string,
    private userId: string,
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);

    this.optimisticState = currentArtifacts.map((a) => {
      if (a.id === artifactId) {
        const currentReactions = a.reactions || { like: [], dislike: [] };
        const likeArray = currentReactions.like || [];
        const hasLiked = likeArray.includes(userId);

        return {
          ...a,
          reactions: {
            ...currentReactions,
            like: hasLiked
              ? likeArray.filter((id) => id !== userId)
              : [...likeArray, userId],
          },
        };
      }
      return a;
    });
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    );

    if (artifact) {
      const currentReactions = artifact.reactions || { like: [], dislike: [] };
      const likeArray = currentReactions.like || [];
      const hasLiked = likeArray.includes(this.userId);

      await updateArtifactDB(this.artifactId, {
        reactions: {
          ...currentReactions,
          like: hasLiked
            ? likeArray.filter((id) => id !== this.userId)
            : [...likeArray, this.userId],
        },
      });
    }
  }
}

export class ToggleDislikeCommand extends BaseCommand {
  private optimisticState: ArtifactWithPosition[];

  constructor(
    private artifactId: string,
    private userId: string,
    currentArtifacts: ArtifactWithPosition[]
  ) {
    super(currentArtifacts);

    this.optimisticState = currentArtifacts.map((a) => {
      if (a.id === artifactId) {
        const currentReactions = a.reactions || { like: [], dislike: [] };
        const dislikeArray = currentReactions.dislike || [];
        const hasDisliked = dislikeArray.includes(userId);

        return {
          ...a,
          reactions: {
            ...currentReactions,
            dislike: hasDisliked
              ? dislikeArray.filter((id) => id !== userId)
              : [...dislikeArray, userId],
          },
        };
      }
      return a;
    });
  }

  getOptimisticState(): ArtifactWithPosition[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    );
    if (artifact) {
      const currentReactions = artifact.reactions || { like: [], dislike: [] };
      const dislikeArray = currentReactions.dislike || [];
      const hasDisliked = dislikeArray.includes(this.userId);

      await updateArtifactDB(this.artifactId, {
        reactions: {
          ...currentReactions,
          dislike: hasDisliked
            ? dislikeArray.filter((id) => id !== this.userId)
            : [...dislikeArray, this.userId],
        },
      });
    }
  }
}
