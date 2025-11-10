import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDndContext,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimationSideEffects,
  DragMoveEvent,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragEndEvent,
  MeasuringConfiguration,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS, isKeyboardEvent } from "@dnd-kit/utilities";
import type { Artifact } from "@/types";

import { CarouselItem, Layout, Position } from "./CarouselItem";
import type { Props as CarouselItemProps } from "./CarouselItem";
import { useCollectionMode } from "./useCollectionMode";
import {
  getCollectionMetadata,
  isCollectionChild,
} from "@/lib/collection-utils";
import "./sortable-carousel.css";

type VideoMetadata = { hideUI?: boolean; loop?: boolean; muted?: boolean };

interface Props {
  layout: Layout;
  columns?: number;
  fitMode?: boolean;
  artifacts: Artifact[];
  onReorder?: (artifacts: Artifact[]) => void;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  onToggleCollection?: (collectionId: string) => Promise<void>;
  onRemoveFromCollection?: (
    itemId: string,
    collectionId: string,
    newTopLevelIndex: number
  ) => Promise<void>;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  onDeleteArtifact?: (artifactId: string) => Promise<void>;
  onReplaceMedia?: (artifactId: string, file: File) => Promise<void>;
  onEditTitleCard?: (artifactId: string) => void;
  onFocusArtifact?: (artifactId: string) => void;
  focusedArtifactId?: string | null;
  isReadOnly?: boolean;
  pageId?: string; // Track page changes to prevent auto-scroll on page switch
}

const measuring: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const defaultDropAnimation: DropAnimation = {
  keyframes({ transform }) {
    return [
      { transform: CSS.Transform.toString(transform.initial) },
      {
        transform: CSS.Transform.toString(transform.final),
      },
    ];
  },
  sideEffects: defaultDropAnimationSideEffects({
    className: {
      active: "carousel-item-active",
    },
  }),
};

const collectionDropAnimation: DropAnimation = {
  duration: 300,
  keyframes({ transform }) {
    return [
      {
        transform: CSS.Transform.toString(transform.initial),
        opacity: "1",
      },
      {
        transform: `${CSS.Transform.toString(transform.initial)} scale(0.8)`,
        opacity: "0",
      },
    ];
  },
  sideEffects: defaultDropAnimationSideEffects({
    className: {
      active: "carousel-item-active",
    },
  }),
};

export const SortableCarousel = forwardRef<HTMLUListElement, Props>(
  function SortableCarousel(
    {
      layout,
      columns = 3,
      fitMode = false,
      artifacts,
      onReorder,
      onCreateCollection,
      onToggleCollection,
      onRemoveFromCollection,
      onUpdateArtifact,
      onDeleteArtifact,
      onReplaceMedia,
      onEditTitleCard,
      onFocusArtifact,
      focusedArtifactId,
      isReadOnly = false,
      pageId,
    },
    forwardedRef
  ) {
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [isSettling, setIsSettling] = useState(false);
    const [settlingId, setSettlingId] = useState<UniqueIdentifier | null>(null);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [itemBeingAddedToCollection, setItemBeingAddedToCollection] =
      useState<UniqueIdentifier | null>(null);
    const containerRef = useRef<HTMLUListElement>(null);

    // Collection mode logic
    const {
      isCollectionMode,
      hoveredItemId,
      handleCollectionDragStart,
      handleCollectionDragMove,
      handleCollectionDragEnd,
      resetCollectionState,
    } = useCollectionMode({
      activeId,
      onCreateCollection,
      artifacts,
    });

    // Expose the containerRef to parent via forwardedRef
    useImperativeHandle(forwardedRef, () => containerRef.current!);
    const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined
    );
    const [items, setItems] = useState<Artifact[]>(artifacts);
    const prevPageIdRef = useRef(pageId);
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
      new Set()
    );
    const prevExpandedRef = useRef<Set<string>>(new Set());

    // Filter and reorder artifacts for display in carousel
    // When a collection is expanded, show its items right after the collection header
    const visibleArtifacts = useMemo(() => {
      const result: Artifact[] = [];

      artifacts.forEach((artifact) => {
        // Skip items that belong to a collection (they'll be added by their parent collection)
        if (isCollectionChild(artifact)) return;

        // Add the artifact to results (it's either a regular item or a collection header)
        result.push(artifact);

        // If this is an expanded collection, insert its items right after it
        const metadata = getCollectionMetadata(artifact);
        if (metadata.collection_items && metadata.is_expanded) {
          const collectionItems = metadata.collection_items
            .map((itemId) => artifacts.find((a) => a.id === itemId))
            .filter((a): a is Artifact => a !== undefined);

          result.push(...collectionItems);
        }
      });

      return result;
    }, [artifacts]);

    // Separate array for hidden collection items (rendered outside sortable context)
    // These stay mounted to preserve video state but don't participate in DnD
    const hiddenCollectionItems = useMemo(() => {
      return artifacts.filter((artifact) => {
        if (!isCollectionChild(artifact)) return false;

        const metadata = getCollectionMetadata(artifact);
        const parent = artifacts.find(
          (a) => a.id === metadata.parent_collection_id
        );

        if (!parent) return false;

        const parentMetadata = getCollectionMetadata(parent);
        const isExpanded = parentMetadata.is_expanded || false;

        // Only include if parent is collapsed
        return !isExpanded;
      });
    }, [artifacts]);

    // Track newly expanded collections for animation
    useEffect(() => {
      const currentExpanded = new Set(
        artifacts
          .filter((a) => {
            const metadata = getCollectionMetadata(a);
            return metadata.collection_items && metadata.is_expanded;
          })
          .map((a) => a.id)
      );

      // Find newly expanded collections
      const newlyExpanded = Array.from(currentExpanded).filter(
        (id) => !prevExpandedRef.current.has(id)
      );

      if (newlyExpanded.length > 0) {
        setExpandedCollections(new Set(newlyExpanded));
        const timer = setTimeout(() => setExpandedCollections(new Set()), 400);
        prevExpandedRef.current = currentExpanded;
        return () => clearTimeout(timer);
      }

      prevExpandedRef.current = currentExpanded;
    }, [artifacts]);

    // Sync artifacts with local state (respecting animation state)
    const prevArtifactsRef = useRef(artifacts);
    useEffect(() => {
      // Block sync during animation - critical for smooth animation!
      if (isSettling) return;

      const prevIds = prevArtifactsRef.current
        .map((a) => a.id)
        .sort()
        .join(",");
      const newIds = visibleArtifacts
        .map((a) => a.id)
        .sort()
        .join(",");

      // Sync if items added/removed
      if (prevIds !== newIds) {
        // Compare top-level artifacts only (not collection children)
        const prevTopLevel = prevArtifactsRef.current.filter((a) => {
          const metadata = a.metadata as { parent_collection_id?: string };
          return !metadata?.parent_collection_id;
        });
        const currentTopLevel = artifacts.filter((a) => {
          const metadata = a.metadata as { parent_collection_id?: string };
          return !metadata?.parent_collection_id;
        });

        // Check if items were added (not removed) AND page didn't change
        const itemsAdded = currentTopLevel.length > prevTopLevel.length;
        const pageChanged = prevPageIdRef.current !== pageId;

        setItems(visibleArtifacts);
        prevArtifactsRef.current = artifacts;
        prevPageIdRef.current = pageId;

        // Scroll to end if items were added AND page didn't change
        // (don't auto-scroll when switching pages)
        if (itemsAdded && !pageChanged && containerRef.current) {
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                left: containerRef.current.scrollWidth,
                behavior: "smooth",
              });
            }
          }, 100);
        }
        return;
      }

      // Check if order changed OR properties changed
      // Only check top-level order changes (not collection children reordering)
      const prevTopLevelOrder = prevArtifactsRef.current
        .filter((a) => {
          const metadata = a.metadata as { parent_collection_id?: string };
          return !metadata?.parent_collection_id;
        })
        .map((a) => a.id)
        .join(",");
      const currentTopLevelOrder = artifacts
        .filter((a) => {
          const metadata = a.metadata as { parent_collection_id?: string };
          return !metadata?.parent_collection_id;
        })
        .map((a) => a.id)
        .join(",");
      const orderChanged = prevTopLevelOrder !== currentTopLevelOrder;

      const itemsChanged = visibleArtifacts.some((newArtifact) => {
        const prevArtifact = prevArtifactsRef.current.find(
          (a) => a.id === newArtifact.id
        );
        if (!prevArtifact) return true;

        // Check if name or metadata changed
        return (
          newArtifact.name !== prevArtifact.name ||
          JSON.stringify(newArtifact.metadata) !==
            JSON.stringify(prevArtifact.metadata)
        );
      });

      if (orderChanged || itemsChanged) {
        // Top-level order changed or properties changed - update items
        setItems(visibleArtifacts);
      }

      prevArtifactsRef.current = artifacts;
    }, [artifacts, isSettling, pageId, visibleArtifacts]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollLeft = container.scrollLeft;
    }, [columns, pageId]);

    const itemIds = items.map((artifact) => artifact.id);
    const activeIndex =
      activeId != null ? itemIds.indexOf(activeId.toString()) : -1;
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8, // Require 8px of movement before dragging starts
        },
        // Only activate on left mouse button (button 0), ignore right-click
        button: 0,
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const totalPaddingRem = 2;
    const totalGapRem = 1 * (columns - 1); // 1rem gap from CSS
    const totalSpacingRem = totalPaddingRem + totalGapRem;
    const columnWidth = `calc((100vw - ${totalSpacingRem}rem) / ${columns})`;

    // Fit mode is ONLY enabled when columns is 1
    // Regardless of fitMode prop, it's disabled for multi-column layouts
    const isFitMode = columns === 1 ? fitMode : false;

    const handleDragStart = useCallback(
      ({ active }: DragStartEvent) => {
        setActiveId(active.id);
        handleCollectionDragStart();
      },
      [handleCollectionDragStart]
    );

    const handleDragMove = useCallback(
      (event: DragMoveEvent) => {
        handleCollectionDragMove(event);
      },
      [handleCollectionDragMove]
    );

    const handleDragCancel = useCallback(() => {
      setActiveId(null);
      setItemBeingAddedToCollection(null);
      handleCollectionDragStart(); // Resets collection state
    }, [handleCollectionDragStart]);

    // Helper: Handle adding item to collection (collection mode)
    const handleAddToCollection = useCallback(
      async (overId: UniqueIdentifier) => {
        setIsCreatingCollection(true);
        setItemBeingAddedToCollection(activeId);
        setActiveId(null);

        // Wait for the drop animation to complete before updating data
        setTimeout(async () => {
          await handleCollectionDragEnd(overId);
          setIsCreatingCollection(false);
          // Clear after a brief delay to ensure DB update has propagated
          setTimeout(() => {
            setItemBeingAddedToCollection(null);
          }, 100);
        }, 300); // Match collectionDropAnimation duration
      },
      [activeId, handleCollectionDragEnd]
    );

    // Helper: Calculate top-level index after removing from collection
    const calculateTopLevelIndex = useCallback(
      (reorderedItems: Artifact[], targetIndex: number) => {
        let topLevelIndex = 0;
        for (let i = 0; i < Math.min(targetIndex, reorderedItems.length); i++) {
          // Only count top-level items (not collection children)
          if (
            !isCollectionChild(reorderedItems[i]) ||
            reorderedItems[i].id === activeId?.toString()
          ) {
            topLevelIndex++;
          }
        }
        return topLevelIndex;
      },
      [activeId]
    );

    // Helper: Handle removing item from collection and placing it elsewhere
    const handleRemoveFromCollectionDrag = useCallback(
      (
        parentCollectionId: string,
        overIndex: number,
        activeIndex: number
      ): boolean => {
        // Find the collection header in the visible items
        const collectionHeaderIndex = items.findIndex(
          (item) => item.id === parentCollectionId
        );

        if (collectionHeaderIndex === -1) return false;

        const collectionHeader = items[collectionHeaderIndex];
        const collectionMetadata = getCollectionMetadata(collectionHeader);

        // Only check bounds if collection is expanded
        if (!collectionMetadata.is_expanded) return false;

        const collectionItems = collectionMetadata.collection_items || [];
        // Collection bounds in the visible array
        const collectionStartIndex = collectionHeaderIndex + 1;
        const collectionEndIndex =
          collectionHeaderIndex + collectionItems.length;

        // Check if drop position is outside collection bounds
        const isOutsideBounds =
          overIndex < collectionStartIndex || overIndex > collectionEndIndex;

        if (isOutsideBounds) {
          // Reset collection mode state to clear any hover indicators
          resetCollectionState();

          setIsSettling(true);
          setSettlingId(activeId);

          // Update local state immediately for smooth animation
          const reorderedItems = arrayMove(items, activeIndex, overIndex);
          setItems(reorderedItems);

          // Calculate the target top-level index
          const topLevelIndex = calculateTopLevelIndex(
            reorderedItems,
            overIndex
          );

          // Delay updating backend until after animation
          if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
          settleTimeoutRef.current = setTimeout(async () => {
            await onRemoveFromCollection?.(
              activeId!.toString(),
              parentCollectionId,
              topLevelIndex
            );
            setIsSettling(false);
            setSettlingId(null);
          }, 250);

          setActiveId(null);
          return true; // Handled
        }

        return false; // Not handled
      },
      [
        items,
        activeId,
        resetCollectionState,
        calculateTopLevelIndex,
        onRemoveFromCollection,
      ]
    );

    // Helper: Handle normal reordering (not collection-related)
    const handleNormalReorder = useCallback(
      (overIndex: number, activeIndex: number) => {
        if (activeIndex === overIndex || activeIndex === -1) return;

        // Set settling to block parent updates during animation
        setIsSettling(true);
        setSettlingId(activeId);

        // Update local state immediately for smooth animation
        const reorderedItems = arrayMove(items, activeIndex, overIndex);
        setItems(reorderedItems);

        // Delay notifying parent until AFTER animation completes
        if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = setTimeout(() => {
          onReorder?.(reorderedItems);
          setIsSettling(false);
          setSettlingId(null);
        }, 250); // Match dnd-kit's default animation duration
      },
      [activeId, items, onReorder]
    );

    const handleDragEnd = useCallback(
      async ({ over }: DragEndEvent) => {
        if (!over) {
          setActiveId(null);
          setItemBeingAddedToCollection(null);
          return;
        }

        const overIndex = itemIds.indexOf(over.id.toString());

        // 1. Handle collection mode (adding to collection)
        if (isCollectionMode && over.id !== activeId) {
          await handleAddToCollection(over.id);
          return;
        } else {
          // Not in collection mode - reset state
          handleCollectionDragEnd(over.id);
        }

        // 2. Handle removing from collection (dragging outside bounds)
        if (activeId && activeIndex !== -1 && overIndex !== -1) {
          const activeArtifact = items[activeIndex];
          const activeMetadata = getCollectionMetadata(activeArtifact);
          const parentCollectionId = activeMetadata.parent_collection_id;

          if (parentCollectionId && onRemoveFromCollection) {
            const handled = handleRemoveFromCollectionDrag(
              parentCollectionId,
              overIndex,
              activeIndex
            );
            if (handled) return;
          }
        }

        // 3. Handle normal reordering
        handleNormalReorder(overIndex, activeIndex);
        setActiveId(null);
      },
      [
        itemIds,
        activeIndex,
        activeId,
        items,
        isCollectionMode,
        handleCollectionDragEnd,
        onRemoveFromCollection,
        handleAddToCollection,
        handleRemoveFromCollectionDrag,
        handleNormalReorder,
      ]
    );

    if (items.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-white/60">
          No artifacts yet. Add one to get started.
        </div>
      );
    }

    return (
      <DndContext
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={measuring}
      >
        <SortableContext
          items={itemIds}
          strategy={horizontalListSortingStrategy}
        >
          <ul
            ref={containerRef}
            className={`carousel carousel-${layout} ${isSettling ? "settling" : ""} ${isFitMode ? "fit-mode" : ""} ${columns === 1 ? "single-column" : ""} ${isCollectionMode ? "collection-mode" : ""}`}
          >
            {items.map((artifact, index) => {
              // Check if this item belongs to a newly expanded collection
              const artifactMetadata = getCollectionMetadata(artifact);
              const isJustExpanded = artifactMetadata.parent_collection_id
                ? expandedCollections.has(artifactMetadata.parent_collection_id)
                : false;

              return (
                <SortableCarouselItem
                  id={artifact.id}
                  index={index + 1}
                  key={artifact.id}
                  layout={layout}
                  activeIndex={activeIndex}
                  contentUrl={artifact.source_url}
                  contentType={
                    artifact.type as "image" | "video" | "url" | "titleCard"
                  }
                  width={artifact.metadata?.width as number}
                  height={artifact.metadata?.height as number}
                  name={artifact.name}
                  metadata={artifact.metadata as VideoMetadata}
                  columnWidth={columnWidth}
                  isAnyDragging={activeId !== null}
                  isSettling={settlingId === artifact.id}
                  isReadOnly={isReadOnly}
                  fitMode={isFitMode}
                  isCollectionMode={isCollectionMode}
                  isHoveredForCollection={hoveredItemId === artifact.id}
                  isBeingAddedToCollection={
                    itemBeingAddedToCollection === artifact.id
                  }
                  isJustExpanded={isJustExpanded}
                  allArtifacts={artifacts}
                  onToggleCollection={onToggleCollection}
                  onDelete={
                    onDeleteArtifact
                      ? async () => await onDeleteArtifact(artifact.id)
                      : undefined
                  }
                  onUpdateMetadata={
                    onUpdateArtifact
                      ? async (updates) =>
                          await onUpdateArtifact(artifact.id, {
                            metadata: { ...artifact.metadata, ...updates },
                          })
                      : undefined
                  }
                  onUpdateTitle={
                    onUpdateArtifact
                      ? async (newTitle) =>
                          await onUpdateArtifact(artifact.id, {
                            name: newTitle,
                          })
                      : undefined
                  }
                  onReplaceMedia={
                    onReplaceMedia
                      ? async (file) => await onReplaceMedia(artifact.id, file)
                      : undefined
                  }
                  onEdit={
                    onEditTitleCard && artifact.type === "titleCard"
                      ? () => onEditTitleCard(artifact.id)
                      : undefined
                  }
                  onFocus={
                    onFocusArtifact
                      ? () => onFocusArtifact(artifact.id)
                      : undefined
                  }
                  isFocused={focusedArtifactId === artifact.id}
                />
              );
            })}
            {/* Render hidden collection items outside sortable context to preserve state */}
            {hiddenCollectionItems.map((artifact) => (
              <HiddenCarouselItem
                id={artifact.id}
                key={`hidden-${artifact.id}`}
                layout={layout}
                contentUrl={artifact.source_url}
                contentType={
                  artifact.type as "image" | "video" | "url" | "titleCard"
                }
                width={artifact.metadata?.width as number}
                height={artifact.metadata?.height as number}
                name={artifact.name}
                metadata={artifact.metadata as VideoMetadata}
                columnWidth={columnWidth}
              />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay
          dropAnimation={
            isCreatingCollection
              ? collectionDropAnimation
              : defaultDropAnimation
          }
        >
          {activeId != null ? (
            <CarouselItemOverlay
              id={activeId}
              layout={layout}
              items={items}
              allArtifacts={artifacts}
              isCollectionMode={isCollectionMode}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }
);

function CarouselItemOverlay({
  id,
  items,
  allArtifacts,
  isCollectionMode = false,
  ...props
}: Omit<CarouselItemProps, "index"> & {
  items: Artifact[];
  allArtifacts?: Artifact[];
  isCollectionMode?: boolean;
}) {
  const { activatorEvent, over } = useDndContext();
  const isKeyboardSorting = isKeyboardEvent(activatorEvent);
  const itemIds = items.map((a) => a.id);
  const activeIndex = itemIds.indexOf(id.toString());
  const overIndex = over?.id ? itemIds.indexOf(over.id.toString()) : -1;
  const artifact = items.find((a) => a.id === id.toString());

  if (!artifact) return null;

  return (
    <CarouselItem
      id={id}
      contentUrl={artifact.source_url}
      contentType={artifact.type as "image" | "video" | "url" | "titleCard"}
      width={artifact.metadata?.width as number}
      height={artifact.metadata?.height as number}
      name={artifact.name}
      metadata={artifact.metadata as VideoMetadata}
      allArtifacts={allArtifacts}
      {...props}
      clone
      isCollectionMode={isCollectionMode}
      insertPosition={
        isKeyboardSorting && overIndex !== activeIndex && !isCollectionMode
          ? overIndex > activeIndex
            ? Position.After
            : Position.Before
          : undefined
      }
    />
  );
}

function SortableCarouselItem({
  id,
  activeIndex,
  columnWidth,
  isAnyDragging,
  isSettling,
  fitMode,
  isCollectionMode,
  isHoveredForCollection,
  isBeingAddedToCollection,
  isJustExpanded,
  allArtifacts,
  onToggleCollection,
  ...props
}: CarouselItemProps & {
  activeIndex: number;
  columnWidth?: string;
  isAnyDragging?: boolean;
  isSettling?: boolean;
  fitMode?: boolean;
  isCollectionMode?: boolean;
  isHoveredForCollection?: boolean;
  isBeingAddedToCollection?: boolean;
  isJustExpanded?: boolean;
  allArtifacts?: Artifact[];
  onToggleCollection?: (collectionId: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    index,
    isDragging,
    isSorting,
    over,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({
    id,
    animateLayoutChanges: always,
  });

  return (
    <CarouselItem
      ref={setNodeRef}
      id={id}
      active={isDragging}
      isAnyDragging={isAnyDragging}
      isSettling={isSettling}
      fitMode={fitMode}
      isCollectionMode={isCollectionMode}
      isHoveredForCollection={isHoveredForCollection}
      isBeingAddedToCollection={isBeingAddedToCollection}
      isJustExpanded={isJustExpanded}
      allArtifacts={allArtifacts}
      onToggleCollection={onToggleCollection}
      style={{
        transition,
        transform: isSorting ? undefined : CSS.Translate.toString(transform),
        // @ts-expect-error - CSS custom property
        "--column-width": columnWidth,
      }}
      insertPosition={
        over?.id === id && !isCollectionMode
          ? index > activeIndex
            ? Position.After
            : Position.Before
          : undefined
      }
      {...props}
      {...attributes}
      dragHandleProps={{
        ref: setActivatorNodeRef,
        ...listeners,
      }}
    />
  );
}

// Hidden carousel item - renders outside sortable context to preserve state
// Used for collapsed collection items so videos don't reload when expanded
function HiddenCarouselItem({
  id,
  layout,
  contentUrl,
  contentType,
  width,
  height,
  name,
  metadata,
  columnWidth,
}: {
  id: UniqueIdentifier;
  layout: Layout;
  contentUrl?: string;
  contentType: "image" | "video" | "url" | "titleCard";
  width?: number;
  height?: number;
  name?: string;
  metadata?: VideoMetadata;
  columnWidth?: string;
}) {
  return (
    <CarouselItem
      id={id}
      layout={layout}
      contentUrl={contentUrl}
      contentType={contentType}
      width={width}
      height={height}
      name={name}
      metadata={metadata}
      isReadOnly={true}
      shouldHide={true}
      style={{
        // @ts-expect-error - CSS custom property
        "--column-width": columnWidth,
      }}
    />
  );
}

function always() {
  return true;
}
