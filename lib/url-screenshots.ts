"use client";

import { mutate as globalMutate } from "swr";
import { uploadFile } from "./quick-storage";
import { updateArtifact, getArtifactById } from "./quick-db";
import { cacheKeys } from "./cache-keys";

const SCREENSHOT_SERVICE_URL =
  "https://screenshot-service-91326127678.us-east4.run.app";

/**
 * Generate a screenshot for a URL, upload it to Quick.fs, and update the artifact metadata
 * This runs asynchronously and doesn't block the artifact creation flow
 *
 * @param url - The URL to screenshot
 * @param artifactId - The ID of the artifact to update
 * @param width - Optional viewport width
 * @param height - Optional viewport height
 * @param pageId - Optional page ID to invalidate page-specific cache
 */
export async function generateAndUploadUrlScreenshot(
  url: string,
  artifactId: string,
  width?: number,
  height?: number,
  pageId?: string
): Promise<void> {
  try {
    console.time("generated screenshot");

    // Call the screenshot service
    const screenshotUrl = `${SCREENSHOT_SERVICE_URL}?url=${encodeURIComponent(url)}&width=${width || 1280}&height=${height || 800}`;
    const response = await fetch(screenshotUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Screenshot service failed: ${response.status} - ${errorText}`
      );
    }

    // Get the screenshot as a blob
    const screenshotBlob = await response.blob();

    // Create a File object from the blob for upload
    const screenshotFile = new File(
      [screenshotBlob],
      `screenshot-${artifactId}.jpg`,
      { type: "image/jpeg" }
    );

    // Upload the screenshot to Quick.fs
    const uploadResult = await uploadFile(screenshotFile);

    // Get the current artifact to preserve existing metadata
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

    // Trigger frontend refresh so the new thumbnail appears
    globalMutate(cacheKeys.publicArtifacts);
    if (pageId) {
      globalMutate(cacheKeys.pageArtifacts(pageId));
    }

    console.timeEnd("generated screenshot");
  } catch (error) {
    // Log the error but don't throw - screenshot generation is nice-to-have
    console.error(
      `Failed to generate screenshot for artifact ${artifactId}:`,
      error
    );
  }
}
