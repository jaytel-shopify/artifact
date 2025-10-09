import React from "react";

interface CarouselItemWebsiteProps {
  url: string;
}

export function CarouselItemWebsite({ url }: CarouselItemWebsiteProps) {
  return (
    <div className="carousel-item-content carousel-item-url-preview">
      <span>🌐</span>
    </div>
  );
}
