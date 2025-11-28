"use client";

import { waitForQuick } from "./quick";
import { getUserByEmail, createUserFromEmail } from "./quick-users";
import type { User } from "@/types";

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

// ==================== USER SCHEMA MIGRATION ====================

/**
 * Status of the User schema migration
 */
export interface UserMigrationStatus {
  needsMigration: boolean;
  emailBasedCreatorIds: number;
  totalRecords: number;
  uniqueEmails: string[];
}

/**
 * Check if records need migration from email-based creator_id to User.id
 *
 * Old schema: creator_id = "user@shopify.com" (email)
 * New schema: creator_id = "uuid-string" (User.id)
 *
 * Detects email-based creator_ids by checking if they contain "@"
 */
export async function checkUserMigrationStatus(): Promise<UserMigrationStatus> {
  const quick = await waitForQuick();

  const projectsCollection = quick.db.collection("projects");
  const artifactsCollection = quick.db.collection("artifacts");
  const foldersCollection = quick.db.collection("folders");

  const allProjects = await projectsCollection.find();
  const allArtifacts = await artifactsCollection.find();
  const allFolders = await foldersCollection.find();

  // Check for email-based creator_ids (contain "@")
  const isEmailBased = (creatorId: string | undefined) =>
    creatorId && creatorId.includes("@");

  const emailBasedProjects = allProjects.filter((p: any) =>
    isEmailBased(p.creator_id)
  );
  const emailBasedArtifacts = allArtifacts.filter((a: any) =>
    isEmailBased(a.creator_id)
  );
  const emailBasedFolders = allFolders.filter((f: any) =>
    isEmailBased(f.creator_id)
  );

  const totalEmailBased =
    emailBasedProjects.length +
    emailBasedArtifacts.length +
    emailBasedFolders.length;
  const totalRecords =
    allProjects.length + allArtifacts.length + allFolders.length;

  // Collect unique emails
  const uniqueEmails = new Set<string>();
  [...emailBasedProjects, ...emailBasedArtifacts, ...emailBasedFolders].forEach(
    (record: any) => {
      if (record.creator_id && record.creator_id.includes("@")) {
        uniqueEmails.add(record.creator_id.toLowerCase());
      }
    }
  );

  return {
    needsMigration: totalEmailBased > 0,
    emailBasedCreatorIds: totalEmailBased,
    totalRecords,
    uniqueEmails: Array.from(uniqueEmails),
  };
}

/**
 * Migrate creator_id from email strings to User.id UUIDs
 *
 * This migration:
 * 1. Scans all Projects, Artifacts, and Folders for email-based creator_ids
 * 2. Creates User records for each unique email if they don't exist
 * 3. Updates creator_id from email to the User's UUID
 *
 * The migration is idempotent (safe to run multiple times).
 */
export async function migrateCreatorIdsToUserIds(
  onProgress?: (completed: number, total: number, stage: string) => void
): Promise<{
  success: boolean;
  migratedCount: number;
  usersCreated: number;
  error?: string;
}> {
  try {
    const quick = await waitForQuick();

    const projectsCollection = quick.db.collection("projects");
    const artifactsCollection = quick.db.collection("artifacts");
    const foldersCollection = quick.db.collection("folders");

    const allProjects = await projectsCollection.find();
    const allArtifacts = await artifactsCollection.find();
    const allFolders = await foldersCollection.find();

    // Check for email-based creator_ids (contain "@")
    const isEmailBased = (creatorId: string | undefined) =>
      creatorId && creatorId.includes("@");

    const emailBasedProjects = allProjects.filter((p: any) =>
      isEmailBased(p.creator_id)
    );
    const emailBasedArtifacts = allArtifacts.filter((a: any) =>
      isEmailBased(a.creator_id)
    );
    const emailBasedFolders = allFolders.filter((f: any) =>
      isEmailBased(f.creator_id)
    );

    // Collect unique emails
    const uniqueEmails = new Set<string>();
    [
      ...emailBasedProjects,
      ...emailBasedArtifacts,
      ...emailBasedFolders,
    ].forEach((record: any) => {
      if (record.creator_id && record.creator_id.includes("@")) {
        uniqueEmails.add(record.creator_id.toLowerCase());
      }
    });

    const emailArray = Array.from(uniqueEmails);
    const totalRecords =
      emailBasedProjects.length +
      emailBasedArtifacts.length +
      emailBasedFolders.length;

    // Stage 1: Create users for each unique email
    onProgress?.(0, emailArray.length, "Creating user records");

    const emailToUserId = new Map<string, string>();
    let usersCreated = 0;

    for (let i = 0; i < emailArray.length; i++) {
      const email = emailArray[i];

      // Check if user already exists
      let user = await getUserByEmail(email);

      if (!user) {
        // Create user from email
        user = await createUserFromEmail(email);
        usersCreated++;
      }

      emailToUserId.set(email.toLowerCase(), user.id);
      onProgress?.(i + 1, emailArray.length, "Creating user records");
    }

    // Stage 2: Update creator_ids in all collections
    let migratedCount = 0;
    const totalToMigrate =
      emailBasedProjects.length +
      emailBasedArtifacts.length +
      emailBasedFolders.length;

    // Update projects
    onProgress?.(0, totalToMigrate, "Migrating projects");
    for (const project of emailBasedProjects) {
      const userId = emailToUserId.get(project.creator_id.toLowerCase());
      if (userId) {
        await projectsCollection.update(project.id, { creator_id: userId });
        migratedCount++;
        onProgress?.(migratedCount, totalToMigrate, "Migrating projects");
      }
    }

    // Update artifacts
    onProgress?.(migratedCount, totalToMigrate, "Migrating artifacts");
    for (const artifact of emailBasedArtifacts) {
      const userId = emailToUserId.get(artifact.creator_id.toLowerCase());
      if (userId) {
        await artifactsCollection.update(artifact.id, { creator_id: userId });
        migratedCount++;
        onProgress?.(migratedCount, totalToMigrate, "Migrating artifacts");
      }
    }

    // Update folders
    onProgress?.(migratedCount, totalToMigrate, "Migrating folders");
    for (const folder of emailBasedFolders) {
      const userId = emailToUserId.get(folder.creator_id.toLowerCase());
      if (userId) {
        await foldersCollection.update(folder.id, { creator_id: userId });
        migratedCount++;
        onProgress?.(migratedCount, totalToMigrate, "Migrating folders");
      }
    }

    return {
      success: true,
      migratedCount,
      usersCreated,
    };
  } catch (error) {
    console.error("User migration failed:", error);
    return {
      success: false,
      migratedCount: 0,
      usersCreated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get migration status for both schema migrations
 */
export async function getAllMigrationStatus(): Promise<{
  schemaNeeedsMigration: boolean;
  userSchemaNeeedsMigration: boolean;
  details: {
    schema: MigrationStatus;
    user: UserMigrationStatus;
  };
}> {
  const [schemaStatus, userStatus] = await Promise.all([
    checkMigrationStatus(),
    checkUserMigrationStatus(),
  ]);

  return {
    schemaNeeedsMigration: schemaStatus.needsMigration,
    userSchemaNeeedsMigration: userStatus.needsMigration,
    details: {
      schema: schemaStatus,
      user: userStatus,
    },
  };
}

// ==================== ARTIFACT SCHEMA NORMALIZATION ====================

/**
 * Status of the Artifact schema normalization
 */
export interface ArtifactNormalizationStatus {
  needsNormalization: boolean;
  missingPublished: number;
  missingReactions: number;
  hasOldSchemaFields: number;
  missingDescription: number;
  totalArtifacts: number;
}

/**
 * Check if artifacts need normalization to match the current schema
 *
 * Checks for:
 * - Missing `published` field (should be boolean, default false)
 * - Missing `reactions` field (should be { like: [], dislike: [] })
 * - Old schema fields (project_id, page_id, position should be null/removed)
 * - Missing `description` field (should default to "")
 */
export async function checkArtifactNormalizationStatus(): Promise<ArtifactNormalizationStatus> {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");

  const allArtifacts = await artifactsCollection.find();

  let missingPublished = 0;
  let missingReactions = 0;
  let hasOldSchemaFields = 0;
  let missingDescription = 0;

  for (const artifact of allArtifacts) {
    // Check for missing published field
    if (artifact.published === undefined) {
      missingPublished++;
    }

    // Check for missing or invalid reactions field
    if (
      !artifact.reactions ||
      !Array.isArray(artifact.reactions.like) ||
      !Array.isArray(artifact.reactions.dislike)
    ) {
      missingReactions++;
    }

    // Check for old schema fields (non-null values)
    if (
      (artifact.project_id !== undefined && artifact.project_id !== null) ||
      (artifact.page_id !== undefined && artifact.page_id !== null) ||
      (artifact.position !== undefined && artifact.position !== null)
    ) {
      hasOldSchemaFields++;
    }

    // Check for missing description
    if (artifact.description === undefined) {
      missingDescription++;
    }
  }

  const needsNormalization =
    missingPublished > 0 ||
    missingReactions > 0 ||
    hasOldSchemaFields > 0 ||
    missingDescription > 0;

  return {
    needsNormalization,
    missingPublished,
    missingReactions,
    hasOldSchemaFields,
    missingDescription,
    totalArtifacts: allArtifacts.length,
  };
}

/**
 * Normalize all artifacts to match the current schema
 *
 * This migration:
 * 1. Adds `published: false` to artifacts missing it
 * 2. Adds `reactions: { like: [], dislike: [] }` to artifacts missing it
 * 3. Sets old schema fields (project_id, page_id, position) to null
 * 4. Adds `description: ""` to artifacts missing it
 *
 * The migration is idempotent (safe to run multiple times).
 */
export async function normalizeArtifactSchema(
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; normalizedCount: number; error?: string }> {
  try {
    const quick = await waitForQuick();
    const artifactsCollection = quick.db.collection("artifacts");

    const allArtifacts = await artifactsCollection.find();
    let normalizedCount = 0;

    for (let i = 0; i < allArtifacts.length; i++) {
      const artifact = allArtifacts[i];
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // Add published field if missing
      if (artifact.published === undefined) {
        updates.published = false;
        needsUpdate = true;
      }

      // Add reactions field if missing or invalid
      if (
        !artifact.reactions ||
        !Array.isArray(artifact.reactions.like) ||
        !Array.isArray(artifact.reactions.dislike)
      ) {
        // Preserve existing reactions if partially valid
        const existingLikes = Array.isArray(artifact.reactions?.like)
          ? artifact.reactions.like
          : [];
        const existingDislikes = Array.isArray(artifact.reactions?.dislike)
          ? artifact.reactions.dislike
          : [];
        updates.reactions = {
          like: existingLikes,
          dislike: existingDislikes,
        };
        needsUpdate = true;
      }

      // Set old schema fields to null
      if (artifact.project_id !== undefined && artifact.project_id !== null) {
        updates.project_id = null;
        needsUpdate = true;
      }
      if (artifact.page_id !== undefined && artifact.page_id !== null) {
        updates.page_id = null;
        needsUpdate = true;
      }
      if (artifact.position !== undefined && artifact.position !== null) {
        updates.position = null;
        needsUpdate = true;
      }

      // Add description field if missing
      if (artifact.description === undefined) {
        updates.description = "";
        needsUpdate = true;
      }

      // Apply updates if any
      if (needsUpdate) {
        await artifactsCollection.update(artifact.id, updates);
        normalizedCount++;
      }

      onProgress?.(i + 1, allArtifacts.length);
    }

    return { success: true, normalizedCount };
  } catch (error) {
    console.error("Artifact normalization failed:", error);
    return {
      success: false,
      normalizedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get comprehensive migration status for all migrations
 */
export async function getComprehensiveMigrationStatus(): Promise<{
  schemaNeeedsMigration: boolean;
  userSchemaNeeedsMigration: boolean;
  artifactNormalizationNeeded: boolean;
  details: {
    schema: MigrationStatus;
    user: UserMigrationStatus;
    artifactNormalization: ArtifactNormalizationStatus;
  };
}> {
  const [schemaStatus, userStatus, normalizationStatus] = await Promise.all([
    checkMigrationStatus(),
    checkUserMigrationStatus(),
    checkArtifactNormalizationStatus(),
  ]);

  return {
    schemaNeeedsMigration: schemaStatus.needsMigration,
    userSchemaNeeedsMigration: userStatus.needsMigration,
    artifactNormalizationNeeded: normalizationStatus.needsNormalization,
    details: {
      schema: schemaStatus,
      user: userStatus,
      artifactNormalization: normalizationStatus,
    },
  };
}
