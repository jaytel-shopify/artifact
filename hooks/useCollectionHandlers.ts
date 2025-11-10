import { useCallback } from "react";
import { toast } from "sonner";
import type { Artifact } from "@/types";
import {
  getCollectionMetadata,
  getTopLevelArtifacts,
  findParentCollection,
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
        let targetArtifact = artifacts.find((a) => a.id === targetId);

        if (!draggedArtifact || !targetArtifact) {
          toast.error("Could not find artifacts for collection");
          return;
        }

        // If the target is part of a collection, redirect to the parent collection
        const parentCollection = findParentCollection(targetArtifact, artifacts);
        if (parentCollection) {
          targetArtifact = parentCollection;
          targetId = parentCollection.id;
        }

        // Check if dragged item is already in this collection
        const draggedMetadata = getCollectionMetadata(draggedArtifact);
        if (draggedMetadata.parent_collection_id === targetId) {
          toast.error("Item is already in this collection");
          return;
        }

        // Get existing collection items
        const targetMetadata = getCollectionMetadata(targetArtifact);
        const existingItems = targetMetadata.collection_items || [];

        // Add dragged item to collection
        const updatedItems = [...existingItems, draggedId];

        // Update target artifact to be a collection
        await updateArtifact(targetId, {
          metadata: {
            ...targetArtifact.metadata,
            collection_items: updatedItems,
            is_expanded: false,
          },
        });

        // Mark the dragged artifact as part of this collection
        await updateArtifact(draggedId, {
          metadata: {
            ...draggedArtifact.metadata,
            parent_collection_id: targetId,
          },
        });

        toast.success("Items added to collection");
      } catch (error) {
        toast.error("Failed to create collection. Please try again.");
        console.error("Failed to create collection:", error);
      }
    },
    [artifacts, updateArtifact]
  );

  const handleToggleCollection = useCallback(
    async (collectionId: string) => {
      try {
        const collection = artifacts.find((a) => a.id === collectionId);
        if (!collection) return;

        const metadata = getCollectionMetadata(collection);
        const isExpanded = metadata.is_expanded || false;

        // Toggle the expanded state
        await updateArtifact(collectionId, {
          metadata: {
            ...collection.metadata,
            is_expanded: !isExpanded,
          },
        });
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
      newTopLevelIndex: number
    ) => {
      try {
        const collection = artifacts.find((a) => a.id === collectionId);
        const item = artifacts.find((a) => a.id === itemId);

        if (!collection || !item) {
          toast.error("Could not find collection or item");
          return;
        }

        // Remove item from collection's collection_items array
        const collectionMetadata = getCollectionMetadata(collection);
        const collectionItems = collectionMetadata.collection_items || [];
        const updatedItems = collectionItems.filter((id) => id !== itemId);

        // Update collection
        await updateArtifact(collectionId, {
          metadata: {
            ...collection.metadata,
            collection_items: updatedItems,
          },
        });

        // Remove parent_collection_id from item
        await updateArtifact(itemId, {
          metadata: {
            ...item.metadata,
            parent_collection_id: undefined,
          },
        });

        // Reorder top-level artifacts to place the item at the correct position
        const topLevelArtifacts = getTopLevelArtifacts(artifacts);
        const withoutItem = topLevelArtifacts.filter((a) => a.id !== itemId);

        // Insert the item at the new index
        const reorderedTopLevel = [
          ...withoutItem.slice(0, newTopLevelIndex),
          item,
          ...withoutItem.slice(newTopLevelIndex),
        ];

        // Update the order
        await reorderArtifacts(reorderedTopLevel);

        toast.success("Item removed from collection");
      } catch (error) {
        toast.error("Failed to remove item from collection");
        console.error("Failed to remove item from collection:", error);
      }
    },
    [artifacts, updateArtifact, reorderArtifacts]
  );

  const handleReorder = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      try {
        // Separate top-level artifacts from collection items
        const topLevel: Artifact[] = [];
        const collectionItems = new Map<string, string[]>();

        reorderedArtifacts.forEach((artifact) => {
          const metadata = getCollectionMetadata(artifact);
          const parentId = metadata.parent_collection_id;

          if (parentId) {
            if (!collectionItems.has(parentId)) {
              collectionItems.set(parentId, []);
            }
            collectionItems.get(parentId)!.push(artifact.id);
          } else {
            topLevel.push(artifact);
          }
        });

        // Update all collections in parallel
        await Promise.all(
          Array.from(collectionItems.entries()).map(
            ([collectionId, itemIds]) => {
              const collection = artifacts.find((a) => a.id === collectionId);
              return collection
                ? updateArtifact(collectionId, {
                    metadata: {
                      ...collection.metadata,
                      collection_items: itemIds,
                    },
                  })
                : Promise.resolve();
            }
          )
        );

        // Update top-level artifacts order
        await reorderArtifacts(topLevel);
      } catch (error) {
        toast.error("Failed to reorder artifacts. Please try again.");
        console.error("Failed to reorder artifacts:", error);
      }
    },
    [artifacts, updateArtifact, reorderArtifacts]
  );

  return {
    handleCreateCollection,
    handleToggleCollection,
    handleRemoveFromCollection,
    handleReorder,
  };
}

