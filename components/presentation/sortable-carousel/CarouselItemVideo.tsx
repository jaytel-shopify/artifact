import React from "react";

interface CarouselItemVideoProps {
  url: string;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
}

export function CarouselItemVideo({
  url,
  muted = true,
  loop = false,
  showControls = true,
}: CarouselItemVideoProps) {
  return (
    <video
      src={url}
      className="carousel-item-content"
      style={{
        pointerEvents: showControls ? "auto" : "none",
      }}
      autoPlay
      muted={muted}
      loop={loop}
      controls={showControls}
      playsInline
    />
  );
}
