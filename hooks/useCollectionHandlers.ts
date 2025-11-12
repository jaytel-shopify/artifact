import { useCallback } from "react";
import { toast } from "sonner";
import type { Artifact } from "@/types";
import {
  getCollectionMetadata,
  getCollectionArtifacts,
} from "@/lib/collection-utils";

interface UseCollectionHandlersProps {
  artifacts: Artifact[];
  updateArtifact: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  reorderArtifacts: (artifacts: Artifact[]) => Promise<void>;
}

export function useCollectionHandlers({
  artifacts,
  updateArtifact,
  reorderArtifacts,
}: UseCollectionHandlersProps) {
  const handleCreateCollection = useCallback(
    async (draggedId: string, targetId: string) => {
      try {
        const draggedArtifact = artifacts.find((a) => a.id === draggedId);
        const targetArtifact = artifacts.find((a) => a.id === targetId);

        if (!draggedArtifact || !targetArtifact) {
          toast.error("Could not find artifacts for collection");
          return;
        }

        const draggedMetadata = getCollectionMetadata(draggedArtifact);
        const targetMetadata = getCollectionMetadata(targetArtifact);

        // Check if dragged item is already in this collection
        if (draggedMetadata.collection_id && 
            draggedMetadata.collection_id === targetMetadata.collection_id) {
          toast.error("Item is already in this collection");
          return;
        }

        // Determine the collection ID to use
        let collectionId: string;
        if (targetMetadata.collection_id) {
          // Target is already in a collection - add to that collection
          collectionId = targetMetadata.collection_id;
        } else {
          // Create new collection - use a simple timestamp-based ID
          collectionId = `collection-${Date.now()}`;
          
          // Add target to the collection
          await updateArtifact(targetId, {
            metadata: {
              ...targetArtifact.metadata,
              collection_id: collectionId,
              is_expanded: false,
            },
          });
        }

        // Add dragged item to the collection
        await updateArtifact(draggedId, {
          metadata: {
            ...draggedArtifact.metadata,
            collection_id: collectionId,
          },
        });

        // Ensure target comes BEFORE dragged in the artifacts array
        // Target should be index 0 (the "cover" of the collection)
        const draggedIndex = artifacts.findIndex((a) => a.id === draggedId);
        const targetIndex = artifacts.findIndex((a) => a.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex < targetIndex) {
          // Dragged is currently before target, need to reorder
          // Remove dragged from its position and insert it after target
          const reordered = [...artifacts];
          const [removed] = reordered.splice(draggedIndex, 1);
          const newTargetIndex = reordered.findIndex((a) => a.id === targetId);
          reordered.splice(newTargetIndex + 1, 0, removed);
          
          await reorderArtifacts(reordered);
        }

        toast.success("Items added to collection");
      } catch (error) {
        toast.error("Failed to create collection. Please try again.");
        console.error("Failed to create collection:", error);
      }
    },
    [artifacts, updateArtifact, reorderArtifacts]
  );

  const handleToggleCollection = useCallback(
    async (artifactId: string) => {
      try {
        const artifact = artifacts.find((a) => a.id === artifactId);
        if (!artifact) return;

        const metadata = getCollectionMetadata(artifact);
        const collectionId = metadata.collection_id;
        
        if (!collectionId) return;

        // Get all items in this collection
        const collectionArtifacts = getCollectionArtifacts(collectionId, artifacts);
        if (collectionArtifacts.length === 0) return;

        // Get current expanded state from first item
        const firstMeta = getCollectionMetadata(collectionArtifacts[0]);
        const isExpanded = firstMeta.is_expanded || false;

        // Toggle expanded state on ALL items in the collection
        // (though only the first item's state matters for display)
        await Promise.all(
          collectionArtifacts.map((item) =>
            updateArtifact(item.id, {
              metadata: {
                ...item.metadata,
                is_expanded: !isExpanded,
              },
            })
          )
        );
      } catch (error) {
        toast.error("Failed to toggle collection");
        console.error("Failed to toggle collection:", error);
      }
    },
    [artifacts, updateArtifact]
  );

  const handleRemoveFromCollection = useCallback(
    async (
      itemId: string,
      collectionId: string,
      _newIndex: number // Not used - order is determined by artifacts array position
    ) => {
      try {
        const item = artifacts.find((a) => a.id === itemId);

        if (!item) {
          toast.error("Could not find item");
          return;
        }

        // Simply remove collection_id from the item
        const newMetadata = { ...item.metadata };
        delete newMetadata.collection_id;
        delete newMetadata.is_expanded;

        await updateArtifact(itemId, {
          metadata: newMetadata,
        });

        toast.success("Item removed from collection");
      } catch (error) {
        toast.error("Failed to remove item from collection");
        console.error("Failed to remove item from collection:", error);
      }
    },
    [artifacts, updateArtifact]
  );

  const handleReorder = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      try {
        // With the new structure, the visual order IS the data order!
        // Just reorder the artifacts array
        await reorderArtifacts(reorderedArtifacts);
      } catch (error) {
        toast.error("Failed to reorder artifacts. Please try again.");
        console.error("Failed to reorder artifacts:", error);
      }
    },
    [reorderArtifacts]
  );

  return {
    handleCreateCollection,
    handleToggleCollection,
    handleRemoveFromCollection,
    handleReorder,
  };
}

