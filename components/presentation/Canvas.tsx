"use client";

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
  isReadOnly?: boolean;
  fitMode?: boolean;
}

export default function Canvas({
  columns,
  artifacts,
  onReorder,
  onUpdateArtifact,
  onDeleteArtifact,
  onReplaceMedia,
  onEditTitleCard,
  isReadOnly = false,
  fitMode = false,
}: CanvasProps) {
  return (
    <div className="w-full h-full">
      <SortableCarousel
        layout={Layout.Horizontal}
        columns={columns}
        fitMode={fitMode}
        artifacts={artifacts}
        onReorder={onReorder}
        onUpdateArtifact={onUpdateArtifact}
        onDeleteArtifact={onDeleteArtifact}
        onReplaceMedia={onReplaceMedia}
        onEditTitleCard={onEditTitleCard}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
