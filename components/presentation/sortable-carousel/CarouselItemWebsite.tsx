import React, { useRef, useEffect, useState } from "react";

interface CarouselItemWebsiteProps {
  url: string;
  width?: number;
  height?: number;
  isDragging?: boolean;
}

export function CarouselItemWebsite({
  url,
  width = 1920,
  height = 1080,
  isDragging = false,
}: CarouselItemWebsiteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // Calculate scale and add small buffer to prevent white borders
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const newScale = Math.max(scaleX, scaleY) * 1.01; // 1% buffer

        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    // Use ResizeObserver to detect container size changes (when slider changes)
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(containerRef.current);
    }

    // Small delay to ensure container is sized
    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver?.disconnect();
      clearTimeout(timer);
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className="carousel-item-content"
      style={{
        overflow: "hidden",
        pointerEvents: isDragging ? "none" : "auto",
      }}
    >
      <iframe
        src={url}
        width={width}
        height={height}
        style={{
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: isDragging ? "none" : "auto",
        }}
        allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
        title={url}
      />
    </div>
  );
}
