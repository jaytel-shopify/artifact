import React from "react";

interface CarouselItemImageProps {
  url: string;
  alt: string;
}

export function CarouselItemImage({ url, alt }: CarouselItemImageProps) {
  return (
    <img
      src={url}
      alt={alt}
      className="carousel-item-content"
      draggable={false}
    />
  );
}
