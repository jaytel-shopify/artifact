"use client";

import { waitForQuick } from "./quick";
import { compressFile } from "./compress-video";

/**
 * Quick.fs File Storage Helper
 *
 * Provides helper functions for uploading files to Quick's storage system.
 * Quick.fs automatically handles file storage and returns accessible URLs.
 */

export interface UploadResult {
  url: string; // Relative URL path
  fullUrl: string; // Full absolute URL
  size: number; // File size in bytes
  mimeType: string; // MIME type (e.g., "image/png")
  width?: number; // Media width in pixels (for images/videos)
  height?: number; // Media height in pixels (for images/videos)
}

export interface UploadProgress {
  percentage: number; // 0-100
  type?: "upload" | "convert";
}

const MAX_IMAGE_SIZE = 2500;

async function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", async () => {
      const longestAxis = Math.max(image.width, image.height);

      if (longestAxis <= MAX_IMAGE_SIZE) {
        resolve(file);
        return;
      }

      const scale = MAX_IMAGE_SIZE / longestAxis;
      const newWidth = Math.round(image.width * scale);
      const newHeight = Math.round(image.height * scale);
      const resized = await createImageBitmap(image, {
        resizeWidth: newWidth,
        resizeHeight: newHeight,
      });
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      canvas.getContext("bitmaprenderer")?.transferFromImageBitmap(resized);
      const blob = await canvas.convertToBlob({
        type: "image/webp",
        quality: 0.9,
      });
      const resizedFile = new File([blob], file.name, { type: "image/webp" });
      resolve(resizedFile);
    });
    image.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a single file with progress tracking
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const quick = await waitForQuick();

  console.log("Uploading file to Quick.fs:", file.name, file.type, file.size);

  // Track processed file for dimension extraction
  let processedFile: File = file;

  if (file.type.startsWith("image/")) {
    processedFile = await resizeImage(file);
  } else if (file.type.startsWith("video/")) {
    processedFile = await compressFile(file, {
      onProgress: (progress) => {
        onProgress?.({ percentage: progress.percentage, type: "convert" });
      },
    });
  }

  // Get dimensions from the processed file (after resize/compression)
  const dimensions = await getMediaDimensions(processedFile);

  const result = await quick.fs.uploadFile(processedFile, {
    onProgress: (progress) => {
      console.log("Upload progress:", progress);
      onProgress?.({ percentage: progress.percentage, type: "upload" });
    },
  });

  console.log("Quick.fs upload result:", result);

  // Quick.fs returns the file data directly (not wrapped in { files: [...] })
  return {
    url: result.url,
    fullUrl: result.fullUrl,
    size: result.size,
    mimeType: result.mimeType,
    width: dimensions?.width,
    height: dimensions?.height,
  };
}

/**
 * Upload multiple files at once
 * Uses 'hybrid' naming strategy (timestamp + random) by default
 */
export async function uploadFiles(
  files: File[],
  options?: {
    strategy?: "uuid" | "timestamp" | "hybrid" | "original";
    onProgress?: (fileIndex: number, progress: UploadProgress) => void;
  }
): Promise<UploadResult[]> {
  const quick = await waitForQuick();

  files = await Promise.all(
    files.map(async (file) => {
      if (file.type.startsWith("image/")) {
        return await resizeImage(file);
      }
      return file;
    })
  );

  console.log(
    "Uploading multiple files to Quick.fs:",
    files.map((f) => f.name)
  );

  const result = await quick.fs.upload(files, {
    strategy: options?.strategy || "hybrid",
  });

  console.log("Quick.fs batch upload result:", result);

  // Quick.fs batch upload might return differently
  // If it returns an array directly, use it
  if (Array.isArray(result)) {
    return result.map((r) => ({
      url: r.url,
      fullUrl: r.fullUrl,
      size: r.size,
      mimeType: r.mimeType,
    }));
  }

  // If it returns { files: [...] }, use that
  if (result && result.files && Array.isArray(result.files)) {
    return result.files;
  }

  console.error("Invalid Quick.fs batch response:", result);
  throw new Error("Quick.fs did not return valid file data");
}

/**
 * Upload files one at a time with individual progress tracking
 * Useful when you need granular control over each file's upload
 */
export async function uploadFilesSequentially(
  files: File[],
  onFileProgress?: (
    fileIndex: number,
    fileName: string,
    progress: UploadProgress
  ) => void,
  onFileComplete?: (
    fileIndex: number,
    fileName: string,
    result: UploadResult
  ) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const result = await uploadFile(file, (progress) => {
      onFileProgress?.(i, file.name, progress);
    });

    results.push(result);
    onFileComplete?.(i, file.name, result);
  }

  return results;
}

/**
 * Determine artifact type based on MIME type
 */
export function getArtifactTypeFromMimeType(
  mimeType: string
): "image" | "video" {
  if (mimeType.startsWith("image/")) {
    return "image";
  } else if (mimeType.startsWith("video/")) {
    return "video";
  }

  // Default to image for unknown types
  return "image";
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const maxSizeBytes = (options?.maxSizeMB || 50) * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${options?.maxSizeMB || 50}MB limit. Try compressing your file.`,
    };
  }

  if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export interface MediaDimensions {
  width: number;
  height: number;
}

/**
 * Get dimensions (width/height) from an image file
 */
export function getImageDimensions(file: File): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for dimension extraction"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get dimensions (width/height) from a video file
 */
export function getVideoDimensions(file: File): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video for dimension extraction"));
    };
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get dimensions from any media file (image or video)
 */
export async function getMediaDimensions(
  file: File
): Promise<MediaDimensions | null> {
  try {
    if (file.type.startsWith("image/")) {
      return await getImageDimensions(file);
    } else if (file.type.startsWith("video/")) {
      return await getVideoDimensions(file);
    }
    return null;
  } catch (error) {
    console.error("Failed to get media dimensions:", error);
    return null;
  }
}
