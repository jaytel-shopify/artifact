"use client";

import { waitForQuick } from "./index";

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
}

export interface UploadProgress {
  percentage: number; // 0-100
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

  const result = await quick.fs.uploadFile(file, {
    onProgress: (progress) => {
      console.log("Upload progress:", progress);
      onProgress?.(progress);
    },
  });

  console.log("Quick.fs upload result:", result);

  // Quick.fs returns the file data directly (not wrapped in { files: [...] })
  return {
    url: result.url,
    fullUrl: result.fullUrl,
    size: result.size,
    mimeType: result.mimeType,
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
