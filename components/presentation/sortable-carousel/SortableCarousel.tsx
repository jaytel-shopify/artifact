import React, { useState } from "react";
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
} from "@dnd-kit/sortable";
import { CSS, isKeyboardEvent } from "@dnd-kit/utilities";

import { CarouselItem, Layout, Position } from "./CarouselItem";
import type { Props as CarouselItemProps } from "./CarouselItem";
import "./sortable-carousel.css";

interface Props {
  layout: Layout;
  columns?: number;
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
        transform: CSS.Transform.toString({
          scaleX: 0.98,
          scaleY: 0.98,
          x: transform.final.x - 10,
          y: transform.final.y - 10,
        }),
      },
    ];
  },
  sideEffects: defaultDropAnimationSideEffects({
    className: {
      active: "carousel-item-active",
    },
  }),
};

function createRange<T = number>(
  length: number,
  initializer: (index: number) => T
): T[] {
  return [...new Array(length)].map((_, index) => initializer(index));
}

export function SortableCarousel({ layout, columns = 3 }: Props) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [items, setItems] = useState(() =>
    createRange<UniqueIdentifier>(20, (index) => `${index + 1}`)
  );
  const [itemMetadata, setItemMetadata] = useState<
    Record<string, { hideUI?: boolean; loop?: boolean; muted?: boolean }>
  >({});
  const activeIndex = activeId != null ? items.indexOf(activeId) : -1;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Calculate column width in vw based on number of columns
  // Padding: 1rem on each side = 2rem total
  // Gaps: 2rem between each item = 2rem * (columns - 1)
  const totalPaddingRem = 2;
  const totalGapRem = 2 * (columns - 1);
  const totalSpacingRem = totalPaddingRem + totalGapRem;
  // Convert rem to vw (assuming 16px = 1rem and using viewport width)
  const remToVw = (rem: number) =>
    `${((rem * 16) / window.innerWidth) * 100}vw`;
  const columnWidth = `calc((100vw - ${remToVw(totalSpacingRem)}) / ${columns})`;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
    >
      <SortableContext items={items}>
        <ul className={`carousel carousel-${layout}`}>
          {items.map((id, index) => (
            <SortableCarouselItem
              id={id}
              index={index + 1}
              key={id}
              layout={layout}
              activeIndex={activeIndex}
              metadata={itemMetadata[id.toString()]}
              columnWidth={columnWidth}
              isAnyDragging={activeId !== null}
              onDelete={() => {
                console.log("Delete item:", id);
                setItems((items) => items.filter((itemId) => itemId !== id));
              }}
              onUpdateMetadata={(updates) => {
                setItemMetadata((prev) => ({
                  ...prev,
                  [id.toString()]: {
                    ...prev[id.toString()],
                    ...updates,
                  },
                }));
              }}
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
      const overIndex = items.indexOf(over.id);

      if (activeIndex !== overIndex) {
        const newIndex = overIndex;

        setItems((items) => arrayMove(items, activeIndex, newIndex));
      }
    }

    setActiveId(null);
  }
}

function CarouselItemOverlay({
  id,
  items,
  ...props
}: Omit<CarouselItemProps, "index"> & { items: UniqueIdentifier[] }) {
  const { activatorEvent, over } = useDndContext();
  const isKeyboardSorting = isKeyboardEvent(activatorEvent);
  const activeIndex = items.indexOf(id);
  const overIndex = over?.id ? items.indexOf(over?.id) : -1;

  return (
    <CarouselItem
      id={id}
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
  ...props
}: CarouselItemProps & {
  activeIndex: number;
  columnWidth?: string;
  isAnyDragging?: boolean;
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
      style={{
        transition,
        transform: isSorting ? undefined : CSS.Translate.toString(transform),
        width: columnWidth,
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
