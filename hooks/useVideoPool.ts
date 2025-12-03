"use client";

import { useRef, useCallback, useEffect } from 'react';
import { videoPoolManager, VideoRequest } from '@/lib/video-pool-manager';

/**
 * Hook for requesting video elements from the video pool.
 * Automatically handles cleanup when component unmounts.
 */
export function useVideoPool() {
  const requestIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Initialize pool on first use
  useEffect(() => {
    videoPoolManager.init();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (requestIdRef.current) {
        videoPoolManager.release(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, []);

  const requestVideo = useCallback((
    requestId: string,
    sourceUrl: string,
    container: HTMLElement,
    callbacks?: Pick<VideoRequest, 'onAssigned' | 'onReleased'>
  ) => {
    // Release any existing video first
    if (requestIdRef.current && requestIdRef.current !== requestId) {
      videoPoolManager.release(requestIdRef.current);
    }

    requestIdRef.current = requestId;
    containerRef.current = container;

    return videoPoolManager.request({
      id: requestId,
      sourceUrl,
      container,
      ...callbacks,
    });
  }, []);

  const releaseVideo = useCallback(() => {
    if (requestIdRef.current) {
      videoPoolManager.release(requestIdRef.current);
      requestIdRef.current = null;
      containerRef.current = null;
    }
  }, []);

  return {
    requestVideo,
    releaseVideo,
    getStats: () => videoPoolManager.getStats(),
  };
}

