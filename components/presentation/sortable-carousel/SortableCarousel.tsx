import React, { useState, useRef, useEffect } from "react";
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
import "./sortable-carousel.css";

type VideoMetadata = { hideUI?: boolean; loop?: boolean; muted?: boolean };

interface Props {
  layout: Layout;
  columns?: number;
  fitMode?: boolean;
  artifacts: Artifact[];
  onReorder?: (artifacts: Artifact[]) => void;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  onDeleteArtifact?: (artifactId: string) => Promise<void>;
  onReplaceMedia?: (artifactId: string, file: File) => Promise<void>;
  isReadOnly?: boolean;
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

export function SortableCarousel({
  layout,
  columns = 3,
  fitMode = false,
  artifacts,
  onReorder,
  onUpdateArtifact,
  onDeleteArtifact,
  onReplaceMedia,
  isReadOnly = false,
}: Props) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settlingId, setSettlingId] = useState<UniqueIdentifier | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const [items, setItems] = useState<Artifact[]>(artifacts);

  // Sync artifacts with local state (respecting animation state)
  const prevArtifactsRef = useRef(artifacts);
  useEffect(() => {
    // Block sync during animation - critical for smooth animation!
    if (isSettling) return;

    const prevIds = prevArtifactsRef.current
      .map((a) => a.id)
      .sort()
      .join(",");
    const newIds = artifacts
      .map((a) => a.id)
      .sort()
      .join(",");

    // Sync if items added/removed
    if (prevIds !== newIds) {
      setItems(artifacts);
      prevArtifactsRef.current = artifacts;
      return;
    }

    // Also sync if artifact properties changed (name, metadata, etc.)
    // But preserve the current order from items
    const itemsChanged = artifacts.some((newArtifact) => {
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

    if (itemsChanged) {
      // Update items while preserving order
      const orderMap = new Map(items.map((item, idx) => [item.id, idx]));
      const updatedItems = artifacts.slice().sort((a, b) => {
        const aIdx = orderMap.get(a.id) ?? 0;
        const bIdx = orderMap.get(b.id) ?? 0;
        return aIdx - bIdx;
      });
      setItems(updatedItems);
    }

    prevArtifactsRef.current = artifacts;
  }, [artifacts, isSettling, items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollLeft = container.scrollLeft;
  }, [columns]);

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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalPaddingRem = 2;
  const totalGapRem = 2 * (columns - 1);
  const totalSpacingRem = totalPaddingRem + totalGapRem;
  const columnWidth = `calc((100vw - ${totalSpacingRem}rem) / ${columns})`;

  // Fit mode is ONLY enabled when columns is 1
  // Regardless of fitMode prop, it's disabled for multi-column layouts
  const isFitMode = columns === 1 ? fitMode : false;

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
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
    >
      <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
        <ul
          ref={containerRef}
          className={`carousel carousel-${layout} ${isSettling ? "settling" : ""} ${isFitMode ? "fit-mode" : ""} ${columns === 1 ? "single-column" : ""}`}
        >
          {items.map((artifact, index) => (
            <SortableCarouselItem
              id={artifact.id}
              index={index + 1}
              key={artifact.id}
              layout={layout}
              activeIndex={activeIndex}
              contentUrl={artifact.source_url}
              contentType={artifact.type as "image" | "video" | "url"}
              width={artifact.metadata?.width as number}
              height={artifact.metadata?.height as number}
              name={artifact.name}
              metadata={artifact.metadata as VideoMetadata}
              columnWidth={columnWidth}
              isAnyDragging={activeId !== null}
              isSettling={settlingId === artifact.id}
              isReadOnly={isReadOnly}
              fitMode={isFitMode}
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
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId != null ? (
          <CarouselItemOverlay id={activeId} layout={layout} items={items} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (over) {
      const overIndex = itemIds.indexOf(over.id.toString());

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
    }

    setActiveId(null);
  }
}

function CarouselItemOverlay({
  id,
  items,
  ...props
}: Omit<CarouselItemProps, "index"> & { items: Artifact[] }) {
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
      contentType={artifact.type as "image" | "video" | "url"}
      width={artifact.metadata?.width as number}
      height={artifact.metadata?.height as number}
      name={artifact.name}
      metadata={artifact.metadata as VideoMetadata}
      {...props}
      clone
      insertPosition={
        isKeyboardSorting && overIndex !== activeIndex
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
  ...props
}: CarouselItemProps & {
  activeIndex: number;
  columnWidth?: string;
  isAnyDragging?: boolean;
  isSettling?: boolean;
  fitMode?: boolean;
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
      style={{
        transition,
        transform: isSorting ? undefined : CSS.Translate.toString(transform),
        // @ts-expect-error - CSS custom property
        "--column-width": columnWidth,
      }}
      insertPosition={
        over?.id === id
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
