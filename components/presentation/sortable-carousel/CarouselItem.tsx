import React, { forwardRef, HTMLAttributes } from "react";
import type {
  UniqueIdentifier,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Upload,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CarouselItemContent } from "./CarouselItemContent";
import EditableArtifactTitle from "@/components/artifacts/EditableArtifactTitle";
import { toast } from "sonner";

export enum Position {
  Before = -1,
  After = 1,
}

export enum Layout {
  Horizontal = "horizontal",
  Vertical = "vertical",
  Grid = "grid",
}

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "id"> {
  active?: boolean;
  clone?: boolean;
  insertPosition?: Position;
  id: UniqueIdentifier;
  index?: number;
  layout: Layout;
  contentUrl?: string;
  contentType?: "image" | "video" | "url";
  width?: number;
  height?: number;
  name?: string;
  dragHandleProps?: {
    ref: (element: HTMLElement | null) => void;
  } & DraggableSyntheticListeners;
  metadata?: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  onUpdateMetadata?: (updates: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  }) => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  onDelete?: () => void;
  onReplaceMedia?: (file: File) => Promise<void>;
  isReadOnly?: boolean;
  isAnyDragging?: boolean;
  isSettling?: boolean;
  fitMode?: boolean;
}

export const CarouselItem = forwardRef<HTMLLIElement, Props>(
  function CarouselItem(
    {
      id,
      index,
      active,
      clone,
      insertPosition,
      layout,
      style,
      contentUrl,
      contentType = "image",
      width: propWidth,
      height: propHeight,
      name: propName,
      dragHandleProps,
      metadata,
      onUpdateMetadata,
      onUpdateTitle,
      onDelete,
      onReplaceMedia,
      isReadOnly = false,
      isAnyDragging = false,
      isSettling = false,
      fitMode = false,
      ...props
    },
    ref
  ) {
    // Use provided data (required now, no mock fallback)
    const url = contentUrl || "";
    const type = contentType;
    const name = propName || `Item ${index}`;

    // Get content dimensions from props
    const contentWidth = propWidth;
    const contentHeight = propHeight;

    const isVideo = type === "video";
    const isUrl = type === "url";

    // Extract ref from dragHandleProps to apply to the entire item
    const { ref: dragHandleRef, ...dragListeners } = dragHandleProps || {};

    const contentElement = (
      <li
        className={`
        carousel-item-wrapper
        ${active ? "active" : ""}
        ${clone ? "clone" : ""}
        ${isSettling ? "settling" : ""}
        ${insertPosition === Position.Before ? "insert-before" : ""}
        ${insertPosition === Position.After ? "insert-after" : ""}
        ${layout === Layout.Vertical ? "vertical" : ""}
        ${fitMode ? "fit-mode" : ""}
      `}
        style={{
          ...style,
          aspectRatio:
            isUrl && contentWidth && contentHeight
              ? `${contentWidth} / ${contentHeight}`
              : "",
        }}
        ref={ref}
        {...dragListeners}
      >
        {name && (
          <div className="carousel-item-header">
            <div className="carousel-item-title flex-1 min-w-0">
              {isReadOnly || !onUpdateTitle ? (
                <div className="text-xs text-gray-400 truncate px-2 py-1">
                  {name}
                </div>
              ) : (
                <EditableArtifactTitle
                  title={name}
                  artifactId={id.toString()}
                  onUpdate={onUpdateTitle}
                  artifactType={type}
                  sourceUrl={url}
                />
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="carousel-item-drag-handle" ref={dragHandleRef}>
                <GripVertical size={16} />
              </div>
            </div>
          </div>
        )}
        <div
          className="carousel-item"
          data-id={id.toString()}
          data-content-type={type}
          {...props}
        >
          <CarouselItemContent
            type={type}
            url={url}
            alt={`Item ${index}`}
            width={contentWidth}
            height={contentHeight}
            isDragging={isAnyDragging}
            metadata={metadata}
            fitMode={fitMode}
          />
        </div>
      </li>
    );

    // If read-only or no handlers, just return the content without context menu
    if (isReadOnly || (!onDelete && !onUpdateMetadata && !onReplaceMedia)) {
      return contentElement;
    }

    // Wrap with context menu for interactive items (not URLs)
    if (isUrl) {
      return contentElement;
    }

    const handleReplaceMedia = () => {
      if (!onReplaceMedia) return;
      
      // Create a temporary file input
      const input = document.createElement('input');
      input.type = 'file';
      
      // Set accept attribute based on content type
      if (isVideo) {
        input.accept = '.mp4,.mov,.webm,video/*';
      } else {
        input.accept = '.jpg,.jpeg,.png,.gif,.webp,image/*';
      }
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            await onReplaceMedia(file);
          } catch (error) {
            console.error('Failed to replace media:', error);
          }
        }
      };
      
      input.click();
    };

    const toggleVideoUI = async () => {
      if (!onUpdateMetadata) return;
      try {
        await onUpdateMetadata({ hideUI: !metadata?.hideUI });
        toast.success(
          metadata?.hideUI ? "Video controls enabled" : "Video controls hidden"
        );
      } catch {
        toast.error("Failed to update video settings");
      }
    };

    const toggleVideoLoop = async () => {
      if (!onUpdateMetadata) return;
      try {
        await onUpdateMetadata({ loop: !metadata?.loop });
        toast.success(
          metadata?.loop ? "Video loop disabled" : "Video loop enabled"
        );
      } catch {
        toast.error("Failed to update video settings");
      }
    };

    const toggleVideoMute = async () => {
      if (!onUpdateMetadata) return;
      const currentMuted = metadata?.muted !== false;
      try {
        await onUpdateMetadata({ muted: !currentMuted });
        toast.success(currentMuted ? "Video unmuted" : "Video muted");
      } catch {
        toast.error("Failed to update video settings");
      }
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{contentElement}</ContextMenuTrigger>
        <ContextMenuContent>
          {isVideo && onUpdateMetadata && (
            <>
              <ContextMenuItem
                onClick={toggleVideoUI}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {!metadata?.hideUI ? <Check className="w-3 h-3" /> : null}
                </div>
                {!metadata?.hideUI ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Show Controls
              </ContextMenuItem>
              <ContextMenuItem
                onClick={toggleVideoLoop}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {metadata?.loop ? <Check className="w-3 h-3" /> : null}
                </div>
                <RotateCcw className="w-4 h-4" />
                Loop Video
              </ContextMenuItem>
              <ContextMenuItem
                onClick={toggleVideoMute}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {metadata?.muted === false ? (
                    <Check className="w-3 h-3" />
                  ) : null}
                </div>
                {metadata?.muted !== false ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                Audio On
              </ContextMenuItem>
              <ContextMenuItem disabled className="h-px bg-border p-0 m-1" />
            </>
          )}
          {onReplaceMedia && (
            <ContextMenuItem onClick={handleReplaceMedia} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Replace Media
            </ContextMenuItem>
          )}
          {onReplaceMedia && onDelete && (
            <ContextMenuItem disabled className="h-px bg-border p-0 m-1" />
          )}
          {onDelete && (
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);
