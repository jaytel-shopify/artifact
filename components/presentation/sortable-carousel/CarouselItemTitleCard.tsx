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
    <div className="@container w-full h-full aspect-video bg-neutral-900">
      <div className="w-full h-full flex flex-col items-center justify-center p-2 @[400px]:p-4 @[600px]:p-4 @[800px]:p-6 text-center">
        {headline && (
          <h1 className="text-[4cqw] font-bold text-white mb-2">{headline}</h1>
        )}
        {subheadline && (
          <p className="text-[2.5cqw] font-bold text-neutral-400 leading-relaxed">
            {subheadline}
          </p>
        )}
      </div>
    </div>
  );
}
