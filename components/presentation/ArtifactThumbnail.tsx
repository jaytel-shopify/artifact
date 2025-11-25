"use client";

import { Globe, Play, FileText, Type } from "lucide-react";
import type { Artifact } from "@/types";

interface ArtifactThumbnailProps {
  artifact: Artifact;
  className?: string;
}

export default function ArtifactThumbnail({
  artifact,
  className = "",
}: ArtifactThumbnailProps) {
  const baseClasses = `
    rounded-sm 
    shadow-sm
    overflow-hidden
    ${className}
  `;

  switch (artifact.type) {
    case "image":
      return (
        <div className={baseClasses}>
          <img src={artifact.source_url} alt={artifact.name} loading="lazy" />
        </div>
      );

    case "url":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-muted/20 flex items-center justify-center aspect-[16/11]">
            <Globe className="w-8 h-8 text-muted-foreground" />
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
              className="w-full h-full object-cover aspect-[16/9]"
              loading="lazy"
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
          <div className="w-full h-full bg-chart-4/20 flex items-center justify-center aspect-[16/9]">
            <div className="w-8 h-8 bg-chart-4 text-primary-foreground font-bold rounded-lg flex items-center justify-center text-lg">
              F
            </div>
          </div>
        </div>
      );

    case "titleCard":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-gradient-to-br from-secondary to-card flex items-center justify-center aspect-[16/9]">
            <Type className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-muted/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground rounded-lg" />
          </div>
        </div>
      );
  }
}
