import React from "react";
import { CarouselItemImage } from "./CarouselItemImage";
import { CarouselItemVideo } from "./CarouselItemVideo";
import { CarouselItemWebsite } from "./CarouselItemWebsite";

interface CarouselItemContentProps {
  type: "image" | "video" | "url";
  url: string;
  alt: string;
  metadata?: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
}

export function CarouselItemContent({
  type,
  url,
  alt,
  metadata,
}: CarouselItemContentProps) {
  switch (type) {
    case "image":
      return <CarouselItemImage url={url} alt={alt} />;
    case "video":
      return (
        <CarouselItemVideo
          url={url}
          muted={metadata?.muted !== false}
          loop={metadata?.loop || false}
          showControls={!metadata?.hideUI}
        />
      );
    case "url":
      return <CarouselItemWebsite url={url} />;
    default:
      return null;
  }
}
