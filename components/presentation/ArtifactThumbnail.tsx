"use client";

import { Globe, Play, Type } from "lucide-react";
import { useRef, useCallback } from "react";
import { useVideoPool } from "@/hooks/useVideoPool";
import type { Artifact } from "@/types";

interface ArtifactThumbnailProps {
  artifact: Artifact;
  className?: string;
  activeViewTransition?: boolean;
  /** Enable video playback on hover (default: true for video artifacts) */
  enableVideoHover?: boolean;
}

export default function ArtifactThumbnail({
  artifact,
  className = "",
  activeViewTransition = false,
  enableVideoHover = true,
}: ArtifactThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { requestVideo, releaseVideo } = useVideoPool();

  const handleMouseEnter = useCallback(() => {
    if (artifact.type !== "video" || !enableVideoHover) return;
    if (!containerRef.current) return;

    requestVideo(
      `thumbnail-${artifact.id}`,
      artifact.source_url,
      containerRef.current
    );
  }, [
    artifact.id,
    artifact.source_url,
    artifact.type,
    enableVideoHover,
    requestVideo,
  ]);

  const handleMouseLeave = useCallback(() => {
    if (artifact.type !== "video" || !enableVideoHover) return;
    releaseVideo();
  }, [artifact.type, enableVideoHover, releaseVideo]);

  const baseClasses = `
    shadow-sm
    overflow-hidden
    ${className}
  `;

  switch (artifact.type) {
    case "image":
      return (
        <div className={baseClasses}>
          <img
            src={artifact.source_url}
            alt={artifact.name}
            loading="lazy"
            width={artifact.metadata.width}
            height={artifact.metadata.height}
            className="w-full"
            style={{
              viewTransitionName: activeViewTransition
                ? "artifact-component"
                : undefined,
            }}
          />
        </div>
      );

    case "url":
      const urlThumbnail = (artifact.metadata as any)?.thumbnail_url;
      if (urlThumbnail) {
        return (
          <div className={baseClasses}>
            <img
              src={urlThumbnail}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        );
      }
      // Fallback to Globe icon if no thumbnail
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
          <div
            ref={containerRef}
            className={`${baseClasses} relative`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={thumbnailUrl}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
              width={artifact.metadata.width}
              height={artifact.metadata.height}
            />
            {/* Play icon indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-60 group-hover:opacity-0 transition-opacity duration-200">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
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
