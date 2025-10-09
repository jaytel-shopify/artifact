"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type { MeasuringConfiguration, UniqueIdentifier } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import SortableArtifact from "./SortableArtifact";
import type { Artifact } from "@/types";
import URLEmbed from "@/components/artifacts/URLEmbed";
import ImageViewer from "@/components/artifacts/ImageViewer";
import VideoPlayer from "@/components/artifacts/VideoPlayer";
import EditableArtifactTitle from "@/components/artifacts/EditableArtifactTitle";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, EyeOff, RotateCcw, Volume2, VolumeX, Check } from "lucide-react";
import { toast } from "sonner";

// Configuration from dnd-kit Pages example
const measuring: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

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

export default function Canvas({
  columns,
  artifacts,
  onReorder,
  onUpdateArtifact,
  onDeleteArtifact,
  isReadOnly = false,
  fitMode = false,
}: CanvasProps) {
  const [items, setItems] = useState(artifacts);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  useEffect(() => {
    setItems(artifacts);
  }, [artifacts]);

  const activeIndex = activeId != null ? items.findIndex((item) => item.id === activeId) : -1;

  // Sensors from Pages example
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const gapPx = 32;
  const columnWidth = useMemo(
    () => `calc((100% - ${(columns - 1) * gapPx}px) / ${columns})`,
    [columns]
  );

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  // Drag handlers from Pages example
  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (over) {
      const overIndex = items.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex && activeIndex !== -1) {
        const newItems = arrayMove(items, activeIndex, overIndex);
        setItems(newItems);
        onReorder?.(newItems);
      }
    }

    setActiveId(null);
  }

  // Artifact rendering
  const renderArtifactContent = useCallback(
    (artifact: Artifact) => {
      if (artifact.type === "image") {
        return <ImageViewer src={artifact.source_url} alt={artifact.name} fitMode={fitMode} />;
      }
      if (artifact.type === "video") {
        return (
          <VideoPlayer
            src={artifact.source_url}
            metadata={artifact.metadata as { hideUI?: boolean; loop?: boolean; muted?: boolean }}
            fitMode={fitMode}
          />
        );
      }
      if (artifact.type === "url") {
        return <URLEmbed url={artifact.source_url} metadata={artifact.metadata} fitMode={fitMode} />;
      }
      return (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          Unsupported type: {artifact.type}
        </div>
      );
    },
    [fitMode]
  );

  // Context menu wrapper
  const renderArtifactWithMenu = useCallback(
    (artifact: Artifact) => {
      const isVideo = artifact.type === "video";
      const videoMetadata = artifact.metadata as
        | { hideUI?: boolean; loop?: boolean; muted?: boolean }
        | undefined;

      const toggleVideoUI = async () => {
        if (!onUpdateArtifact) return;
        try {
          await onUpdateArtifact(artifact.id, {
            metadata: { ...artifact.metadata, hideUI: !videoMetadata?.hideUI },
          });
          toast.success(videoMetadata?.hideUI ? "Video controls enabled" : "Video controls hidden");
        } catch {
          toast.error("Failed to update video settings");
        }
      };

      const toggleVideoLoop = async () => {
        if (!onUpdateArtifact) return;
        try {
          await onUpdateArtifact(artifact.id, {
            metadata: { ...artifact.metadata, loop: !videoMetadata?.loop },
          });
          toast.success(videoMetadata?.loop ? "Video loop disabled" : "Video loop enabled");
        } catch {
          toast.error("Failed to update video settings");
        }
      };

      const toggleVideoMute = async () => {
        if (!onUpdateArtifact) return;
        const currentMuted = videoMetadata?.muted !== false;
        try {
          await onUpdateArtifact(artifact.id, {
            metadata: { ...artifact.metadata, muted: !currentMuted },
          });
          toast.success(currentMuted ? "Video unmuted" : "Video muted");
        } catch {
          toast.error("Failed to update video settings");
        }
      };

      const content = (
        <div className="h-full flex flex-col">
          {isReadOnly ? (
            <div className="mb-6 text-white/80 text-sm font-medium text-center">
              {artifact.name}
            </div>
          ) : (
            <EditableArtifactTitle
              title={artifact.name}
              artifactId={artifact.id}
              onUpdate={(newTitle) =>
                onUpdateArtifact?.(artifact.id, { name: newTitle }) ?? Promise.resolve()
              }
              artifactType={artifact.type}
              sourceUrl={artifact.source_url}
              className="mb-6"
            />
          )}
          <div className="flex-1 flex items-center justify-center">
            {renderArtifactContent(artifact)}
          </div>
        </div>
      );

      if (isReadOnly) {
        return content;
      }

      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="h-full">{content}</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {isVideo && (
              <>
                <ContextMenuItem onClick={toggleVideoUI} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {!videoMetadata?.hideUI ? <Check className="w-3 h-3" /> : null}
                  </div>
                  {!videoMetadata?.hideUI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Controls
                </ContextMenuItem>
                <ContextMenuItem onClick={toggleVideoLoop} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {videoMetadata?.loop ? <Check className="w-3 h-3" /> : null}
                  </div>
                  <RotateCcw className="w-4 h-4" />
                  Loop Video
                </ContextMenuItem>
                <ContextMenuItem onClick={toggleVideoMute} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {videoMetadata?.muted === false ? <Check className="w-3 h-3" /> : null}
                  </div>
                  {videoMetadata?.muted !== false ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  Audio On
                </ContextMenuItem>
                <ContextMenuItem disabled className="h-px bg-border p-0 m-1" />
              </>
            )}
            <ContextMenuItem
              variant="destructive"
              onClick={async () => {
                try {
                  await onDeleteArtifact?.(artifact.id);
                  toast.success(`"${artifact.name}" deleted successfully`);
                } catch {
                  toast.error("Failed to delete artifact. Please try again.");
                }
              }}
            >
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    [isReadOnly, onUpdateArtifact, onDeleteArtifact, renderArtifactContent]
  );

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        No artifacts yet. Add one to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={measuring}
    >
      <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
        <div
          className="w-full h-full overflow-x-auto overflow-y-hidden hide-scrollbar"
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: columnWidth,
            gap: `${gapPx}px`,
            padding: `0 ${gapPx}px`,
            paddingBottom: fitMode ? "64px" : undefined,
            alignItems: fitMode ? "start" : "stretch",
            justifyContent: fitMode ? "center" : "start",
          }}
        >
          {items.map((artifact) => (
            <SortableArtifact
              key={artifact.id}
              id={artifact.id}
              activeIndex={activeIndex}
              isReadOnly={isReadOnly}
            >
              {renderArtifactWithMenu(artifact)}
            </SortableArtifact>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId != null ? (
          <div style={{ width: columnWidth }}>
            {renderArtifactContent(items.find((a) => a.id === activeId)!)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
