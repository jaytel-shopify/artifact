import React from "react";
import { CarouselItemImage } from "./CarouselItemImage";
import { CarouselItemVideo } from "./CarouselItemVideo";
import { CarouselItemWebsite } from "./CarouselItemWebsite";
import { CarouselItemTitleCard } from "./CarouselItemTitleCard";

interface CarouselItemContentProps {
  type: "image" | "video" | "url" | "titleCard" | "pdf" | "figma";
  url: string;
  alt: string;
  width?: number;
  height?: number;
  isDragging?: boolean;
  metadata?: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
    headline?: string;
    subheadline?: string;
  };
  fitMode?: boolean;
}

export const CarouselItemContent = React.memo(
  function CarouselItemContent({
    type,
    url,
    alt,
    width,
    height,
    isDragging = false,
    metadata,
    fitMode = false,
  }: CarouselItemContentProps) {
    switch (type) {
      case "image":
      case "pdf":
      case "figma":
        return <CarouselItemImage url={url} alt={alt} />;
      case "video":
        return (
          <CarouselItemVideo
            url={url}
            muted={metadata?.muted !== false}
            loop={metadata?.loop || false}
            showControls={!metadata?.hideUI}
            isDragging={isDragging}
          />
        );
      case "url":
        return (
          <CarouselItemWebsite
            url={url}
            width={width}
            height={height}
            isDragging={isDragging}
            fitMode={fitMode}
          />
        );
      case "titleCard":
        return (
          <CarouselItemTitleCard
            headline={metadata?.headline}
            subheadline={metadata?.subheadline}
          />
        );
      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    // Custom comparison: only compare props that affect the media rendering
    // Ignore isDragging and alt changes which don't require media reload
    return (
      prevProps.type === nextProps.type &&
      prevProps.url === nextProps.url &&
      // Skip alt and isDragging - they don't affect media rendering
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.fitMode === nextProps.fitMode &&
      // Only compare metadata fields that affect rendering
      prevProps.metadata?.hideUI === nextProps.metadata?.hideUI &&
      prevProps.metadata?.loop === nextProps.metadata?.loop &&
      prevProps.metadata?.muted === nextProps.metadata?.muted &&
      prevProps.metadata?.headline === nextProps.metadata?.headline &&
      prevProps.metadata?.subheadline === nextProps.metadata?.subheadline
    );
  }
);
