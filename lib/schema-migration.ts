"use client";

import { waitForQuick } from "./quick";

/**
 * Schema Migration Utility
 *
 * Detects artifacts using the old schema (with project_id, page_id, position)
 * and migrates them to the new schema (junction table: project_artifacts)
 */

export interface MigrationStatus {
  needsMigration: boolean;
  oldSchemaArtifactCount: number;
  totalArtifactCount: number;
}

/**
 * Check if there are any artifacts using the old schema
 * Old schema artifacts have project_id and page_id fields directly on them
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");

  const allArtifacts = await artifactsCollection.find();

  // Count artifacts that have the old schema fields
  const oldSchemaArtifacts = allArtifacts.filter(
    (artifact: any) =>
      artifact.project_id !== undefined ||
      artifact.page_id !== undefined ||
      artifact.position !== undefined
  );

  return {
    needsMigration: oldSchemaArtifacts.length > 0,
    oldSchemaArtifactCount: oldSchemaArtifacts.length,
    totalArtifactCount: allArtifacts.length,
  };
}

/**
 * Migrate artifacts from old schema to new schema
 *
 * For each artifact with project_id/page_id:
 * 1. Create a project_artifact junction entry
 * 2. Remove project_id, page_id, position from the artifact
 * 3. Ensure creator_id is set (fallback to current user if missing)
 */
export async function migrateToNewSchema(
  currentUserEmail: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    const quick = await waitForQuick();
    const artifactsCollection = quick.db.collection("artifacts");
    const projectArtifactsCollection = quick.db.collection("project_artifacts");

    const allArtifacts = await artifactsCollection.find();

    // Filter artifacts that need migration
    const artifactsToMigrate = allArtifacts.filter(
      (artifact: any) =>
        artifact.project_id !== undefined ||
        artifact.page_id !== undefined ||
        artifact.position !== undefined
    );

    if (artifactsToMigrate.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    let migratedCount = 0;

    for (const artifact of artifactsToMigrate) {
      const projectId = artifact.project_id;
      const pageId = artifact.page_id;
      const position = artifact.position ?? 0;

      // Only create junction entry if artifact was linked to a project/page
      if (projectId && pageId) {
        // Check if junction entry already exists
        const existingJunctions = await projectArtifactsCollection
          .where({ artifact_id: artifact.id, page_id: pageId })
          .find();

        if (existingJunctions.length === 0) {
          // Create junction entry
          await projectArtifactsCollection.create({
            project_id: projectId,
            page_id: pageId,
            artifact_id: artifact.id,
            position: position,
          });
        }
      }

      // Update artifact: remove old fields, ensure creator_id exists
      const updates: Record<string, any> = {};

      // Remove old schema fields by setting them to undefined/deleting
      // Note: Quick.db may not support delete, so we'll set to null
      if (artifact.project_id !== undefined) {
        updates.project_id = null;
      }
      if (artifact.page_id !== undefined) {
        updates.page_id = null;
      }
      if (artifact.position !== undefined) {
        updates.position = null;
      }

      // Ensure creator_id is set
      if (!artifact.creator_id) {
        updates.creator_id = currentUserEmail;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await artifactsCollection.update(artifact.id, updates);
      }

      migratedCount++;
      onProgress?.(migratedCount, artifactsToMigrate.length);
    }

    return { success: true, migratedCount };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up null fields from migrated artifacts
 * This is a secondary cleanup step that removes the null placeholder fields
 */
export async function cleanupMigratedArtifacts(): Promise<void> {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");

  const allArtifacts = await artifactsCollection.find();

  for (const artifact of allArtifacts) {
    // Check if artifact has null old-schema fields that should be removed
    const hasNullOldFields =
      artifact.project_id === null ||
      artifact.page_id === null ||
      artifact.position === null;

    if (hasNullOldFields) {
      // Create a clean copy without the null fields
      // Note: This depends on how Quick.db handles updates
      // We're setting to undefined which should effectively remove them
      const updates: Record<string, undefined> = {};
      if (artifact.project_id === null) updates.project_id = undefined;
      if (artifact.page_id === null) updates.page_id = undefined;
      if (artifact.position === null) updates.position = undefined;

      try {
        await artifactsCollection.update(artifact.id, updates);
      } catch (e) {
        // Some DBs might not support undefined, that's okay
        console.log("Could not remove null fields for artifact:", artifact.id);
      }
    }
  }
}

