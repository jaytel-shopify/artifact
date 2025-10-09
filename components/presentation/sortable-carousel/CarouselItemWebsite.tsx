import React from "react";

interface CarouselItemWebsiteProps {
  url: string;
  width?: number;
  height?: number;
}

export function CarouselItemWebsite({
  url,
  width = 1920,
  height = 1080,
}: CarouselItemWebsiteProps) {
  // Calculate scale to fit the carousel height (200px)
  const CAROUSEL_HEIGHT = 200;
  const scale = CAROUSEL_HEIGHT / height;

  return (
    <div
      className="carousel-item-content"
      style={{
        position: "relative",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "auto",
        }}
      >
        <iframe
          src={url}
          width={width}
          height={height}
          style={{
            border: 0,
            width: "100%",
            height: "100%",
          }}
          allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer-when-downgrade"
          title={url}
        />
      </div>
    </div>
  );
}
