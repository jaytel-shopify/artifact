"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

export default function SortableArtifact({
  artifact,
  width,
  columnHeight,
  children,
}: {
  artifact: { id: string };
  width: string;
  columnHeight?: number;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artifact.id });

  const style: React.CSSProperties = {
    width,
    minHeight: "100%",
    scrollSnapAlign: "start",
    transition: transition || "width 260ms cubic-bezier(0.33, 1, 0.68, 1)",
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.1 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "manipulation",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-artifact-id={artifact.id}
      className="inline-flex flex-col align-top shrink-0 h-full"
      {...attributes}
      {...listeners}
    >
      <div className="flex-1">
        <div
          className="overflow-y-auto"
          style={{ maxHeight: columnHeight ? `${columnHeight}px` : undefined }}
        >
          <div className="overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
