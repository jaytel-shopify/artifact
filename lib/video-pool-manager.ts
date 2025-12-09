/**
 * VideoPoolManager - Manages a pool of reusable video elements
 * for efficient memory usage when displaying many video thumbnails.
 *
 * Dynamically scales the pool when more videos are requested.
 * Uses LRU (Least Recently Used) eviction only when max pool size is reached.
 */

export type VideoRequest = {
  id: string;
  sourceUrl: string;
  container: HTMLElement;
  onAssigned?: (video: HTMLVideoElement) => void;
  onReleased?: () => void;
};

type PooledVideo = {
  element: HTMLVideoElement;
  requestId: string | null;
  assignedAt: number;
};

class VideoPoolManager {
  private pool: PooledVideo[] = [];
  private minPoolSize: number;
  private maxPoolSize: number;
  private activeRequests: Map<string, PooledVideo> = new Map();
  private initialized = false;

  constructor(minPoolSize = 5, maxPoolSize = 50) {
    this.minPoolSize = minPoolSize;
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Create a new video element with standard configuration
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.autoplay = true;

    // Style for overlay positioning
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease-out;
      z-index: 1;
    `;

    return video;
  }

  /**
   * Initialize the pool - creates initial video elements
   * Should be called once when the app mounts
   */
  init() {
    if (this.initialized || typeof document === "undefined") return;

    for (let i = 0; i < this.minPoolSize; i++) {
      this.pool.push({
        element: this.createVideoElement(),
        requestId: null,
        assignedAt: 0,
      });
    }

    this.initialized = true;
  }

  /**
   * Request a video element for a given container
   * Dynamically grows the pool if needed, up to maxPoolSize
   * Returns the video element or null if max pool size reached and eviction fails
   */
  request(request: VideoRequest): HTMLVideoElement | null {
    if (!this.initialized) this.init();

    // Check if this request already has a video assigned
    const existing = this.activeRequests.get(request.id);
    if (existing) {
      existing.assignedAt = Date.now();
      return existing.element;
    }

    // Try to find an available video in the pool
    let pooledVideo = this.pool.find((pv) => pv.requestId === null);

    // If no available video, try to grow the pool
    if (!pooledVideo && this.pool.length < this.maxPoolSize) {
      pooledVideo = {
        element: this.createVideoElement(),
        requestId: null,
        assignedAt: 0,
      };
      this.pool.push(pooledVideo);
    }

    // If still no available video (max pool size reached), evict the LRU
    if (!pooledVideo) {
      pooledVideo = this.evictLRU();
    }

    if (!pooledVideo) return null;

    // Assign the video to this request
    pooledVideo.requestId = request.id;
    pooledVideo.assignedAt = Date.now();
    this.activeRequests.set(request.id, pooledVideo);

    const video = pooledVideo.element;

    // Update video source if different
    if (video.src !== request.sourceUrl) {
      video.src = request.sourceUrl;
      video.load();
    }

    // Append to container and show
    request.container.appendChild(video);

    // Trigger reflow then fade in
    video.offsetHeight;
    video.style.opacity = "1";

    // Start playback
    video.play().catch(() => {
      // Playback failed - might be blocked by browser
    });

    request.onAssigned?.(video);

    return video;
  }

  /**
   * Release a video element back to the pool
   * May shrink the pool if it exceeds minPoolSize
   */
  release(requestId: string, onReleased?: () => void) {
    const pooledVideo = this.activeRequests.get(requestId);
    if (!pooledVideo) return;

    const video = pooledVideo.element;

    // Fade out
    video.style.opacity = "0";

    // After fade, pause and remove from DOM
    setTimeout(() => {
      video.pause();
      if (video.parentElement) {
        video.parentElement.removeChild(video);
      }

      this.activeRequests.delete(requestId);

      // Shrink pool if we have excess capacity beyond minPoolSize
      const availableCount = this.pool.filter(
        (pv) => pv.requestId === null
      ).length;
      if (
        this.pool.length > this.minPoolSize &&
        availableCount > this.minPoolSize
      ) {
        // Remove this video element from the pool entirely
        const index = this.pool.indexOf(pooledVideo);
        if (index !== -1) {
          this.pool.splice(index, 1);
          video.src = "";
        }
      } else {
        // Keep in pool for reuse
        pooledVideo.requestId = null;
        pooledVideo.assignedAt = 0;
      }

      onReleased?.();
    }, 200);
  }

  /**
   * Evict the least recently used video
   */
  private evictLRU(): PooledVideo | undefined {
    // Find the oldest active video
    let oldest: PooledVideo | undefined = undefined;
    let oldestTime = Infinity;

    for (const pv of this.pool) {
      if (pv.requestId !== null && pv.assignedAt < oldestTime) {
        oldestTime = pv.assignedAt;
        oldest = pv;
      }
    }

    if (!oldest) return undefined;

    // Release the oldest
    const video = oldest.element;
    video.style.opacity = "0";
    video.pause();
    if (video.parentElement) {
      video.parentElement.removeChild(video);
    }

    this.activeRequests.delete(oldest.requestId!);
    oldest.requestId = null;
    oldest.assignedAt = 0;

    return oldest;
  }

  /**
   * Clean up all videos and reset the pool
   */
  destroy() {
    for (const pv of this.pool) {
      pv.element.pause();
      pv.element.src = "";
      if (pv.element.parentElement) {
        pv.element.parentElement.removeChild(pv.element);
      }
    }
    this.pool = [];
    this.activeRequests.clear();
    this.initialized = false;
  }

  /**
   * Get pool stats for debugging
   */
  getStats() {
    return {
      minPoolSize: this.minPoolSize,
      maxPoolSize: this.maxPoolSize,
      currentPoolSize: this.pool.length,
      activeCount: this.activeRequests.size,
      availableCount: this.pool.filter((pv) => pv.requestId === null).length,
    };
  }
}

// Export a singleton instance with default min=5, max=50
export const videoPoolManager = new VideoPoolManager(5, 50);

// Export the class for custom instances if needed
export { VideoPoolManager };
