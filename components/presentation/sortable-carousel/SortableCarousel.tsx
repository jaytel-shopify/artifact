import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
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
import { useCarouselItems } from "./useCarouselItems";
import { useDragHandlers } from "./useDragHandlers";
import { getCollectionMetadata } from "@/lib/collection-utils";

type VideoMetadata = { hideUI?: boolean; loop?: boolean; muted?: boolean };

interface Props {
  layout: Layout;
  columns?: number;
  fitMode?: boolean;
  artifacts: Artifact[];
  expandedCollections?: Set<string>;
  onReorder?: (artifacts: Artifact[]) => void;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  onRemoveFromCollection?: (artifactId: string, newPosition: number) => Promise<void>;
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
  pageId?: string;
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
      expandedCollections,
      onReorder,
      onCreateCollection,
      onRemoveFromCollection,
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
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [itemBeingAddedToCollection, setItemBeingAddedToCollection] =
      useState<UniqueIdentifier | null>(null);
    const containerRef = useRef<HTMLUListElement | null>(null);

    // Callback ref to assign to both local ref and forwarded ref
    const setContainerRef = useCallback(
      (node: HTMLUListElement | null) => {
        containerRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    // Custom hooks for organized logic
    const {
      items,
      setItems,
      hiddenCollectionItems,
      expandedCollections: justExpandedCollections,
      prevArtifactsRef,
    } = useCarouselItems({
      artifacts,
      expandedCollections,
      isSettling,
      pageId,
      containerRef,
    });

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

    const {
      handleRemoveFromCollectionDrag,
      handleAddToExpandedCollection,
      handleNormalReorder,
    } = useDragHandlers({
      items,
      artifacts,
      expandedCollections,
      activeId,
      onUpdateArtifact,
      onReorder,
      onRemoveFromCollection,
      resetCollectionState,
      setItems,
      setIsSettling,
      setSettlingId,
      setActiveId,
      prevArtifactsRef,
    });

    // Maintain scroll position on column change
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
          distance: 8,
        },
        button: 0,
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const totalPaddingRem = 2;
    const totalGapRem = 1 * (columns - 1);
    const totalSpacingRem = totalPaddingRem + totalGapRem;
    const columnWidth = `calc((100vw - ${totalSpacingRem}rem) / ${columns})`;

    // Fit mode is ONLY enabled when columns is 1
    const isFitMode = columns === 1 ? fitMode : false;

    // Drag event handlers
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
      handleCollectionDragStart();
    }, [handleCollectionDragStart]);

    const handleAddToCollection = useCallback(
      async (overId: UniqueIdentifier) => {
        setIsCreatingCollection(true);
        setItemBeingAddedToCollection(activeId);
        setIsSettling(true); // Block prop updates during animation
        setSettlingId(activeId);
        setActiveId(null);

        setTimeout(async () => {
          await handleCollectionDragEnd(overId);
          setIsCreatingCollection(false);
          setIsSettling(false); // Re-enable prop updates after animation
          setSettlingId(null);
          setTimeout(() => {
            setItemBeingAddedToCollection(null);
          }, 100);
        }, 300);
      },
      [activeId, handleCollectionDragEnd]
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
          handleCollectionDragEnd(over.id);
        }

        // 2. Handle removing from collection (dragging outside bounds)
        if (activeId && activeIndex !== -1 && overIndex !== -1) {
          const activeArtifact = items[activeIndex];
          const activeMetadata = getCollectionMetadata(activeArtifact);
          const collectionId = activeMetadata.collection_id;

          if (collectionId) {
            const handled = handleRemoveFromCollectionDrag(
              collectionId,
              overIndex,
              activeIndex
            );
            if (handled) return;
          }
        }

        // 3. Handle adding to expanded collection
        if (handleAddToExpandedCollection(overIndex, activeIndex)) {
          return;
        }

        // 4. Handle normal reordering
        handleNormalReorder(overIndex, activeIndex);

        resetCollectionState();
        setActiveId(null);
      },
      [
        itemIds,
        activeIndex,
        activeId,
        items,
        isCollectionMode,
        handleCollectionDragEnd,
        handleAddToCollection,
        handleRemoveFromCollectionDrag,
        handleAddToExpandedCollection,
        handleNormalReorder,
        resetCollectionState,
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
            ref={setContainerRef}
            className={`carousel carousel-${layout} ${isSettling ? "settling" : ""} ${isFitMode ? "fit-mode" : ""} ${columns === 1 ? "single-column" : ""} ${isCollectionMode ? "collection-mode" : ""}`}
          >
            {items.map((artifact, index) => {
              const artifactMetadata = getCollectionMetadata(artifact);
              const isJustExpanded = artifactMetadata.collection_id
                ? justExpandedCollections.has(artifactMetadata.collection_id)
                : false;

              return (
                <SortableCarouselItem
                  id={artifact.id}
                  index={index + 1}
                  key={artifact.id}
                  layout={layout}
                  activeIndex={activeIndex}
                  contentUrl={artifact.content.url}
                  contentType={
                    artifact.type as "image" | "video" | "url" | "titleCard"
                  }
                  width={artifact.content?.width as number}
                  height={artifact.content?.height as number}
                  name={artifact.title}
                  metadata={artifact.content as VideoMetadata}
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
                  expandedCollections={expandedCollections}
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
                            metadata: { ...artifact.content, ...updates },
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
            {/* Hidden collection items preserve state when collapsed */}
            {hiddenCollectionItems.map((artifact) => (
              <HiddenCarouselItem
                id={artifact.id}
                key={`hidden-${artifact.id}`}
                layout={layout}
                contentUrl={artifact.content.url}
                contentType={
                  artifact.type as "image" | "video" | "url" | "titleCard"
                }
                width={artifact.content?.width as number}
                height={artifact.content?.height as number}
                name={artifact.title}
                metadata={artifact.content as VideoMetadata}
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
              expandedCollections={expandedCollections}
              isCollectionMode={isCollectionMode}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }
);

// Overlay component for drag preview
function CarouselItemOverlay({
  id,
  items,
  allArtifacts,
  expandedCollections,
  isCollectionMode = false,
  ...props
}: Omit<CarouselItemProps, "index"> & {
  items: Artifact[];
  allArtifacts?: Artifact[];
  expandedCollections?: Set<string>;
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
      contentUrl={artifact.content.url}
      contentType={artifact.type as "image" | "video" | "url" | "titleCard"}
      width={artifact.content?.width as number}
      height={artifact.content?.height as number}
      name={artifact.title}
      metadata={artifact.content as VideoMetadata}
      allArtifacts={allArtifacts}
      expandedCollections={expandedCollections}
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

// Sortable wrapper component
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
  expandedCollections,
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
  expandedCollections?: Set<string>;
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
    disabled: props.isReadOnly,
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
      expandedCollections={expandedCollections}
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
      dragHandleProps={
        props.isReadOnly
          ? undefined
          : {
              ref: setActivatorNodeRef,
              ...listeners,
            }
      }
    />
  );
}

// Hidden item component - preserves video state when collection is collapsed
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
