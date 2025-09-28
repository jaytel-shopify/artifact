"use client";

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      className="w-full h-auto"
    />
  );
}


