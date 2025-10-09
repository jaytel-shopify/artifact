"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";

interface SortableArtifactProps {
  id: UniqueIdentifier;
  activeIndex?: number;
  isReadOnly?: boolean;
  children: ReactNode;
}

export default function SortableArtifact({
  id,
  isReadOnly = false,
  children,
}: SortableArtifactProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id,
    disabled: isReadOnly,
    animateLayoutChanges: () => true,
  });

  const style: React.CSSProperties = {
    height: "100%",
    transition,
    // Like Pages example: only apply transform when NOT sorting
    transform: isSorting ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isReadOnly ? "default" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
