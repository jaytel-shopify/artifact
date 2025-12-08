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
          <h1 className="font-semibold text-[5.729cqw] text-text-primary mb-[3cqw] select-none text-balance leading-[1.05]">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="text-small text-[2.708cqw] text-text-secondary select-none text-balance leading-[1.40]">
            {subheadline}
          </p>
        )}
      </div>
    </div>
  );
}
