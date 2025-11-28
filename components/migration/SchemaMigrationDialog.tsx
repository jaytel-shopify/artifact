"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  checkMigrationStatus,
  migrateToNewSchema,
  checkUserMigrationStatus,
  migrateCreatorIdsToUserIds,
  checkArtifactNormalizationStatus,
  normalizeArtifactSchema,
  type MigrationStatus,
  type UserMigrationStatus,
  type ArtifactNormalizationStatus,
} from "@/lib/schema-migration";
import { useAuth } from "@/components/auth/AuthProvider";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type MigrationState =
  | "checking"
  | "idle"
  | "needs-migration"
  | "needs-user-migration"
  | "needs-normalization"
  | "migrating"
  | "migrating-users"
  | "normalizing"
  | "success"
  | "error";

export function SchemaMigrationDialog() {
  const { user } = useAuth();
  const [state, setState] = useState<MigrationState>("checking");
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [userStatus, setUserStatus] = useState<UserMigrationStatus | null>(null);
  const [normalizationStatus, setNormalizationStatus] = useState<ArtifactNormalizationStatus | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, stage: "" });
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ migratedCount: number; usersCreated?: number } | null>(null);
  const [lastMigrationType, setLastMigrationType] = useState<"schema" | "user" | "normalize">("schema");

  // Check migration status on mount
  useEffect(() => {
    // Check if user has already dismissed this session
    const dismissedKey = "schema-migration-dismissed";
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
      setState("idle");
      return;
    }

    async function check() {
      try {
        // Check all migration types
        const [schemaStatus, userMigrationStatus, artifactNormStatus] = await Promise.all([
          checkMigrationStatus(),
          checkUserMigrationStatus(),
          checkArtifactNormalizationStatus(),
        ]);
        
        setStatus(schemaStatus);
        setUserStatus(userMigrationStatus);
        setNormalizationStatus(artifactNormStatus);
        
        // Prioritize schema migration first, then user migration, then normalization
        if (schemaStatus.needsMigration) {
          setState("needs-migration");
        } else if (userMigrationStatus.needsMigration) {
          setState("needs-user-migration");
        } else if (artifactNormStatus.needsNormalization) {
          setState("needs-normalization");
        } else {
          setState("idle");
        }
      } catch (e) {
        console.error("Failed to check migration status:", e);
        setState("idle");
      }
    }

    check();
  }, []);

  const handleMigrate = async () => {
    if (!user?.email) {
      setError("You must be logged in to perform migration");
      setState("error");
      return;
    }

    setLastMigrationType("schema");
    setState("migrating");
    setProgress({ completed: 0, total: status?.oldSchemaArtifactCount || 0, stage: "Migrating artifacts" });

    const result = await migrateToNewSchema(user.email, (completed, total) => {
      setProgress({ completed, total, stage: "Migrating artifacts" });
    });

    if (result.success) {
      setMigrationResult({ migratedCount: result.migratedCount });
      
      // After schema migration, check if user migration or normalization is needed
      const [userMigrationStatus, artifactNormStatus] = await Promise.all([
        checkUserMigrationStatus(),
        checkArtifactNormalizationStatus(),
      ]);
      
      if (userMigrationStatus.needsMigration) {
        setUserStatus(userMigrationStatus);
        setState("needs-user-migration");
      } else if (artifactNormStatus.needsNormalization) {
        setNormalizationStatus(artifactNormStatus);
        setState("needs-normalization");
      } else {
        setState("success");
      }
    } else {
      setError(result.error || "Migration failed");
      setState("error");
    }
  };

  const handleUserMigrate = async () => {
    setLastMigrationType("user");
    setState("migrating-users");
    setProgress({ completed: 0, total: userStatus?.emailBasedCreatorIds || 0, stage: "Creating user records" });

    const result = await migrateCreatorIdsToUserIds((completed, total, stage) => {
      setProgress({ completed, total, stage });
    });

    if (result.success) {
      setMigrationResult({ migratedCount: result.migratedCount, usersCreated: result.usersCreated });
      
      // After user migration, check if normalization is needed
      const artifactNormStatus = await checkArtifactNormalizationStatus();
      if (artifactNormStatus.needsNormalization) {
        setNormalizationStatus(artifactNormStatus);
        setState("needs-normalization");
      } else {
        setState("success");
      }
    } else {
      setError(result.error || "User migration failed");
      setState("error");
    }
  };

  const handleNormalize = async () => {
    setLastMigrationType("normalize");
    setState("normalizing");
    setProgress({ completed: 0, total: normalizationStatus?.totalArtifacts || 0, stage: "Normalizing artifacts" });

    const result = await normalizeArtifactSchema((completed, total) => {
      setProgress({ completed, total, stage: "Normalizing artifacts" });
    });

    if (result.success) {
      setMigrationResult({ migratedCount: result.normalizedCount });
      setState("success");
    } else {
      setError(result.error || "Artifact normalization failed");
      setState("error");
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("schema-migration-dismissed", "true");
    setDismissed(true);
    setState("idle");
  };

  const handleClose = () => {
    if (state === "success") {
      // Reload the page to refresh all data with new schema
      window.location.reload();
    } else {
      handleDismiss();
    }
  };

  // Don't show dialog if checking, idle, or dismissed
  if (state === "checking" || state === "idle" || dismissed) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state === "needs-migration" && (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Database Schema Update Required
              </>
            )}
            {state === "needs-user-migration" && (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                User Schema Migration Required
              </>
            )}
            {state === "needs-normalization" && (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Artifact Schema Normalization Required
              </>
            )}
            {(state === "migrating" || state === "migrating-users" || state === "normalizing") && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Migrating Data...
              </>
            )}
            {state === "success" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Migration Complete
              </>
            )}
            {state === "error" && (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Migration Failed
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {state === "needs-migration" && status && (
            <div className="space-y-4">
              <DialogDescription>
                Your database contains{" "}
                <strong>{status.oldSchemaArtifactCount}</strong> artifact
                {status.oldSchemaArtifactCount !== 1 ? "s" : ""} using an
                outdated schema. This update will migrate your data to support
                the new many-to-many relationship between artifacts and
                projects.
              </DialogDescription>
              <div className="rounded-lg bg-secondary p-3 text-small">
                <p className="text-medium mb-1">What will happen:</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>
                    Junction entries will be created for project/page links
                  </li>
                  <li>Old schema fields will be removed from artifacts</li>
                  <li>Your data will remain intact</li>
                </ul>
              </div>
            </div>
          )}

          {state === "needs-user-migration" && userStatus && (
            <div className="space-y-4">
              <DialogDescription>
                Your database contains{" "}
                <strong>{userStatus.emailBasedCreatorIds}</strong> record
                {userStatus.emailBasedCreatorIds !== 1 ? "s" : ""} using
                email-based creator IDs. This update will migrate to the new
                User-based schema with proper user references.
              </DialogDescription>
              <div className="rounded-lg bg-secondary p-3 text-small">
                <p className="text-medium mb-1">What will happen:</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>
                    User records will be created for {userStatus.uniqueEmails.length} unique email{userStatus.uniqueEmails.length !== 1 ? "s" : ""}
                  </li>
                  <li>Creator IDs will be updated to reference User records</li>
                  <li>Your data will remain intact</li>
                </ul>
              </div>
            </div>
          )}

          {state === "needs-normalization" && normalizationStatus && (
            <div className="space-y-4">
              <DialogDescription>
                Your database contains{" "}
                <strong>{normalizationStatus.totalArtifacts}</strong> artifact
                {normalizationStatus.totalArtifacts !== 1 ? "s" : ""} that need
                schema normalization to match the current data model.
              </DialogDescription>
              <div className="rounded-lg bg-secondary p-3 text-small">
                <p className="text-medium mb-1">Issues found:</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {normalizationStatus.missingPublished > 0 && (
                    <li>{normalizationStatus.missingPublished} missing &quot;published&quot; field</li>
                  )}
                  {normalizationStatus.missingReactions > 0 && (
                    <li>{normalizationStatus.missingReactions} missing &quot;reactions&quot; field</li>
                  )}
                  {normalizationStatus.hasOldSchemaFields > 0 && (
                    <li>{normalizationStatus.hasOldSchemaFields} with old schema fields</li>
                  )}
                  {normalizationStatus.missingDescription > 0 && (
                    <li>{normalizationStatus.missingDescription} missing &quot;description&quot; field</li>
                  )}
                </ul>
                <p className="text-medium mt-2 mb-1">What will happen:</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>Missing fields will be added with default values</li>
                  <li>Old schema fields will be cleaned up</li>
                  <li>Your data will remain intact</li>
                </ul>
              </div>
            </div>
          )}

          {(state === "migrating" || state === "migrating-users" || state === "normalizing") && (
            <div className="space-y-4">
              <DialogDescription>
                Please wait while your data is being migrated. Do not close this
                window.
              </DialogDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-small">
                  <span>{progress.stage || "Progress"}</span>
                  <span>
                    {progress.completed} / {progress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {state === "success" && migrationResult && (
            <DialogDescription>
              Successfully migrated {migrationResult.migratedCount} record
              {migrationResult.migratedCount !== 1 ? "s" : ""}
              {migrationResult.usersCreated !== undefined && (
                <> and created {migrationResult.usersCreated} user record{migrationResult.usersCreated !== 1 ? "s" : ""}</>
              )}
              . The page will reload to apply changes.
            </DialogDescription>
          )}

          {state === "error" && (
            <div className="space-y-2">
              <DialogDescription className="text-destructive">
                {error || "An error occurred during migration."}
              </DialogDescription>
              <p className="text-small text-text-secondary">
                Please try again or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {state === "needs-migration" && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                Later
              </Button>
              <Button onClick={handleMigrate}>Migrate Now</Button>
            </>
          )}

          {state === "needs-user-migration" && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                Later
              </Button>
              <Button onClick={handleUserMigrate}>Migrate Now</Button>
            </>
          )}

          {state === "needs-normalization" && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                Later
              </Button>
              <Button onClick={handleNormalize}>Normalize Now</Button>
            </>
          )}

          {(state === "migrating" || state === "migrating-users" || state === "normalizing") && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Migrating...
            </Button>
          )}

          {state === "success" && (
            <Button onClick={handleClose}>Reload Page</Button>
          )}

          {state === "error" && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button onClick={
                lastMigrationType === "user" 
                  ? handleUserMigrate 
                  : lastMigrationType === "normalize" 
                    ? handleNormalize 
                    : handleMigrate
              }>Retry</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
