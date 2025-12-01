"use client";

import { waitForQuick } from "./quick";
import { uploadFile } from "./quick-storage";

/**
 * Generate a thumbnail from a video URL
 * Captures frame at 1 second (or first frame if video is shorter)
 */
export async function generateThumbnailFromVideo(
  videoUrl: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    
    video.onerror = () => reject(new Error("Failed to load video"));
    
    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration, whichever is earlier
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        // Match canvas size to video's actual dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate thumbnail"));
              return;
            }
            
            const file = new File([blob], "thumbnail.jpg", {
              type: "image/jpeg",
            });
            resolve(file);
          },
          "image/jpeg",
          0.85
        );
      } catch (error) {
        reject(error);
      }
    };
    
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Generate thumbnails for all videos that don't have one
 */
export async function generateMissingThumbnails(
  onProgress: (current: number, total: number, message: string) => void,
  force: boolean = false // NEW: force regenerate all thumbnails
) {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  
  // Get all video artifacts
  const allArtifacts = await artifactsCollection.find();
  const videoArtifacts = force 
    ? allArtifacts.filter((a: any) => a.type === "video") // Force: regenerate ALL videos
    : allArtifacts.filter((a: any) => a.type === "video" && !a.metadata?.thumbnail_url); // Normal: only missing
  
  onProgress(0, videoArtifacts.length, force ? "Regenerating all thumbnails..." : "Starting thumbnail generation...");
  
  let processed = 0;
  let generated = 0;
  let errors = 0;
  
  for (const artifact of videoArtifacts) {
    try {
      onProgress(
        processed,
        videoArtifacts.length,
        `Generating thumbnail for: ${artifact.name.substring(0, 40)}...`
      );
      
      // Generate thumbnail from video
      const thumbnailFile = await generateThumbnailFromVideo(
        artifact.source_url
      );
      
      // Upload thumbnail
      const result = await uploadFile(thumbnailFile);
      
      // Update artifact metadata
      await artifactsCollection.update(artifact.id, {
        metadata: {
          ...artifact.metadata,
          thumbnail_url: result.fullUrl,
        },
      });
      
      generated++;
      onProgress(
        processed + 1,
        videoArtifacts.length,
        `✓ Generated thumbnail for: ${artifact.name.substring(0, 40)}`
      );
    } catch (error: any) {
      errors++;
      console.error(`Failed to generate thumbnail for ${artifact.id}:`, error);
      onProgress(
        processed + 1,
        videoArtifacts.length,
        `✗ Failed: ${artifact.name.substring(0, 40)} - ${error.message}`
      );
    }
    
    processed++;
  }
  
  return {
    total: videoArtifacts.length,
    generated,
    errors,
  };
}

