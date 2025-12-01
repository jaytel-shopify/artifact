"use client";

import { Globe, Play, FileText, Type } from "lucide-react";
import type { Artifact } from "@/types";

interface ArtifactThumbnailProps {
  artifact: Artifact;
  className?: string;
  onLoad?: ({ width, height }: { width: number; height: number }) => void;
}

export default function ArtifactThumbnail({
  artifact,
  className = "",
  onLoad,
}: ArtifactThumbnailProps) {
  const baseClasses = `
    shadow-sm
    overflow-hidden
    ${className}
  `;

  function handleOnLoad(e: React.SyntheticEvent<EventTarget>) {
    onLoad?.({
      width: (e.target as HTMLImageElement).naturalWidth,
      height: (e.target as HTMLImageElement).naturalHeight,
    });
  }

  switch (artifact.type) {
    case "image":
      return (
        <div className={baseClasses}>
          <img
            src={artifact.source_url}
            alt={artifact.name}
            loading="lazy"
            onLoad={handleOnLoad}
            width={artifact.metadata.width}
            height={artifact.metadata.height}
          />
        </div>
      );

    case "url":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-secondary/20 flex items-center justify-center aspect-[16/11]">
            <Globe className="w-8 h-8 text-text-secondary" />
          </div>
        </div>
      );

    case "video":
      // Check if thumbnail is available in metadata
      const thumbnailUrl = (artifact.metadata as any)?.thumbnail_url;
      if (thumbnailUrl) {
        return (
          <div className={baseClasses}>
            <img
              src={thumbnailUrl}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={handleOnLoad}
              width={artifact.metadata.width}
              height={artifact.metadata.height}
            />
          </div>
        );
      }
      // Fallback to play icon if no thumbnail
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-destructive/20 flex items-center justify-center aspect-[16/9]">
            <Play className="w-8 h-8 text-destructive" />
          </div>
        </div>
      );

    case "figma":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-primary flex items-center justify-center aspect-[16/9]">
            <div className="w-8 h-8 bg-primary text-text-primary font-bold rounded-card-inner flex items-center justify-center text-medium">
              F
            </div>
          </div>
        </div>
      );

    case "titleCard":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-gradient-to-br from-secondary to-card flex items-center justify-center aspect-[16/9]">
            <Type className="w-8 h-8 text-text-primary" />
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-secondary-foreground rounded-card-inner" />
          </div>
        </div>
      );
  }
}
