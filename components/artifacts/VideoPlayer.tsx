"use client";

import { useRef, useEffect } from 'react';

interface VideoMetadata {
  hideUI?: boolean;
  loop?: boolean;
  muted?: boolean;
}

// Global state to preserve video times across re-mounts during drag operations
const videoTimesMap = new Map<string, { time: number; wasPlaying: boolean }>();

export default function VideoPlayer({ 
  src, 
  poster, 
  metadata,
  fitMode = false,
}: { 
  src: string; 
  poster?: string; 
  metadata?: VideoMetadata;
  fitMode?: boolean;
}) {
  console.log('[VideoPlayer] Rendering for src:', src.slice(0, 50));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const showControls = !metadata?.hideUI;
  const shouldLoop = metadata?.loop || false;
  const shouldMute = metadata?.muted !== false; // Default to muted
  
  // Track mount/unmount and save/restore video time
  useEffect(() => {
    console.log('[VideoPlayer] MOUNTED for src:', src.slice(0, 50));
    const video = videoRef.current;
    
    // Restore saved time if this video was recently unmounted
    const savedState = videoTimesMap.get(src);
    if (savedState && video) {
      console.log('[VideoPlayer] Restoring saved time:', savedState.time, 'wasPlaying:', savedState.wasPlaying);
      video.currentTime = savedState.time;
      if (savedState.wasPlaying) {
        video.play().catch(() => {
          console.log('[VideoPlayer] Could not auto-play after restore');
        });
      }
      videoTimesMap.delete(src);
    }
    
    return () => {
      console.log('[VideoPlayer] UNMOUNTED for src:', src.slice(0, 50));
      // Save current time and playing state when unmounting
      if (video) {
        const wasPlaying = !video.paused && !video.ended;
        videoTimesMap.set(src, { time: video.currentTime, wasPlaying });
        console.log('[VideoPlayer] Saved time on unmount:', video.currentTime, 'wasPlaying:', wasPlaying);
      }
    };
  }, [src]);

  // Auto-play looping videos when component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoop) return;

    // Auto-play looping videos (works because they're muted by default)
    const playVideo = async () => {
      // Don't auto-play if video has been seeked (e.g., restored from saved state)
      const savedState = videoTimesMap.get(src);
      if (video.currentTime > 0.1 || savedState) {
        console.log('[VideoPlayer] Skipping auto-play - video already has currentTime:', video.currentTime, 'or saved state exists');
        return;
      }
      
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
      className={fitMode ? "cursor-pointer" : "w-full h-auto cursor-pointer"}
      style={fitMode ? {
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 194px)', // viewport - header(64) - topPadding(12) - title(30) - titleMargin(24) - bottomPadding(64)
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
      } : undefined}
      onClick={handleVideoClick}
    />
  );
}


