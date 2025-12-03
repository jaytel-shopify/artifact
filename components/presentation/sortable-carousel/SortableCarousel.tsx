import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
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
import type { ArtifactWithPosition } from "@/types";

import { CarouselItem, Layout, Position } from "./CarouselItem";
import type { Props as CarouselItemProps } from "./CarouselItem";
import { useCollectionMode } from "./useCollectionMode";
import { useCarouselItems } from "./useCarouselItems";
import { useDragHandlers } from "./useDragHandlers";
import { getCollectionMetadata } from "@/lib/collection-utils";
import { getCurrentScrollIndex, scrollToIndex } from "./carousel-utils";
import { useKeyHeld } from "@/hooks/useKeyHeld";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import "./sortable-carousel.css";

type VideoMetadata = { hideUI?: boolean; loop?: boolean; muted?: boolean };

interface Props {
  layout: Layout;
  columns?: number;
  fitMode?: boolean;
  sidebarOpen?: boolean;
  artifacts: ArtifactWithPosition[];
  expandedCollections?: Set<string>;
  onReorder?: (artifacts: ArtifactWithPosition[]) => void;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  onRemoveFromCollection?: (
    artifactId: string,
    newPosition: number
  ) => Promise<void>;
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
      sidebarOpen = false,
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

    // Space+drag panning state
    const isSpaceHeld = useKeyHeld("Space");
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, scrollLeft: 0 });
    const wasSpaceHeldRef = useRef(false);

    // Expose the containerRef to parent via forwardedRef
    useImperativeHandle(forwardedRef, () => containerRef.current!);

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
    }, [columns]);

    // Arrow key navigation - override native scroll with smooth scrollToIndex
    const navigateCarousel = useCallback((dir: number) => {
      const c = containerRef.current;
      if (!c) return;
      const idx = getCurrentScrollIndex(c);
      const max =
        c.querySelectorAll(
          ".carousel-item-wrapper:not(.collection-child-hidden)"
        ).length - 1;
      scrollToIndex(c, Math.max(0, Math.min(max, idx + dir)));
    }, []);

    useKeyboardShortcuts({
      onArrowLeft: () => navigateCarousel(-1),
      onArrowRight: () => navigateCarousel(1),
    });

    // Handle pan mode release - animate to nearest snap point
    useLayoutEffect(() => {
      // Detect when space was released (was held, now not held)
      if (wasSpaceHeldRef.current && !isSpaceHeld && containerRef.current) {
        isPanningRef.current = false;

        // IMMEDIATELY disable snap scroll via DOM before browser can snap
        // (React's className update already happened, so we need direct DOM manipulation)
        containerRef.current.classList.add("disable-snap-scroll");

        // Animate to nearest snap point
        const nearestIndex = getCurrentScrollIndex(containerRef.current);
        scrollToIndex(containerRef.current, nearestIndex);
      }
      wasSpaceHeldRef.current = isSpaceHeld;
    }, [isSpaceHeld]);

    // Pan handlers for space+drag
    const handlePanStart = useCallback(
      (e: React.MouseEvent) => {
        if (!isSpaceHeld || !containerRef.current) return;

        isPanningRef.current = true;
        panStartRef.current = {
          x: e.clientX,
          scrollLeft: containerRef.current.scrollLeft,
        };
        e.preventDefault();
      },
      [isSpaceHeld]
    );

    const handlePanMove = useCallback((e: React.MouseEvent) => {
      if (!isPanningRef.current || !containerRef.current) return;

      const dx = e.clientX - panStartRef.current.x;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    }, []);

    const handlePanEnd = useCallback(() => {
      isPanningRef.current = false;
    }, []);

    const itemIds = items.map((artifact) => artifact.id);
    const activeIndex =
      activeId != null ? itemIds.indexOf(activeId.toString()) : -1;

    // Conditionally create sensors - disabled during pan mode
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: isSpaceHeld ? Infinity : 8, // Disable drag when space held
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
    const sidebarOffset = sidebarOpen ? " - var(--sidebar-width)" : "";
    const columnWidth = `calc((100vw${sidebarOffset} - ${totalSpacingRem}rem) / ${columns})`;

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
        <div className="h-full flex items-center justify-center text-text-primary">
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
            className={`carousel carousel-${layout} ${isSettling ? "settling" : ""} ${isFitMode ? "fit-mode" : ""} ${columns === 1 ? "single-column" : ""} ${isCollectionMode ? "collection-mode" : ""} ${isSpaceHeld ? "pan-mode" : ""}`}
            style={
              sidebarOpen
                ? { paddingRight: "calc(var(--sidebar-width) + 1rem)" }
                : undefined
            }
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
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
            {/* Hidden collection items preserve state when collapsed */}
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
  items: ArtifactWithPosition[];
  allArtifacts?: ArtifactWithPosition[];
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
      contentUrl={artifact.source_url}
      contentType={artifact.type as "image" | "video" | "url" | "titleCard"}
      width={artifact.metadata?.width as number}
      height={artifact.metadata?.height as number}
      name={artifact.name}
      metadata={artifact.metadata as VideoMetadata}
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
  allArtifacts?: ArtifactWithPosition[];
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
    animateLayoutChanges: () => true,
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
