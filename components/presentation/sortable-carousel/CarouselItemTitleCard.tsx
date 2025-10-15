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
    <div className="@container w-full h-full aspect-video flex flex-col items-start justify-start bg-neutral-900 p-4 text-left">
      {headline && (
        <h1 className="text-[11px] @xs:text-sm @sm:text-base @md:text-lg @lg:text-xl font-bold text-white mb-2 leading-tight">
          {headline}
        </h1>
      )}
      {subheadline && (
        <p className="text-[9px] @xs:text-xs @sm:text-sm @md:text-base @lg:text-lg text-white leading-relaxed">
          {subheadline}
        </p>
      )}
    </div>
  );
}
