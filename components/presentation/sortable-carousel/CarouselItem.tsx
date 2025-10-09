import React, { forwardRef, HTMLAttributes } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";

export enum Position {
  Before = -1,
  After = 1,
}

export enum Layout {
  Horizontal = "horizontal",
  Vertical = "vertical",
  Grid = "grid",
}

export interface Props extends Omit<HTMLAttributes<HTMLButtonElement>, "id"> {
  active?: boolean;
  clone?: boolean;
  insertPosition?: Position;
  id: UniqueIdentifier;
  index?: number;
  layout: Layout;
  onRemove?(): void;
  contentUrl?: string;
  contentType?: "image" | "video" | "url";
}

// Mock content from your data (images and videos)
const mockContent = [
  { url: "https://picsum.photos/800/600?random=1", type: "image" as const },
  { url: "https://picsum.photos/id/237/800/600", type: "image" as const },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "video" as const,
  },
  { url: "https://picsum.photos/id/1015/1200/800", type: "image" as const },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "video" as const,
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
        style={style}
        ref={ref}
      >
        <button className="carousel-item" data-id={id.toString()} {...props}>
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
        </button>
        {!active && onRemove ? (
          <button className="carousel-item-remove" onClick={onRemove}>
            ×
          </button>
        ) : null}
        {index != null ? (
          <span className="carousel-item-number">{index}</span>
        ) : null}
      </li>
    );
  }
);
