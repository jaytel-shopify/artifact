/**
 * URL Helpers
 *
 * Centralized URL generation for application resources.
 */

/**
 * Base URL for the Artifact application
 */
export const APP_BASE_URL = "https://artifact.quick.shopify.io";

/**
 * Generate a shareable URL for a project
 */
export function getProjectUrl(projectId: string): string {
  return `${APP_BASE_URL}/p?id=${projectId}`;
}

/**
 * Generate a shareable URL for a folder
 */
export function getFolderUrl(folderId: string): string {
  return `${APP_BASE_URL}/folder?id=${folderId}`;
}

/**
 * Generate a shareable URL for a resource (project or folder)
 */
export function getResourceUrl(
  resourceType: "project" | "folder",
  resourceId: string
): string {
  return resourceType === "project"
    ? getProjectUrl(resourceId)
    : getFolderUrl(resourceId);
}
