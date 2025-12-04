"use client";

import { uploadFile } from "./quick-storage";
import { updateArtifact, getArtifactById } from "./quick-db";

const SCREENSHOT_SERVICE_URL =
  "https://screenshot-service-91326127678.us-east4.run.app";

/**
 * Generate a screenshot for a URL, upload it to Quick.fs, and update the artifact metadata
 * This runs asynchronously and doesn't block the artifact creation flow
 *
 * @param url - The URL to screenshot
 * @param artifactId - The ID of the artifact to update
 */
export async function generateAndUploadUrlScreenshot(
  url: string,
  artifactId: string
): Promise<void> {
  try {
    console.log(`Generating screenshot for URL artifact ${artifactId}: ${url}`);

    // Call the screenshot service
    const screenshotUrl = `${SCREENSHOT_SERVICE_URL}?url=${encodeURIComponent(url)}`;
    const response = await fetch(screenshotUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Screenshot service failed: ${response.status} - ${errorText}`);
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

    console.log(
      `Screenshot uploaded for artifact ${artifactId}:`,
      uploadResult.fullUrl
    );

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

    console.log(`Screenshot metadata updated for artifact ${artifactId}`);
  } catch (error) {
    // Log the error but don't throw - screenshot generation is nice-to-have
    console.error(
      `Failed to generate screenshot for artifact ${artifactId}:`,
      error
    );
  }
}
