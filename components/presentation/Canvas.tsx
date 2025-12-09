"use client";

import { forwardRef, type MutableRefObject } from "react";
import { SortableCarousel } from "./sortable-carousel/SortableCarousel";
import { Layout } from "./sortable-carousel/CarouselItem";
import type { ArtifactWithPosition } from "@/types";

// Carousel-based Canvas component
// Original Canvas is backed up as Canvas.backup.tsx

interface CanvasProps {
  columns: number;
  artifacts: ArtifactWithPosition[];
  expandedCollections?: Set<string>;
  sidebarOpen?: boolean;
  /** True when artifacts are being loaded (prevents showing empty state during page transitions) */
  isLoading?: boolean;
  onReorder?: (artifacts: ArtifactWithPosition[]) => void;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  onRemoveFromCollection?: (artifactId: string, newPosition: number) => Promise<void>;
  onToggleCollection?: (collectionId: string) => Promise<void>;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  onDeleteArtifact?: (artifactId: string) => Promise<void>;
  onReplaceMedia?: (artifactId: string, file: File) => Promise<void>;
  onEditTitleCard?: (artifactId: string) => void;
  onPublishArtifact?: (artifactId: string) => void;
  onFocusArtifact?: (artifactId: string) => void;
  focusedArtifactId?: string | null;
  isReadOnly?: boolean;
  fitMode?: boolean;
  /** Current user ID - needed to check if user can publish artifacts */
  currentUserId?: string;
}

const Canvas = forwardRef<HTMLUListElement, CanvasProps>(function Canvas(
  {
    columns,
    artifacts,
    expandedCollections,
    sidebarOpen = false,
    isLoading = false,
    onReorder,
    onCreateCollection,
    onRemoveFromCollection,
    onToggleCollection,
    onUpdateArtifact,
    onDeleteArtifact,
    onReplaceMedia,
    onEditTitleCard,
    onPublishArtifact,
    onFocusArtifact,
    focusedArtifactId,
    isReadOnly = false,
    fitMode = false,
    currentUserId,
  },
  ref
) {
  return (
    <div className="w-full h-full">
      <SortableCarousel
        ref={ref}
        layout={Layout.Horizontal}
        columns={columns}
        fitMode={fitMode}
        sidebarOpen={sidebarOpen}
        artifacts={artifacts}
        expandedCollections={expandedCollections}
        isLoading={isLoading}
        onReorder={onReorder}
        onCreateCollection={onCreateCollection}
        onRemoveFromCollection={onRemoveFromCollection}
        onToggleCollection={onToggleCollection}
        onUpdateArtifact={onUpdateArtifact}
        onDeleteArtifact={onDeleteArtifact}
        onReplaceMedia={onReplaceMedia}
        onEditTitleCard={onEditTitleCard}
        onPublishArtifact={onPublishArtifact}
        onFocusArtifact={onFocusArtifact}
        focusedArtifactId={focusedArtifactId}
        isReadOnly={isReadOnly}
        currentUserId={currentUserId}
      />
    </div>
  );
});

export default Canvas;
