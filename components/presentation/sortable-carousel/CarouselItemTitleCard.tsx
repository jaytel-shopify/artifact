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
      <div className="w-full h-full flex flex-col items-center justify-center p-2 @[400px]:p-4 @[600px]:p-4 @[800px]:p-6 text-center">
        {headline && (
          <h1 className="text-medium text-[min(4cqw,2rem)] text-text-primary mb-2 select-none">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="text-small text-[min(2cqw,1rem)] text-text-secondary leading-relaxed select-none">
            {subheadline}
          </p>
        )}
      </div>
    </div>
  );
}
