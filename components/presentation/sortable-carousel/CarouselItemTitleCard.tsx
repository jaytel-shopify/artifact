import React from "react";

interface CarouselItemTitleCardProps {
  headline?: string;
  subheadline?: string;
}

export function CarouselItemTitleCard({
  headline,
  subheadline,
}: CarouselItemTitleCardProps) {
  return (
    <div className="@container w-full h-full aspect-video bg-primary border-border border">
      <div className="w-full h-full flex flex-col items-center justify-center p-[6cqw] text-center">
        {headline && (
          <h1 className="text-medium text-[clamp(0.5rem,6cqw,3rem)] text-text-primary mb-[2cqw] select-none text-balance">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="text-small text-[clamp(0.25rem,4cqw,2rem)] text-text-secondary leading-relaxed select-none text-balance">
            {subheadline}
          </p>
        )}
      </div>
    </div>
  );
}
