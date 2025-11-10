import React, { forwardRef, HTMLAttributes } from "react";
import type {
  UniqueIdentifier,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical, Maximize2, Minimize2, FolderPlus } from "lucide-react";
import { CarouselItemContent } from "./CarouselItemContent";
import { CarouselItemContextMenu } from "./CarouselItemContextMenu";
import EditableArtifactTitle from "@/components/artifacts/EditableArtifactTitle";
import { Button } from "@/components/ui/button";
import type { Artifact } from "@/types";

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
  contentType?: "image" | "video" | "url" | "titleCard" | "pdf" | "figma";
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
    collection_items?: string[];
    is_expanded?: boolean;
  };
  allArtifacts?: Artifact[];
  onUpdateMetadata?: (updates: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  }) => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  onDelete?: () => void;
  onReplaceMedia?: (file: File) => Promise<void>;
  onEdit?: () => void;
  onFocus?: () => void;
  onToggleCollection?: (collectionId: string) => Promise<void>;
  isFocused?: boolean;
  isReadOnly?: boolean;
  isAnyDragging?: boolean;
  isSettling?: boolean;
  fitMode?: boolean;
  isCollectionMode?: boolean;
  isHoveredForCollection?: boolean;
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
      allArtifacts = [],
      onUpdateMetadata,
      onUpdateTitle,
      onDelete,
      onReplaceMedia,
      onEdit,
      onFocus,
      onToggleCollection,
      isFocused = false,
      isReadOnly = false,
      isAnyDragging = false,
      isSettling = false,
      fitMode = false,
      isCollectionMode = false,
      isHoveredForCollection = false,
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

    // Check if this is a collection
    const collectionItems = (metadata as any)?.collection_items as
      | string[]
      | undefined;
    const isCollection = collectionItems && collectionItems.length > 0;
    const isExpanded = (metadata as any)?.is_expanded || false;
    // Collection count includes the header itself + items in collection_items
    const collectionCount = isCollection
      ? (collectionItems?.length || 0) + 1
      : 0;

    // Handle double-click to expand/collapse collection
    const handleDoubleClick = (e: React.MouseEvent) => {
      if (isCollection && onToggleCollection && !isReadOnly) {
        e.stopPropagation();
        e.preventDefault();
        onToggleCollection(id.toString());
      }
    };

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
        ${isCollectionMode ? "collection-mode" : ""}
        ${isHoveredForCollection ? "hovered-for-collection" : ""}
        ${isCollection && !isExpanded ? "is-collection" : ""}
        ${isCollection && isExpanded ? "is-collection-expanded" : ""}
      `}
        data-collection-child={
          (metadata as any)?.parent_collection_id ? "true" : undefined
        }
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
              <EditableArtifactTitle
                title={name}
                artifactId={id.toString()}
                onUpdate={onUpdateTitle}
                artifactType={type}
                sourceUrl={url}
                readOnly={isReadOnly || !onUpdateTitle}
              />
            </div>
            <div className="flex items-center gap-1">
              {onFocus && !isReadOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocus();
                  }}
                  aria-label={fitMode ? "Restore view" : "Focus on this item"}
                >
                  {fitMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
              )}
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
          onDoubleClick={handleDoubleClick}
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
          {isHoveredForCollection && (
            <div className="collection-indicator">
              <FolderPlus size={32} />
              <span>Add to Collection</span>
            </div>
          )}
          {clone && isCollectionMode && (
            <div className="collection-mode-badge">
              <FolderPlus size={20} />
              <span>Collection Mode</span>
            </div>
          )}
          {/* {isCollection && !isExpanded && (
            <div className="collection-badge">
              <div className="collection-badge-count">{collectionCount}</div>
              <div className="collection-badge-label">items</div>
            </div>
          )} */}
        </div>
        {isCollection && !isExpanded && (
          <div className="collection-stack-indicator">
            <div
              className="stack-layer"
              style={{
                bottom: "-10px",
                height: "50px",
                transform: "scale(0.97 )",
                transformOrigin: "bottom center",
                backgroundColor: "rgba(60, 60, 60, 1)",
              }}
            />
          </div>
        )}
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
