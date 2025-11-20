// Command Pattern for artifact operations
// Each command calculates optimistic state, executes DB writes, and can revert on error

import type { Artifact } from "@/types";
import {
  updateArtifact as updateArtifactDB,
  deleteArtifact as deleteArtifactDB,
} from "@/lib/quick/db-new";
import { getCollectionCleanupIfNeeded } from "@/lib/collection-utils";
import { waitForQuick } from "@/lib/quick";

export interface ArtifactCommand {
  getOptimisticState(): Artifact[];
  execute(): Promise<void>;
  getPreviousState(): Artifact[];
}

// Base class to reduce boilerplate
abstract class BaseCommand implements ArtifactCommand {
  constructor(protected currentArtifacts: Artifact[]) {}

  abstract getOptimisticState(): Artifact[];
  abstract execute(): Promise<void>;

  getPreviousState(): Artifact[] {
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

// Helper: Build position updates for junction table
async function updateJunctionTablePositions(
  artifacts: Artifact[]
): Promise<void> {
  const quick = await waitForQuick();
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");

  // Update each artifact's position in the junction table
  await Promise.all(
    artifacts.map(async (artifact, index) => {
      // Find the junction record for this artifact
      const allRecords = await foldersArtifactsCollection.find();
      const record = allRecords.find((r: any) => r.artifact_id === artifact.id);
      if (record) {
        await foldersArtifactsCollection.update(record.id, { position: index });
      }
    })
  );
}

export class ReorderArtifactsCommand extends BaseCommand {
  constructor(
    private reorderedArtifacts: Artifact[],
    currentArtifacts: Artifact[]
  ) {
    super(currentArtifacts);
  }

  getOptimisticState(): Artifact[] {
    return this.reorderedArtifacts;
  }

  async execute(): Promise<void> {
    await updateJunctionTablePositions(this.reorderedArtifacts);
  }
}

export class AddToCollectionCommand extends BaseCommand {
  private optimisticState: Artifact[];
  private collectionId: string;
  private draggedArtifact: Artifact;
  private targetArtifact: Artifact;
  private needsReorder: boolean;

  constructor(
    private draggedId: string,
    private targetId: string,
    currentArtifacts: Artifact[]
  ) {
    super(currentArtifacts);

    this.draggedArtifact = currentArtifacts.find((a) => a.id === draggedId)!;
    this.targetArtifact = currentArtifacts.find((a) => a.id === targetId)!;

    if (!this.draggedArtifact || !this.targetArtifact) {
      throw new Error("Could not find artifacts for collection");
    }

    const targetMetadata = this.targetArtifact.content as any;
    this.collectionId =
      targetMetadata?.collection_id || `collection-${Date.now()}`;

    const draggedIndex = currentArtifacts.findIndex((a) => a.id === draggedId);
    const targetIndex = currentArtifacts.findIndex((a) => a.id === targetId);
    this.needsReorder = draggedIndex !== targetIndex + 1;

    this.optimisticState = this.calculateOptimisticState();
  }

  private calculateOptimisticState(): Artifact[] {
    const targetMetadata = this.targetArtifact.content as any;
    const isNewCollection = !targetMetadata?.collection_id;

    let result = this.currentArtifacts.map((a) => {
      if (a.id === this.targetId && isNewCollection) {
        return {
          ...a,
          content: {
            ...a.content,
            collection_id: this.collectionId,
          },
        };
      }
      if (a.id === this.draggedId) {
        return {
          ...a,
          content: { ...a.content, collection_id: this.collectionId },
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

  getOptimisticState(): Artifact[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const targetMetadata = this.targetArtifact.content as any;
    const metadataUpdates: Promise<any>[] = [];

    if (!targetMetadata?.collection_id) {
      metadataUpdates.push(
        updateArtifactDB(this.targetId, {
          content: {
            ...this.targetArtifact.content,
            collection_id: this.collectionId,
          },
        })
      );
    }

    metadataUpdates.push(
      updateArtifactDB(this.draggedId, {
        content: {
          ...this.draggedArtifact.content,
          collection_id: this.collectionId,
        },
      })
    );

    await Promise.all(metadataUpdates);

    if (this.needsReorder) {
      await updateJunctionTablePositions(this.optimisticState);
    }
  }
}

export class RemoveFromCollectionCommand extends BaseCommand {
  private optimisticState: Artifact[];

  constructor(
    private artifactId: string,
    private newPosition: number,
    currentArtifacts: Artifact[]
  ) {
    super(currentArtifacts);
    this.optimisticState = this.calculateOptimisticState();
  }

  private calculateOptimisticState(): Artifact[] {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    );
    if (!artifact) throw new Error("Artifact not found");

    const metadata = artifact.content as any;
    const collectionId = metadata?.collection_id;
    if (!collectionId) return this.currentArtifacts;

    // Find cleanup artifact if needed
    const collectionArtifacts = this.currentArtifacts.filter(
      (a) => (a.content as any)?.collection_id === collectionId
    );
    const cleanupArtifactId =
      collectionArtifacts.length === 2
        ? collectionArtifacts.find((a) => a.id !== this.artifactId)?.id
        : null;

    // Remove collection metadata
    let result = this.currentArtifacts.map((a) => {
      if (a.id === this.artifactId || a.id === cleanupArtifactId) {
        return { ...a, content: removeCollectionMetadata(a.content as any) };
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

  getOptimisticState(): Artifact[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    const artifact = this.currentArtifacts.find(
      (a) => a.id === this.artifactId
    )!;
    const metadata = artifact.content as any;
    const collectionId = metadata?.collection_id;

    const collectionArtifacts = this.currentArtifacts.filter(
      (a) => (a.content as any)?.collection_id === collectionId
    );
    const cleanupArtifactId =
      collectionArtifacts.length === 2
        ? collectionArtifacts.find((a) => a.id !== this.artifactId)?.id
        : null;

    // Update metadata
    await updateArtifactDB(this.artifactId, {
      content: removeCollectionMetadata(metadata),
    });

    if (cleanupArtifactId) {
      const cleanupArtifact = this.currentArtifacts.find(
        (a) => a.id === cleanupArtifactId
      )!;
      await updateArtifactDB(cleanupArtifactId, {
        content: removeCollectionMetadata(cleanupArtifact.content as any),
      });
    }

    // Update positions
    await updateJunctionTablePositions(this.optimisticState);
  }
}

export class UpdateArtifactCommand extends BaseCommand {
  private optimisticState: Artifact[];

  constructor(
    private artifactId: string,
    private updates: { title?: string; content?: Record<string, unknown> },
    currentArtifacts: Artifact[]
  ) {
    super(currentArtifacts);

    this.optimisticState = currentArtifacts.map((a) =>
      a.id === artifactId
        ? {
            ...a,
            ...(updates.title && { title: updates.title }),
            ...(updates.content && {
              content: { ...a.content, ...updates.content },
            }),
          }
        : a
    );
  }

  getOptimisticState(): Artifact[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    await updateArtifactDB(this.artifactId, this.updates);
  }
}

export class DeleteArtifactCommand extends BaseCommand {
  private optimisticState: Artifact[];
  private cleanup: {
    artifactId: string;
    content: Record<string, unknown>;
  } | null;

  constructor(
    private artifactId: string,
    currentArtifacts: Artifact[]
  ) {
    super(currentArtifacts);

    const artifactToDelete = currentArtifacts.find((a) => a.id === artifactId);
    this.cleanup = artifactToDelete
      ? getCollectionCleanupIfNeeded(artifactToDelete, currentArtifacts)
      : null;

    this.optimisticState = currentArtifacts
      .filter((a) => a.id !== artifactId)
      .map((a) =>
        a.id === this.cleanup?.artifactId && this.cleanup.content
          ? { ...a, content: this.cleanup.content }
          : a
      );
  }

  getOptimisticState(): Artifact[] {
    return this.optimisticState;
  }

  async execute(): Promise<void> {
    if (this.cleanup) {
      await updateArtifactDB(this.cleanup.artifactId, {
        content: this.cleanup.content,
      });
    }
    await deleteArtifactDB(this.artifactId);
  }
}
