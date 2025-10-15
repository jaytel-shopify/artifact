import React, { forwardRef, HTMLAttributes } from "react";
import type {
  UniqueIdentifier,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { CarouselItemContent } from "./CarouselItemContent";
import { CarouselItemContextMenu } from "./CarouselItemContextMenu";
import EditableArtifactTitle from "@/components/artifacts/EditableArtifactTitle";

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
  contentType?: "image" | "video" | "url" | "titleCard";
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
    headline?: string;
    subheadline?: string;
  };
  onUpdateMetadata?: (updates: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  }) => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  onDelete?: () => void;
  onReplaceMedia?: (file: File) => Promise<void>;
  onEdit?: () => void;
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
      onEdit,
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

    return (
      <CarouselItemContextMenu
        contentType={type}
        metadata={metadata}
        onUpdateMetadata={onUpdateMetadata}
        onReplaceMedia={onReplaceMedia}
        onEdit={onEdit}
        onDelete={onDelete}
        isReadOnly={isReadOnly}
      >
        {contentElement}
      </CarouselItemContextMenu>
    );
  }
);
