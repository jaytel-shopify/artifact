import React, { forwardRef, HTMLAttributes } from "react";
import type {
  UniqueIdentifier,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

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
  onRemove?(): void;
  contentUrl?: string;
  contentType?: "image" | "video" | "url";
  width?: number;
  height?: number;
  name?: string;
  dragHandleProps?: {
    ref: (element: HTMLElement | null) => void;
  } & DraggableSyntheticListeners;
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
      onRemove,
      style,
      contentUrl,
      contentType = "image",
      width: propWidth,
      height: propHeight,
      name: propName,
      dragHandleProps,
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

    // Calculate width based on original aspect ratio
    // Fixed height of 200px, calculate width to maintain aspect ratio
    const CAROUSEL_HEIGHT = 200;
    const itemWidth =
      propWidth && propHeight
        ? (propWidth / propHeight) * CAROUSEL_HEIGHT
        : mockItem.width && mockItem.height
          ? (mockItem.width / mockItem.height) * CAROUSEL_HEIGHT
          : 150; // fallback to default width

    return (
      <li
        className={`
        carousel-item-wrapper
        ${active ? "active" : ""}
        ${clone ? "clone" : ""}
        ${insertPosition === Position.Before ? "insert-before" : ""}
        ${insertPosition === Position.After ? "insert-after" : ""}
        ${layout === Layout.Vertical ? "vertical" : ""}
      `}
        style={{ ...style, width: `${itemWidth}px` }}
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
          {type === "image" && (
            <img
              src={url}
              alt={`Item ${index}`}
              className="carousel-item-content"
              draggable={false}
            />
          )}
          {type === "video" && (
            <video
              src={url}
              className="carousel-item-content"
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          {type === "url" && (
            <div className="carousel-item-content carousel-item-url-preview">
              <span>🌐</span>
            </div>
          )}
        </div>
        {!active && onRemove ? (
          <button className="carousel-item-remove" onClick={onRemove}>
            ×
          </button>
        ) : null}
      </li>
    );
  }
);
