"use client";

import { forwardRef } from "react";
import { SortableCarousel } from "./sortable-carousel/SortableCarousel";
import { Layout } from "./sortable-carousel/CarouselItem";
import type { Artifact } from "@/types";

// Carousel-based Canvas component
// Original Canvas is backed up as Canvas.backup.tsx

interface CanvasProps {
  columns: number;
  artifacts: Artifact[];
  onReorder?: (artifacts: Artifact[]) => void;
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
  fitMode?: boolean;
}

const Canvas = forwardRef<HTMLUListElement, CanvasProps>(function Canvas({
  columns,
  artifacts,
  onReorder,
  onUpdateArtifact,
  onDeleteArtifact,
  onReplaceMedia,
  onEditTitleCard,
  onFocusArtifact,
  focusedArtifactId,
  isReadOnly = false,
  fitMode = false,
}, ref) {
  return (
    <div className="w-full h-full">
      <SortableCarousel
        ref={ref}
        layout={Layout.Horizontal}
        columns={columns}
        fitMode={fitMode}
        artifacts={artifacts}
        onReorder={onReorder}
        onUpdateArtifact={onUpdateArtifact}
        onDeleteArtifact={onDeleteArtifact}
        onReplaceMedia={onReplaceMedia}
        onEditTitleCard={onEditTitleCard}
        onFocusArtifact={onFocusArtifact}
        focusedArtifactId={focusedArtifactId}
        isReadOnly={isReadOnly}
      />
    </div>
  );
});

export default Canvas;
