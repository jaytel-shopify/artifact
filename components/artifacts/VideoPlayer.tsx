"use client";

import { useRef, useEffect } from 'react';

interface VideoMetadata {
  hideUI?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export default function VideoPlayer({ 
  src, 
  poster, 
  metadata 
}: { 
  src: string; 
  poster?: string; 
  metadata?: VideoMetadata 
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showControls = !metadata?.hideUI;
  const shouldLoop = metadata?.loop || false;
  const shouldMute = metadata?.muted !== false; // Default to muted

  // Auto-play looping videos when component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoop) return;

    // Auto-play looping videos (works because they're muted by default)
    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        // Auto-play blocked - user will need to manually start
        console.log('Auto-play blocked for looping video:', error);
      }
    };

    // Wait for video to load metadata before attempting to play
    if (video.readyState >= 1) {
      playVideo();
    } else {
      video.addEventListener('loadedmetadata', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', playVideo);
    };
  }, [shouldLoop, src]);

  const handleVideoClick = () => {
    if (showControls) return; // Let default controls handle it
    
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls={showControls}
      loop={shouldLoop}
      muted={shouldMute}
      playsInline
      className="w-full h-auto cursor-pointer"
      onClick={handleVideoClick}
    />
  );
}


