"use client";

import { Globe, Play } from "lucide-react";
import { useRef, useEffect } from "react";
import { useVideoPool } from "@/hooks/useVideoPool";
import type { Artifact } from "@/types";

interface ArtifactThumbnailProps {
  artifact: Artifact;
  className?: string;
  activeViewTransition?: boolean;
}

export default function ArtifactThumbnail({
  artifact,
  className = "",
  activeViewTransition = false,
}: ArtifactThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { requestVideo, releaseVideo } = useVideoPool();

  // Auto-play video when in viewport
  useEffect(() => {
    if (artifact.type !== "video") return;
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestVideo(
            `thumbnail-${artifact.id}`,
            artifact.source_url,
            element
          );
        } else {
          releaseVideo();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      releaseVideo();
    };
  }, [
    artifact.id,
    artifact.source_url,
    artifact.type,
    requestVideo,
    releaseVideo,
  ]);

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
              width={artifact.metadata.width}
              height={artifact.metadata.height}
            />
          </div>
        );
      }
      // Fallback to Globe icon if no thumbnail
      return (
        <div className={baseClasses}>
          <div
            className="w-full h-full bg-secondary/20 flex items-center justify-center"
            style={{
              aspectRatio: `${artifact.metadata.width || 16}/${artifact.metadata.height || 9}`,
            }}
          >
            <Globe className="w-8 h-8 text-text-secondary" />
          </div>
        </div>
      );

    case "video":
      // Check if thumbnail is available in metadata
      const thumbnailUrl = (artifact.metadata as any)?.thumbnail_url;
      if (thumbnailUrl) {
        return (
          <div ref={containerRef} className={`${baseClasses} relative`}>
            <img
              src={thumbnailUrl}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
              width={artifact.metadata.width}
              height={artifact.metadata.height}
            />
          </div>
        );
      }
      // Fallback to play icon if no thumbnail
      return (
        <div className={baseClasses}>
          <div
            className="w-full h-full bg-destructive/20 flex items-center justify-center"
            style={{
              aspectRatio: `${artifact.metadata.width || 16}/${artifact.metadata.height || 9}`,
            }}
          >
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
        <div className={`${baseClasses} @container`}>
          <div className="w-full h-full bg-primary flex flex-col gap-[1cqw] items-center justify-center aspect-[16/9]">
            <p className="text-text-primary text-small text-[clamp(0.5rem,6cqw,3rem)] text-balance">
              {artifact.metadata.headline}
            </p>
            <p className="text-text-secondary text-small text-[clamp(0.25rem,6cqw,3rem)] text-balance">
              {artifact.metadata.subheadline}
            </p>
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
