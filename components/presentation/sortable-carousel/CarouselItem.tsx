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
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CarouselItemContent } from "./CarouselItemContent";

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
  }) => void;
  onDelete?: () => void;
  isReadOnly?: boolean;
}

// Mock content from your data (images and videos) with original dimensions
const mockContent = [
  {
    url: "https://picsum.photos/800/600?random=1",
    type: "image" as const,
    width: 800,
    height: 600,
    name: "Sample Image 1",
  },
  {
    url: "https://www.shopify.com",
    type: "url" as const,
    width: 1920,
    height: 1080,
    name: "Shopify Homepage",
  },
  {
    url: "https://picsum.photos/id/237/800/600",
    type: "image" as const,
    width: 800,
    height: 600,
    name: "Placeholder Image - Dog",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "video" as const,
    width: 1280,
    height: 720,
    name: "Sample Video - Big Buck Bunny",
  },
  {
    url: "https://www.shopify.com",
    type: "url" as const,
    width: 1920,
    height: 1080,
    name: "Shopify Homepage",
  },
  {
    url: "https://picsum.photos/id/1015/1200/800",
    type: "image" as const,
    width: 1200,
    height: 800,
    name: "Placeholder Image - Nature",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "video" as const,
    width: 1920,
    height: 1080,
    name: "Sample Video - For Bigger Blazes",
  },
  {
    url: "https://atlas-prototypes.quick.shopify.io/adaptive-form/",
    type: "url" as const,
    width: 1440,
    height: 900,
    name: "intent flow",
  },
];

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
      onDelete,
      isReadOnly = false,
      ...props
    },
    ref
  ) {
    // Use provided contentUrl or cycle through mock content based on id (not index, so it doesn't change during drag)
    const contentIndex =
      typeof id === "number" ? id : parseInt(id.toString(), 10);
    const mockItem = mockContent[(contentIndex - 1) % mockContent.length];
    const url = contentUrl || mockItem.url;
    const type = contentUrl ? contentType : mockItem.type;
    const name = propName || mockItem.name || `Item ${index}`;

    // Get content dimensions (either from props or mock data)
    const contentWidth = propWidth || mockItem.width;
    const contentHeight = propHeight || mockItem.height;

    const isVideo = type === "video";
    const isUrl = type === "url";

    const contentElement = (
      <li
        className={`
        carousel-item-wrapper
        ${active ? "active" : ""}
        ${clone ? "clone" : ""}
        ${insertPosition === Position.Before ? "insert-before" : ""}
        ${insertPosition === Position.After ? "insert-after" : ""}
        ${layout === Layout.Vertical ? "vertical" : ""}
      `}
        style={{
          ...style,
          aspectRatio:
            contentWidth && contentHeight
              ? `${contentWidth} / ${contentHeight}`
              : "16 / 9",
        }}
        ref={ref}
      >
        {name && (
          <div className="carousel-item-header">
            <div className="carousel-item-title">{name}</div>
            <div className="carousel-item-drag-handle" {...dragHandleProps}>
              <GripVertical size={16} />
            </div>
          </div>
        )}
        <div className="carousel-item" data-id={id.toString()} {...props}>
          <CarouselItemContent
            type={type}
            url={url}
            alt={`Item ${index}`}
            width={contentWidth}
            height={contentHeight}
            metadata={metadata}
          />
        </div>
      </li>
    );

    // If read-only or no handlers, just return the content without context menu
    if (isReadOnly || (!onDelete && !onUpdateMetadata)) {
      return contentElement;
    }

    // Wrap with context menu for interactive items (not URLs)
    if (isUrl) {
      return contentElement;
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{contentElement}</ContextMenuTrigger>
        <ContextMenuContent>
          {isVideo && onUpdateMetadata && (
            <>
              <ContextMenuItem
                onClick={() => onUpdateMetadata({ hideUI: !metadata?.hideUI })}
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
                onClick={() => onUpdateMetadata({ loop: !metadata?.loop })}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {metadata?.loop ? <Check className="w-3 h-3" /> : null}
                </div>
                <RotateCcw className="w-4 h-4" />
                Loop Video
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  const currentMuted = metadata?.muted !== false;
                  onUpdateMetadata({ muted: !currentMuted });
                }}
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
