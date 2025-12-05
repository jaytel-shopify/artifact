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
import {
  getCollectionMetadata,
  getCollectionArtifacts,
} from "@/lib/collection-utils";

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
    collection_id?: string;
  };
  allArtifacts?: Artifact[];
  expandedCollections?: Set<string>;
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
  onPublish?: () => Promise<void>;
  isFocused?: boolean;
  isReadOnly?: boolean;
  isAnyDragging?: boolean;
  isSettling?: boolean;
  fitMode?: boolean;
  isCollectionMode?: boolean;
  isHoveredForCollection?: boolean;
  isBeingAddedToCollection?: boolean;
  isJustExpanded?: boolean;
  shouldHide?: boolean;
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
      expandedCollections,
      onUpdateMetadata,
      onUpdateTitle,
      onDelete,
      onReplaceMedia,
      onEdit,
      onFocus,
      onToggleCollection,
      onPublish,
      isFocused = false,
      isReadOnly = false,
      isAnyDragging = false,
      isSettling = false,
      fitMode = false,
      isCollectionMode = false,
      isHoveredForCollection = false,
      isBeingAddedToCollection = false,
      isJustExpanded = false,
      shouldHide = false,
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

    // Check if this is part of a collection
    const itemMetadata = getCollectionMetadata({
      id: id.toString(),
      metadata,
    } as Artifact);
    const collectionId = itemMetadata.collection_id;
    const isInCollection = !!collectionId;

    // Find all items in this collection
    const collectionArtifacts =
      isInCollection && allArtifacts
        ? getCollectionArtifacts(collectionId!, allArtifacts)
        : [];

    // This item is the "first" in collection if it's in a collection and is index 0
    const isCollectionFirst =
      isInCollection &&
      collectionArtifacts.length > 0 &&
      collectionArtifacts[0].id === id.toString();

    // Check if expanded using the passed-in state (not metadata)
    const isExpanded =
      collectionId && expandedCollections
        ? expandedCollections.has(collectionId)
        : false;
    const collectionCount = collectionArtifacts.length;

    // Handle double-click to expand/collapse collection
    const handleDoubleClick = (e: React.MouseEvent) => {
      if (
        isCollectionFirst &&
        collectionId &&
        onToggleCollection &&
        !isReadOnly
      ) {
        e.stopPropagation();
        e.preventDefault();
        onToggleCollection(collectionId);
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
        ${isCollectionFirst && !isExpanded ? "is-collection" : ""}
        ${isCollectionFirst && isExpanded ? "is-collection-expanded" : ""}
        ${shouldHide ? "collection-child-hidden" : ""}
        ${isJustExpanded ? "just-expanded" : ""}
      `}
        data-collection-child={
          isInCollection && !isCollectionFirst ? "true" : undefined
        }
        style={{
          ...style,
          // For collapsed collections, aspect-ratio goes on carousel-item via CSS var
          aspectRatio:
            isUrl && contentWidth && contentHeight && !(isCollectionFirst && !isExpanded)
              ? `${contentWidth} / ${contentHeight}`
              : "",
          // @ts-expect-error - CSS custom property
          "--url-aspect-ratio":
            isUrl && contentWidth && contentHeight
              ? `${contentWidth} / ${contentHeight}`
              : undefined,
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
            <div className="flex items-center gap-2">
              {onFocus && !isReadOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="carousel-item-focus-button h-6 w-6 p-0 text-text-secondary hover:text-text-primary hover:bg-secondary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocus();
                  }}
                  aria-label={fitMode ? "Restore view" : "Focus on this item"}
                >
                  {fitMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
              )}
              {!isReadOnly && (
                <div className="carousel-item-drag-handle" ref={dragHandleRef}>
                  <GripVertical size={16} />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="carousel-item-content-wrapper">
          {/* Stack card div - only rendered for collapsed collection first item */}
          {isCollectionFirst && !isExpanded && !active && !isSettling && (
            <div className="collection-stack-card" />
          )}
          <div
            className="carousel-item"
            data-id={id.toString()}
            data-content-type={type}
            onDoubleClick={handleDoubleClick}
            {...props}
          >
            {!isBeingAddedToCollection && (
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
            )}
            {clone && isCollectionMode && (
              <div className="collection-mode-badge">
                <FolderPlus size={20} />
                <span>Add to Collection</span>
              </div>
            )}
          </div>
        </div>
      </li>
    );

    // Don't show context menu for collapsed collections (they represent multiple items)
    const isCollapsedCollection = isCollectionFirst && !isExpanded;

    if (isCollapsedCollection) {
      return contentElement;
    }

    return (
      <CarouselItemContextMenu
        contentType={type}
        metadata={metadata}
        onUpdateMetadata={onUpdateMetadata}
        onReplaceMedia={onReplaceMedia}
        onEdit={onEdit}
        onDelete={onDelete}
        onPublish={onPublish}
        isReadOnly={isReadOnly}
      >
        {contentElement}
      </CarouselItemContextMenu>
    );
  }
);
