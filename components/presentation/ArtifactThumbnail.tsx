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
    aspect-square rounded-2xl 
    flex items-center justify-center overflow-hidden
    shadow-sm
    ${className}
  `;

  switch (artifact.type) {
    case "image":
      return (
        <div className={baseClasses}>
          <img
            src={artifact.source_url}
            alt={artifact.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );

    case "url":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
            <Globe className="w-8 h-8 text-blue-400" />
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
            />
          </div>
        );
      }
      // Fallback to play icon if no thumbnail
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-red-500/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-red-400" />
          </div>
        </div>
      );

    case "figma":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center text-lg">
              F
            </div>
          </div>
        </div>
      );

    case "titleCard":
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
            <Type className="w-8 h-8 text-white" />
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-gray-500/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded-lg" />
          </div>
        </div>
      );
  }
}
