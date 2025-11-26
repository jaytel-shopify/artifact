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
  type MigrationStatus,
} from "@/lib/schema-migration";
import { useAuth } from "@/components/auth/AuthProvider";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type MigrationState =
  | "checking"
  | "idle"
  | "needs-migration"
  | "migrating"
  | "success"
  | "error";

export function SchemaMigrationDialog() {
  const { user } = useAuth();
  const [state, setState] = useState<MigrationState>("checking");
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

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
        const migrationStatus = await checkMigrationStatus();
        setStatus(migrationStatus);
        setState(migrationStatus.needsMigration ? "needs-migration" : "idle");
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

    setState("migrating");
    setProgress({ completed: 0, total: status?.oldSchemaArtifactCount || 0 });

    const result = await migrateToNewSchema(user.email, (completed, total) => {
      setProgress({ completed, total });
    });

    if (result.success) {
      setState("success");
    } else {
      setError(result.error || "Migration failed");
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
            {state === "migrating" && (
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
                Your database contains <strong>{status.oldSchemaArtifactCount}</strong>{" "}
                artifact{status.oldSchemaArtifactCount !== 1 ? "s" : ""} using an
                outdated schema. This update will migrate your data to support the
                new many-to-many relationship between artifacts and projects.
              </DialogDescription>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">What will happen:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Junction entries will be created for project/page links</li>
                  <li>Old schema fields will be removed from artifacts</li>
                  <li>Your data will remain intact</li>
                </ul>
              </div>
            </div>
          )}

          {state === "migrating" && (
            <div className="space-y-4">
              <DialogDescription>
                Please wait while your data is being migrated. Do not close this
                window.
              </DialogDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {progress.completed} / {progress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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

          {state === "success" && (
            <DialogDescription>
              Successfully migrated {progress.completed} artifact
              {progress.completed !== 1 ? "s" : ""} to the new schema. The page
              will reload to apply changes.
            </DialogDescription>
          )}

          {state === "error" && (
            <div className="space-y-2">
              <DialogDescription className="text-destructive">
                {error || "An error occurred during migration."}
              </DialogDescription>
              <p className="text-sm text-muted-foreground">
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

          {state === "migrating" && (
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
              <Button onClick={handleMigrate}>Retry</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

