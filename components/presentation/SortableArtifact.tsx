"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
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
    // Remove manual transition - Motion's layout prop handles this now
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.1 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "manipulation",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      data-artifact-id={artifact.id}
      className="inline-flex flex-col align-top shrink-0 h-full"
      layout
      transition={{
        layout: { 
          type: "spring", 
          bounce: 0.15, 
          duration: 0.4 
        }
      }}
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
    </motion.div>
  );
}
