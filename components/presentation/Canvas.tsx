"use client";

import { SortableCarousel } from "./sortable-carousel/SortableCarousel";
import { Layout } from "./sortable-carousel/CarouselItem";
import type { Artifact } from "@/types";

// Temporary wrapper to test the SortableCarousel component
// Your original Canvas is backed up as Canvas.backup.tsx

interface CanvasProps {
  columns: number;
  artifacts: Artifact[];
  onReorder?: (artifacts: Artifact[]) => void;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  onDeleteArtifact?: (artifactId: string) => Promise<void>;
  isReadOnly?: boolean;
  fitMode?: boolean;
}

export default function Canvas({ columns, fitMode }: CanvasProps) {
  // For now, just showing the SortableCarousel example with placeholders
  // Ignoring the actual artifacts prop
  return (
    <div className="w-full h-full">
      <SortableCarousel
        layout={Layout.Horizontal}
        columns={columns}
        fitMode={fitMode}
      />
    </div>
  );
}
