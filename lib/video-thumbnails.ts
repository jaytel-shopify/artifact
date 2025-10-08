"use client";

import { Input, ALL_FORMATS, BlobSource, CanvasSink } from "mediabunny";
import { uploadFile } from "./quick-storage";
import { updateArtifact } from "./quick-db";

/**
 * Generate a thumbnail image from the first frame of a video file
 * @param videoFile - The video file to extract a frame from
 * @param thumbnailSize - Maximum dimension (width or height) for the thumbnail
 * @returns A Blob containing the thumbnail image as JPEG
 */
export async function generateVideoThumbnail(
  videoFile: File,
  thumbnailSize: number = 400
): Promise<Blob> {
  try {
    // Create input from video file
    const source = new BlobSource(videoFile);
    const input = new Input({
      source,
      formats: ALL_FORMATS,
    });

    // Get the primary video track
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error("File has no video track");
    }

    if (videoTrack.codec === null) {
      throw new Error("Unsupported video codec");
    }

    if (!(await videoTrack.canDecode())) {
      throw new Error("Unable to decode the video track");
    }

    // Calculate thumbnail dimensions maintaining aspect ratio
    const width =
      videoTrack.displayWidth > videoTrack.displayHeight
        ? thumbnailSize
        : Math.floor(
            (thumbnailSize * videoTrack.displayWidth) / videoTrack.displayHeight
          );
    const height =
      videoTrack.displayHeight > videoTrack.displayWidth
        ? thumbnailSize
        : Math.floor(
            (thumbnailSize * videoTrack.displayHeight) / videoTrack.displayWidth
          );

    // Create a canvas sink for extracting the frame
    const sink = new CanvasSink(videoTrack, {
      width: Math.floor(width * window.devicePixelRatio),
      height: Math.floor(height * window.devicePixelRatio),
      fit: "fill",
    });

    // Get the first frame (timestamp 0)
    const firstTimestamp = await videoTrack.getFirstTimestamp();

    // Extract the frame
    let thumbnailBlob: Blob | null = null;
    for await (const wrappedCanvas of sink.canvasesAtTimestamps([
      firstTimestamp,
    ])) {
      if (wrappedCanvas) {
        const canvas = wrappedCanvas.canvas as HTMLCanvasElement;

        // Convert canvas to blob
        thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to create blob from canvas"));
              }
            },
            "image/jpeg",
            0.85 // Quality setting for JPEG
          );
        });

        break; // We only need the first frame
      }
    }

    if (!thumbnailBlob) {
      throw new Error("Failed to extract thumbnail from video");
    }

    return thumbnailBlob;
  } catch (error) {
    console.error("Error generating video thumbnail:", error);
    throw error;
  }
}

/**
 * Generate a thumbnail for a video, upload it to Quick.fs, and update the artifact metadata
 * This runs asynchronously and doesn't block the artifact creation flow
 *
 * @param videoFile - The original video file
 * @param artifactId - The ID of the artifact to update
 */
export async function generateAndUploadThumbnail(
  videoFile: File,
  artifactId: string
): Promise<void> {
  try {
    console.log(`Generating thumbnail for video artifact ${artifactId}...`);

    // Generate the thumbnail
    const thumbnailBlob = await generateVideoThumbnail(videoFile);

    // Create a File object from the blob for upload
    const thumbnailFile = new File(
      [thumbnailBlob],
      `thumbnail-${artifactId}.jpg`,
      { type: "image/jpeg" }
    );

    // Upload the thumbnail to Quick.fs
    const uploadResult = await uploadFile(thumbnailFile);

    console.log(
      `Thumbnail uploaded for artifact ${artifactId}:`,
      uploadResult.fullUrl
    );

    // Get the current artifact to preserve existing metadata
    const { getArtifactById } = await import("./quick-db");
    const artifact = await getArtifactById(artifactId);

    if (!artifact) {
      console.error(`Artifact ${artifactId} not found`);
      return;
    }

    // Update the artifact metadata with the thumbnail URL, preserving existing fields
    await updateArtifact(artifactId, {
      metadata: {
        ...artifact.metadata,
        thumbnail_url: uploadResult.fullUrl,
      },
    });

    console.log(`Thumbnail metadata updated for artifact ${artifactId}`);
  } catch (error) {
    // Log the error but don't throw - thumbnail generation is nice-to-have
    console.error(
      `Failed to generate thumbnail for artifact ${artifactId}:`,
      error
    );
  }
}
