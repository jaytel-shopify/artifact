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
      className="max-w-full max-h-full w-auto h-auto object-contain rounded-card overflow-hidden"
      loading="lazy"
      draggable={false}
      width={width}
      height={height}
      style={{ viewTransitionName: "artifact-component" }}
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
      className="w-auto h-auto max-w-full max-h-full object-contain rounded-card overflow-hidden"
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const parentEl = wrapperRef.current.parentElement;
        if (!parentEl) return;

        const availableWidth = parentEl.clientWidth;
        const availableHeight = parentEl.clientHeight;

        const scaleX = availableWidth / width;
        const scaleY = availableHeight / height;

        // Use Math.min to "contain" (fit within bounds)
        const newScale = fitMode
          ? Math.min(scaleX, scaleY)
          : Math.max(scaleX, scaleY) * 1.01;

        // Calculate the actual displayed size
        const displayWidth = width * newScale;
        const displayHeight = height * newScale;

        setScale(newScale);
        setContainerSize({ width: displayWidth, height: displayHeight });
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    let resizeObserver: ResizeObserver | null = null;
    if (wrapperRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(wrapperRef.current.parentElement);
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
      ref={wrapperRef}
      className="overflow-hidden relative"
      style={{
        width: containerSize.width || "100%",
        height: containerSize.height || "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
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
          <h1 className="text-2xl font-semibold text-text-primary mb-4 select-none">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="text-lg text-text-secondary leading-relaxed select-none">
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
        <div className={`${baseClasses} w-full h-full`}>
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
