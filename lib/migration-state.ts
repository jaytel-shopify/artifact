"use client";

import { waitForQuick } from "./quick";

/**
 * Track uploaded media files to avoid re-uploading
 * Stores: media_id → quick.fs URL
 */

const UPLOAD_CACHE_COLLECTION = "migration_upload_cache";

export interface UploadCacheEntry {
  id: string; // Same as media_id
  media_id: string;
  original_filename: string;
  uploaded_url: string;
  file_size: number;
  uploaded_at: string;
}

/**
 * Check if a media file has already been uploaded
 */
export async function getUploadedUrl(mediaId: string): Promise<string | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(UPLOAD_CACHE_COLLECTION);
  
  try {
    const cached = await collection.findById(mediaId);
    return cached?.uploaded_url || null;
  } catch {
    return null;
  }
}

/**
 * Cache an uploaded file URL
 */
export async function cacheUploadedUrl(
  mediaId: string,
  filename: string,
  uploadedUrl: string,
  fileSize: number
): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(UPLOAD_CACHE_COLLECTION);
  
  await collection.create({
    id: mediaId,
    media_id: mediaId,
    original_filename: filename,
    uploaded_url: uploadedUrl,
    file_size: fileSize,
    uploaded_at: new Date().toISOString(),
  });
}

/**
 * Clear all migration data (artifacts + upload cache)
 */
export async function clearMigrationData(): Promise<{ artifactsDeleted: number; cacheCleared: number }> {
  const quick = await waitForQuick();
  
  // Delete all migrated artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts = await artifactsCollection.find();
  const migratedArtifacts = allArtifacts.filter((a: any) => a.metadata?.original_post_id);
  
  for (const artifact of migratedArtifacts) {
    await artifactsCollection.delete(artifact.id);
  }
  
  // Clear upload cache
  const cacheCollection = quick.db.collection(UPLOAD_CACHE_COLLECTION);
  const cacheEntries = await cacheCollection.find();
  
  for (const entry of cacheEntries) {
    await cacheCollection.delete(entry.id);
  }
  
  return {
    artifactsDeleted: migratedArtifacts.length,
    cacheCleared: cacheEntries.length,
  };
}

/**
 * Get migration statistics
 */
export async function getMigrationStats(): Promise<{
  migratedArtifacts: number;
  cachedUploads: number;
  totalSize: number;
}> {
  const quick = await waitForQuick();
  
  // Count migrated artifacts
  const artifactsCollection = quick.db.collection("artifacts");
  const allArtifacts = await artifactsCollection.find();
  const migratedArtifacts = allArtifacts.filter((a: any) => a.metadata?.original_post_id);
  
  // Get cache stats
  const cacheCollection = quick.db.collection(UPLOAD_CACHE_COLLECTION);
  const cacheEntries = await cacheCollection.find();
  const totalSize = cacheEntries.reduce((sum: number, entry: any) => sum + (entry.file_size || 0), 0);
  
  return {
    migratedArtifacts: migratedArtifacts.length,
    cachedUploads: cacheEntries.length,
    totalSize,
  };
}

