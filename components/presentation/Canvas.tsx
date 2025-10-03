"use client";

import URLEmbed from "@/components/artifacts/URLEmbed";
import ImageViewer from "@/components/artifacts/ImageViewer";
import VideoPlayer from "@/components/artifacts/VideoPlayer";
import PDFViewer from "@/components/artifacts/PDFViewer";
import EditableArtifactTitle from "@/components/artifacts/EditableArtifactTitle";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, EyeOff, RotateCcw, Volume2, VolumeX, Check } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragMoveEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { LayoutGroup } from "framer-motion";
import SortableArtifact from "./SortableArtifact";
import ArtifactPreview from "./ArtifactPreview";
import type { Artifact } from "@/types";

export default function Canvas({
  columns,
  artifacts,
  onReorder,
  onUpdateArtifact,
  onDeleteArtifact,
}: {
  columns: number;
  artifacts: Artifact[];
  onReorder?: (next: Artifact[]) => void;
  onUpdateArtifact?: (artifactId: string, updates: { name?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  onDeleteArtifact?: (artifactId: string) => Promise<void>;
}) {
  const [items, setItems] = useState(artifacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(artifacts);
  }, [artifacts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const [showScrollbar, setShowScrollbar] = useState(false);
  const [columnHeight, setColumnHeight] = useState<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(any-pointer: coarse)");
    const update = () => setShowScrollbar(media.matches);
    update();
    media.addEventListener("change", update);

    const onWheel = () => {
      setShowScrollbar(false);
      window.removeEventListener("wheel", onWheel);
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setColumnHeight(el.clientHeight);
    update();

    const handleResize = () => update();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [items.length]);

  const gapPx = 32;
  const columnWidth = useMemo(
    () => `calc((100% - ${(columns - 1) * gapPx}px) / ${columns})`,
    [columns, gapPx]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        setActiveId(null);
        setDragging(false);
      });
      
      if (!over || active.id === over.id) return;
      
      setItems((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id);
        const newIndex = prev.findIndex((p) => p.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        onReorder?.(next);
        return next;
      });
    },
    [onReorder]
  );

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
    setDragging(true);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const container = containerRef.current;
    const translated = event.active.rect.current.translated;
    if (!container || !translated) return;

    const EDGE = 120;
    const SPEED = 28;
    const rect = container.getBoundingClientRect();

    if (translated.right > rect.right - EDGE) {
      container.scrollBy({ left: SPEED, behavior: "auto" });
    } else if (translated.left < rect.left + EDGE) {
      container.scrollBy({ left: -SPEED, behavior: "auto" });
    }
  }, []);



  // Wrapper component for individual artifacts with context menu
  const ArtifactWrapper = useCallback(({ artifact, children }: { artifact: Artifact; children: React.ReactNode }) => {
    const isVideo = artifact.type === 'video';
    const videoMetadata = artifact.metadata as { hideUI?: boolean; loop?: boolean; muted?: boolean } | undefined;
    
    const toggleVideoUI = async () => {
      if (!onUpdateArtifact) return;
      const newMetadata = {
        ...artifact.metadata,
        hideUI: !videoMetadata?.hideUI
      };
      try {
        await onUpdateArtifact(artifact.id, { metadata: newMetadata });
        toast.success(videoMetadata?.hideUI ? 'Video controls enabled' : 'Video controls hidden');
      } catch (error) {
        toast.error('Failed to update video settings');
      }
    };

    const toggleVideoLoop = async () => {
      if (!onUpdateArtifact) return;
      const newMetadata = {
        ...artifact.metadata,
        loop: !videoMetadata?.loop
      };
      try {
        await onUpdateArtifact(artifact.id, { metadata: newMetadata });
        toast.success(videoMetadata?.loop ? 'Video loop disabled' : 'Video loop enabled');
      } catch (error) {
        toast.error('Failed to update video settings');
      }
    };

    const toggleVideoMute = async () => {
      if (!onUpdateArtifact) return;
      const currentMuted = videoMetadata?.muted !== false; // Default to muted
      const newMetadata = {
        ...artifact.metadata,
        muted: !currentMuted
      };
      try {
        await onUpdateArtifact(artifact.id, { metadata: newMetadata });
        toast.success(currentMuted ? 'Video unmuted' : 'Video muted');
      } catch (error) {
        toast.error('Failed to update video settings');
      }
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="group relative"
          >
            <div className="space-y-4">
              <div data-artifact-title-id={artifact.id}>
                <EditableArtifactTitle
                  title={artifact.name}
                  artifactId={artifact.id}
                  onUpdate={(newTitle) => onUpdateArtifact?.(artifact.id, { name: newTitle }) ?? Promise.resolve()}
                  className="mb-6"
                />
              </div>
              <div>
                {children}
              </div>
            </div>
          </div>
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
              } catch (error) {
                toast.error("Failed to delete artifact. Please try again.");
                console.error("Failed to delete artifact:", error);
              }
            }}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }, [onUpdateArtifact, onDeleteArtifact]);

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
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        <LayoutGroup>
          <div
            ref={containerRef}
            className={`w-full h-full overflow-x-auto overflow-y-hidden flex items-stretch ${showScrollbar ? "" : "hide-scrollbar"}`}
            style={{
              gap: `${gapPx}px`,
              scrollSnapType: dragging ? "none" : "x mandatory",
              scrollPaddingInline: `${gapPx}px`,
              paddingInline: `${gapPx}px`,
            }}
          >
            <SortableContext items={items.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
              {items.map((artifact) => (
                <SortableArtifact
                  key={artifact.id}
                  artifact={artifact}
                  width={columnWidth}
                  columnHeight={columnHeight ?? undefined}
                >
                  <ArtifactWrapper artifact={artifact}>
                    <ArtifactCell artifact={artifact} />
                  </ArtifactWrapper>
                </SortableArtifact>
              ))}
            </SortableContext>
          </div>
        </LayoutGroup>
      </div>
      <DragOverlay>
        {activeId ? (
          <ArtifactPreview artifact={items.find((p) => p.id === activeId)!} maxHeight={columnHeight ?? undefined} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ArtifactCell({ artifact }: { artifact: Artifact }) {
  if (artifact.type === "image") {
    return <ImageViewer src={artifact.source_url} alt="" />;
  }
  if (artifact.type === "url") {
    return <URLEmbed url={artifact.source_url} metadata={artifact.metadata} />;
  }
  if (artifact.type === "video") {
    return <VideoPlayer src={artifact.source_url} metadata={artifact.metadata as { hideUI?: boolean; loop?: boolean; muted?: boolean }} />;
  }
  if (artifact.type === "pdf") {
    return <PDFViewer src={artifact.source_url} />;
  }
  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-500">
      Unsupported type: {artifact.type}
    </div>
  );
}
