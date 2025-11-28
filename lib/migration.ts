"use client";

import {
  fetchAndParseSqlDump,
  type MigrationData,
  type ParsedMedia,
  type ParsedPost,
} from "./parse-sql-dump";
import { uploadFile } from "./quick-storage";
import { createArtifact } from "./quick-db";
import { getUploadedUrl, cacheUploadedUrl } from "./migration-state";
import { waitForQuick } from "./quick";
import { generateThumbnailFromVideo } from "./generate-thumbnails";
import type { ArtifactType } from "@/types";

export interface MigrationProgress {
  phase:
    | "loading"
    | "parsing"
    | "uploading"
    | "creating"
    | "complete"
    | "error";
  current: number;
  total: number;
  currentItem: string;
  logs: MigrationLog[];
  stats: MigrationStats;
}

export interface MigrationLog {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export interface MigrationStats {
  totalPosts: number;
  totalMedia: number;
  postsProcessed: number;
  artifactsCreated: number;
  postsSkipped: number;
  uploadsSkipped: number; // Files already uploaded
  duplicatesSkipped: number; // Posts already migrated
  errors: number;
}

/**
 * Map PostgreSQL reactions to Artifact reactions
 */
function mapReactions(oldReactions: Record<string, string[]>): {
  like: string[];
  dislike: string[];
} {
  const reactions = { like: [] as string[], dislike: [] as string[] };

  const likeEmojis = ["😍", "❤️", "👍", "❤"];

  for (const [emoji, userIds] of Object.entries(oldReactions)) {
    if (likeEmojis.includes(emoji)) {
      reactions.like.push(...userIds);
    } else {
      reactions.dislike.push(...userIds);
    }
  }

  return reactions;
}

/**
 * Get artifact type from content type
 */
function getArtifactType(contentType: string): ArtifactType {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  throw new Error(`Unknown content type: ${contentType}`);
}

/**
 * Fetch a media file from the public directory with timeout and retry
 */
async function fetchMediaFile(
  filename: string,
  contentType: string,
  retries = 3
): Promise<File> {
  const url = `/_migration/shopify-studio-media/${filename}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const ext =
        contentType.split("/")[1]?.replace("quicktime", "mov") || "file";
      const fileName = `${filename.split("/").pop()}.${ext}`;

      return new File([blob], fileName, { type: contentType });
    } catch (error: any) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${error.message}`);
      }

      const delay = Math.min(2000 * attempt, 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${filename}`);
}

/**
 * Upload file with caching - checks if already uploaded first
 */
async function uploadWithCache(
  mediaId: string,
  filename: string,
  file: File,
  onLog: (log: MigrationLog) => void
): Promise<{ url: string; wasSkipped: boolean }> {
  // Check cache first
  const cachedUrl = await getUploadedUrl(mediaId);
  if (cachedUrl) {
    onLog({
      timestamp: new Date().toISOString(),
      type: "info",
      message: `   ↩️  Using cached upload (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    });
    return { url: cachedUrl, wasSkipped: true };
  }

  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  const isVideo = file.type.startsWith("video/");

  onLog({
    timestamp: new Date().toISOString(),
    type: "info",
    message: `   ⬆️  ${isVideo ? "Compressing & uploading" : "Uploading"} ${sizeMB}MB...`,
  });

  // Upload file (includes compression for videos)
  // This can take a while for large videos
  const result = await uploadFile(file, (progress) => {
    if (progress.percentage === 50 || progress.percentage === 100) {
      onLog({
        timestamp: new Date().toISOString(),
        type: "info",
        message: `   ${progress.percentage}% complete...`,
      });
    }
  });

  onLog({
    timestamp: new Date().toISOString(),
    type: "success",
    message: `   ✓ Uploaded successfully`,
  });

  // Cache the result
  await cacheUploadedUrl(mediaId, filename, result.fullUrl, file.size);

  return { url: result.fullUrl, wasSkipped: false };
}

/**
 * Process a single post with its media
 */
async function processPost(
  post: ParsedPost,
  mediaItems: ParsedMedia[],
  userEmail: string,
  onLog: (log: MigrationLog) => void,
  stats: MigrationStats
): Promise<number> {
  let artifactsCreated = 0;

  if (!mediaItems || mediaItems.length === 0) {
    onLog({
      timestamp: new Date().toISOString(),
      type: "warning",
      message: `Skipped post ${post.id}: no media`,
    });
    return 0;
  }

  // CHECK FOR EXISTING ARTIFACTS
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");

  // Check if this post was already migrated
  const existingArtifacts = (await artifactsCollection.find()).filter(
    (a: any) => a.metadata?.original_post_id === post.id
  );

  // If artifacts exist, just update their dates and skip processing
  if (existingArtifacts.length > 0) {
    onLog({
      timestamp: new Date().toISOString(),
      type: "info",
      message: `🔄 Updating ${existingArtifacts.length} artifact(s) with correct dates...`,
    });

    for (const artifact of existingArtifacts) {
      await artifactsCollection.update(artifact.id, {
        tags: post.tags, // Update tags in case they changed
        reactions: mapReactions(post.reactions), // Update reactions too
        metadata: {
          ...artifact.metadata,
          original_created_at: post.createdAt, // Store original timestamp
          original_updated_at: post.updatedAt,
        },
      });
    }

    onLog({
      timestamp: new Date().toISOString(),
      type: "success",
      message: `✓ Updated dates for post ${post.id.substring(0, 12)}`,
    });

    stats.duplicatesSkipped++;
    return 0;
  }

  // Handle posts with multiple media (video + thumbnail)
  if (mediaItems.length === 2) {
    const video = mediaItems.find((m) => m.contentType.startsWith("video/"));
    const image = mediaItems.find((m) => m.contentType.startsWith("image/"));

    if (video && image) {
      try {
        onLog({
          timestamp: new Date().toISOString(),
          type: "info",
          message: `📹 Processing video + thumbnail...`,
        });

        const videoFile = await fetchMediaFile(
          video.filename,
          video.contentType
        );
        const imageFile = await fetchMediaFile(
          image.filename,
          image.contentType
        );

        const videoUpload = await uploadWithCache(
          video.id,
          video.filename,
          videoFile,
          onLog
        );
        if (videoUpload.wasSkipped) stats.uploadsSkipped++;

        const imageUpload = await uploadWithCache(
          image.id,
          image.filename,
          imageFile,
          onLog
        );
        if (imageUpload.wasSkipped) stats.uploadsSkipped++;

        await createArtifact({
          type: "video",
          source_url: videoUpload.url,
          file_path: null,
          name: post.description || `Untitled (${post.id})`,
          description: "",
          tags: post.tags,
          creator_id: userEmail,
          published: true,
          metadata: {
            original_post_id: post.id,
            original_media_id: video.id,
            original_created_at: post.createdAt, // Store original timestamp here
            original_updated_at: post.updatedAt,
            thumbnail_url: imageUpload.url,
            hideUI: true,
            loop: true,
            muted: true,
          },
          reactions: mapReactions(post.reactions),
        });

        onLog({
          timestamp: new Date().toISOString(),
          type: "success",
          message: `✓ Created video with thumbnail`,
        });

        return 1;
      } catch (error: any) {
        onLog({
          timestamp: new Date().toISOString(),
          type: "error",
          message: `✗ Failed: ${error.message}`,
        });
      }
    }
  }

  // Handle normal posts
  for (let i = 0; i < mediaItems.length; i++) {
    const media = mediaItems[i];

    try {
      onLog({
        timestamp: new Date().toISOString(),
        type: "info",
        message: `📥 Fetching ${media.contentType} (${media.filename.split("/").pop()?.substring(0, 20)}...)`,
      });

      const file = await fetchMediaFile(media.filename, media.contentType);

      onLog({
        timestamp: new Date().toISOString(),
        type: "info",
        message: `   ✓ Fetched ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });

      const upload = await uploadWithCache(
        media.id,
        media.filename,
        file,
        onLog
      );

      if (upload.wasSkipped) stats.uploadsSkipped++;

      const artifactType = getArtifactType(media.contentType);
      const metadata: Record<string, any> = {
        original_post_id: post.id,
        original_media_id: media.id,
        original_created_at: post.createdAt, // Store original timestamp here
        original_updated_at: post.updatedAt,
      };

      if (artifactType === "video") {
        metadata.hideUI = true;
        metadata.loop = true;
        metadata.muted = true;
        
        // Generate thumbnail for video
        try {
          onLog({
            timestamp: new Date().toISOString(),
            type: "info",
            message: `   🎬 Generating thumbnail...`,
          });
          
          const thumbnailFile = await generateThumbnailFromVideo(upload.url);
          const thumbnailResult = await uploadFile(thumbnailFile);
          metadata.thumbnail_url = thumbnailResult.fullUrl;
          
          onLog({
            timestamp: new Date().toISOString(),
            type: "success",
            message: `   ✓ Thumbnail generated`,
          });
        } catch (error: any) {
          onLog({
            timestamp: new Date().toISOString(),
            type: "warning",
            message: `   ⚠ Thumbnail generation failed: ${error.message}`,
          });
          // Continue without thumbnail
        }
      }

      await createArtifact({
        type: artifactType,
        source_url: upload.url,
        file_path: null,
        name: post.description || `Untitled (${post.id})`,
        description: "",
        tags: post.tags,
        creator_id: userEmail,
        published: true,
        metadata,
        reactions: mapReactions(post.reactions),
      });

      onLog({
        timestamp: new Date().toISOString(),
        type: "success",
        message: `✓ Created ${artifactType}: "${post.description?.substring(0, 40)}..."`,
      });

      artifactsCreated++;
    } catch (error: any) {
      onLog({
        timestamp: new Date().toISOString(),
        type: "error",
        message: `✗ ${error.message || error.toString()}`,
      });
      console.error("Full error:", error);
    }
  }

  return artifactsCreated;
}

/**
 * Run the migration
 */
export async function runMigration(
  onProgress: (progress: MigrationProgress) => void
): Promise<MigrationStats> {
  const logs: MigrationLog[] = [];
  const stats: MigrationStats = {
    totalPosts: 0,
    totalMedia: 0,
    postsProcessed: 0,
    artifactsCreated: 0,
    postsSkipped: 0,
    uploadsSkipped: 0,
    duplicatesSkipped: 0,
    errors: 0,
  };

  const addLog = (log: MigrationLog) => {
    logs.push(log);
    onProgress({
      phase: "uploading",
      current: stats.postsProcessed,
      total: stats.totalPosts,
      currentItem: log.message,
      logs,
      stats,
    });
  };

  try {
    addLog({
      timestamp: new Date().toISOString(),
      type: "info",
      message: "Loading SQL dump...",
    });

    const migrationData = await fetchAndParseSqlDump((message, percent) => {
      onProgress({
        phase: "parsing",
        current: percent,
        total: 100,
        currentItem: message,
        logs,
        stats,
      });
    });

    stats.totalPosts = migrationData.posts.length;
    stats.totalMedia = migrationData.media.length;

    addLog({
      timestamp: new Date().toISOString(),
      type: "success",
      message: `Parsed ${stats.totalPosts} posts, ${stats.totalMedia} media files`,
    });

    onProgress({
      phase: "uploading",
      current: 0,
      total: stats.totalPosts,
      currentItem: "Starting migration...",
      logs,
      stats,
    });

    for (const post of migrationData.posts) {
      const user = migrationData.userMap.get(post.authorId);
      if (!user) {
        addLog({
          timestamp: new Date().toISOString(),
          type: "warning",
          message: `Skipped post ${post.id}: author not found`,
        });
        stats.postsSkipped++;
        stats.postsProcessed++;
        continue;
      }

      const mediaItems = migrationData.mediaByPost.get(post.id) || [];

      try {
        const created = await processPost(
          post,
          mediaItems,
          user.email,
          addLog,
          stats
        );
        stats.artifactsCreated += created;

        if (created === 0) {
          stats.postsSkipped++;
        }
      } catch (error: any) {
        addLog({
          timestamp: new Date().toISOString(),
          type: "error",
          message: `Error processing post ${post.id}: ${error.message}`,
        });
        stats.errors++;
      }

      stats.postsProcessed++;

      onProgress({
        phase: "creating",
        current: stats.postsProcessed,
        total: stats.totalPosts,
        currentItem: `Processed ${stats.postsProcessed}/${stats.totalPosts}`,
        logs,
        stats,
      });
    }

    addLog({
      timestamp: new Date().toISOString(),
      type: "success",
      message: `Complete! ${stats.artifactsCreated} artifacts, ${stats.uploadsSkipped} cached uploads`,
    });

    onProgress({
      phase: "complete",
      current: stats.totalPosts,
      total: stats.totalPosts,
      currentItem: "Migration complete!",
      logs,
      stats,
    });

    return stats;
  } catch (error: any) {
    addLog({
      timestamp: new Date().toISOString(),
      type: "error",
      message: `Migration failed: ${error.message}`,
    });

    onProgress({
      phase: "error",
      current: stats.postsProcessed,
      total: stats.totalPosts,
      currentItem: error.message,
      logs,
      stats,
    });

    throw error;
  }
}
