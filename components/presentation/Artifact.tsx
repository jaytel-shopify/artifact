"use client";

import React, { useRef, useEffect, useState } from "react";
import type { Artifact as ArtifactType } from "@/types";

interface ArtifactProps {
  artifact: ArtifactType;
  className?: string;
}

function ArtifactImage({
  url,
  alt,
  width,
  height,
}: {
  url: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <img
      src={url}
      alt={alt}
      className="class=max-w-full max-h-full w-auto h-auto object-contain rounded-card overflow-hidden max-h-full"
      draggable={false}
      width={width}
      height={height}
    />
  );
}

function ArtifactVideo({
  url,
  muted = true,
  loop = false,
  showControls = true,
  width,
  height,
}: {
  url: string;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
  width?: number;
  height?: number;
}) {
  return (
    <video
      src={url}
      className="max-w-full max-h-full object-contain"
      autoPlay
      muted={muted}
      loop={loop}
      controls={showControls}
      playsInline
      width={width}
      height={height}
    />
  );
}

function ArtifactWebsite({
  url,
  width = 1920,
  height = 1080,
  fitMode = true,
}: {
  url: string;
  width?: number;
  height?: number;
  fitMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;

        // Use Math.min to "contain" (fit within bounds)
        const newScale = fitMode
          ? Math.min(scaleX, scaleY)
          : Math.max(scaleX, scaleY) * 1.01;

        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(containerRef.current);
    }

    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver?.disconnect();
      clearTimeout(timer);
    };
  }, [width, height, fitMode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <iframe
        src={url}
        width={width}
        height={height}
        style={{
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: fitMode ? "top center" : "top left",
        }}
        allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
        title={url}
      />
    </div>
  );
}

function ArtifactTitleCard({
  headline,
  subheadline,
}: {
  headline?: string;
  subheadline?: string;
}) {
  return (
    <div className="w-full h-full aspect-video bg-secondary flex items-center justify-center">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl">
        {headline && (
          <h1 className="text-2xl font-semibold text-text-primary mb-4">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="text-lg text-text-secondary leading-relaxed">
            {subheadline}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Artifact({ artifact, className = "" }: ArtifactProps) {
  const baseClasses = `${className}`;

  switch (artifact.type) {
    case "image":
    case "pdf":
    case "figma":
      return (
        <div className={`${baseClasses}`}>
          <ArtifactImage
            url={artifact.source_url}
            alt={artifact.name}
            width={artifact.metadata.width as number}
            height={artifact.metadata.height as number}
          />
        </div>
      );

    case "video":
      const videoMeta = artifact.metadata as {
        hideUI?: boolean;
        loop?: boolean;
        muted?: boolean;
      };
      return (
        <div className={baseClasses}>
          <ArtifactVideo
            url={artifact.source_url}
            muted={videoMeta?.muted !== false}
            loop={videoMeta?.loop || false}
            showControls={!videoMeta?.hideUI}
            width={artifact.metadata.width as number}
            height={artifact.metadata.height as number}
          />
        </div>
      );

    case "url":
      const urlMeta = artifact.metadata as {
        width?: number;
        height?: number;
      };
      return (
        <div className={baseClasses}>
          <ArtifactWebsite
            url={artifact.source_url}
            width={urlMeta?.width}
            height={urlMeta?.height}
            fitMode={false}
          />
        </div>
      );

    case "titleCard":
      const titleMeta = artifact.metadata as {
        headline?: string;
        subheadline?: string;
      };
      return (
        <div className={baseClasses}>
          <ArtifactTitleCard
            headline={titleMeta?.headline}
            subheadline={titleMeta?.subheadline}
          />
        </div>
      );

    default:
      return (
        <div className={baseClasses}>
          <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
            <span className="text-text-secondary">Unknown artifact type</span>
          </div>
        </div>
      );
  }
}
