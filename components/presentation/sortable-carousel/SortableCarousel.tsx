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

const dropAnimation: DropAnimation = {
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
    const containerRef = useRef<HTMLUListElement>(null);

    // Collection mode logic
    const {
      isCollectionMode,
      hoveredItemId,
      handleCollectionDragStart,
      handleCollectionDragMove,
      handleCollectionDragEnd,
    } = useCollectionMode({
      activeId,
      onCreateCollection,
    });

    // Expose the containerRef to parent via forwardedRef
    useImperativeHandle(forwardedRef, () => containerRef.current!);
    const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined
    );
    const [items, setItems] = useState<Artifact[]>(artifacts);
    const prevPageIdRef = useRef(pageId);

    // Filter and reorder artifacts for display in carousel
    // When a collection is expanded, show its items right after the collection header
    // Use useMemo to prevent infinite loops in useEffect
    const visibleArtifacts = useMemo(() => {
      const result: Artifact[] = [];

      artifacts.forEach((artifact) => {
        const metadata = artifact.metadata as {
          parent_collection_id?: string;
          collection_items?: string[];
          is_expanded?: boolean;
        };

        // Skip items that belong to a collection (they'll be added by their parent collection)
        if (metadata?.parent_collection_id) {
          return; // Never add these directly
        }

        // Add the artifact to results (it's either a regular item or a collection header)
        result.push(artifact);

        // If this is an expanded collection, insert its items right after it
        if (metadata?.collection_items && metadata?.is_expanded) {
          const collectionItems = metadata.collection_items
            .map((itemId) => artifacts.find((a) => a.id === itemId))
            .filter((a): a is Artifact => a !== undefined);

          result.push(...collectionItems);
        }
      });

      return result;
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
        // Check if items were added (not removed) AND page didn't change
        const itemsAdded =
          visibleArtifacts.length >
          prevArtifactsRef.current.filter((a) => {
            const metadata = a.metadata as { parent_collection_id?: string };
            return !metadata?.parent_collection_id;
          }).length;
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
      const orderChanged = visibleArtifacts.some((artifact, idx) => {
        const prevVisible = prevArtifactsRef.current.filter((a) => {
          const metadata = a.metadata as { parent_collection_id?: string };
          return !metadata?.parent_collection_id;
        });
        const prevArtifact = prevVisible[idx];
        return !prevArtifact || prevArtifact.id !== artifact.id;
      });

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
        // If order changed, use the new order from visibleArtifacts
        // If only properties changed, preserve current order
        if (orderChanged) {
          setItems(visibleArtifacts);
        } else {
          // Update items while preserving order
          // Use functional update to access current items without dependency
          setItems((currentItems) => {
            const orderMap = new Map(
              currentItems.map((item, idx) => [item.id, idx])
            );
            return visibleArtifacts.slice().sort((a, b) => {
              const aIdx = orderMap.get(a.id) ?? 0;
              const bIdx = orderMap.get(b.id) ?? 0;
              return aIdx - bIdx;
            });
          });
        }
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
      handleCollectionDragStart(); // Resets collection state
    }, [handleCollectionDragStart]);

    const handleDragEnd = useCallback(
      async ({ over }: DragEndEvent) => {
        if (!over) {
          setActiveId(null);
          return;
        }

        const overIndex = itemIds.indexOf(over.id.toString());

        // Check if we're in collection mode - if so, try to create collection
        if (isCollectionMode && over.id !== activeId) {
          const collectionCreated = await handleCollectionDragEnd(over.id);
          if (collectionCreated) {
            setActiveId(null);
            return;
          }
        } else {
          // Not in collection mode - just reset state synchronously
          handleCollectionDragEnd(over.id);
        }

        // Reorder mode - normal reordering
        if (activeIndex !== overIndex && activeIndex !== -1) {
          // Set settling to block parent updates during animation
          setIsSettling(true);
          setSettlingId(activeId); // Track which item is settling

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
        }

        setActiveId(null);
      },
      [
        itemIds,
        activeIndex,
        activeId,
        items,
        onReorder,
        isCollectionMode,
        handleCollectionDragEnd,
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
            {items.map((artifact, index) => (
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
                        await onUpdateArtifact(artifact.id, { name: newTitle })
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
            ))}
          </ul>
        </SortableContext>
        <DragOverlay dropAnimation={dropAnimation}>
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

function always() {
  return true;
}
