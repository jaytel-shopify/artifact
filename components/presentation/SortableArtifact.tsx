"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function SortableArtifact({
  artifact,
  width,
  columnHeight,
  isGlobalDragActive,
  activeArtifactId,
  children,
}: {
  artifact: { id: string };
  width: string;
  columnHeight?: number;
  isGlobalDragActive?: boolean;
  activeArtifactId?: string | null;
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

  // Check if this item is being repositioned (has a transform applied)
  const isBeingRepositioned = transform !== null;

  // DEBUG: Log state changes
  const shouldDim = isDragging && isGlobalDragActive;
  if (isDragging || isGlobalDragActive) {
    console.log(`[Artifact ${artifact.id.slice(0, 8)}] isDragging: ${isDragging}, isGlobalDragActive: ${isGlobalDragActive}, shouldDim: ${shouldDim}`);
  }

  const style: React.CSSProperties = {
    width,
    minHeight: "100%",
    scrollSnapAlign: "start",
    // Use dnd-kit's transition for any item being moved during drag
    transition: (isGlobalDragActive && isBeingRepositioned) ? transition : undefined,
    transform: CSS.Transform.toString(transform),
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "manipulation",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      data-artifact-id={artifact.id}
      className="inline-flex flex-col align-top shrink-0 h-full"
      layout={!isGlobalDragActive}
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
          <div className="overflow-hidden dim-overlay-parent relative">
            {children}
            
            {/* Overlay positioned to cover only artifact content (data-artifact-overlay-container), not title */}
            {shouldDim && (
              <style dangerouslySetInnerHTML={{
                __html: `
                  [data-artifact-id="${artifact.id}"] [data-artifact-overlay-container="true"]::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: black;
                    opacity: 0.9;
                    pointer-events: none;
                    z-index: 10;
                  }
                `
              }} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
