"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { waitForQuick } from "@/lib/quick";

interface DirectoryUser {
  id: string;
  email: string;
  name: string;
  slack_handle?: string;
  slack_image_url?: string;
  slack_id?: string;
  title?: string;
}

interface MigrationLog {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface MigrationStats {
  accessEntriesTotal: number;
  accessEntriesUpdated: number;
  accessEntriesSkipped: number;
  accessEntriesNotFound: number;
  usersTotal: number;
  usersUpdated: number;
  usersSkipped: number;
  usersNotFound: number;
  errors: number;
}

interface MigrationProgress {
  phase:
    | "idle"
    | "loading-users"
    | "migrating-access"
    | "migrating-users"
    | "complete"
    | "error";
  current: number;
  total: number;
  currentItem: string;
  logs: MigrationLog[];
  stats: MigrationStats;
}

export default function AccessControlMigrationPage() {
  const [directoryUsers, setDirectoryUsers] = useState<Map<string, DirectoryUser>>(new Map());
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: "idle",
    current: 0,
    total: 0,
    currentItem: "",
    logs: [],
    stats: {
      accessEntriesTotal: 0,
      accessEntriesUpdated: 0,
      accessEntriesSkipped: 0,
      accessEntriesNotFound: 0,
      usersTotal: 0,
      usersUpdated: 0,
      usersSkipped: 0,
      usersNotFound: 0,
      errors: 0,
    },
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);

  const addLog = useCallback(
    (type: MigrationLog["type"], message: string) => {
      setProgress((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date().toISOString(),
            type,
            message,
          },
        ],
      }));
    },
    []
  );

  // Load directory users from users.json
  const loadDirectoryUsers = useCallback(async (): Promise<Map<string, DirectoryUser>> => {
    setProgress((prev) => ({
      ...prev,
      phase: "loading-users",
      currentItem: "Fetching users.json...",
    }));
    addLog("info", "Loading user directory from /users.json...");

    try {
      const response = await fetch("/users.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch users.json: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.split("\n").filter((line) => line.trim().length > 0);

      // Parse NDJSON and build lookup map by email (case-insensitive)
      const userMap = new Map<string, DirectoryUser>();
      let parsed = 0;
      let skipped = 0;

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const emailKey = data.email?.toLowerCase();

          if (emailKey && data.id && !userMap.has(emailKey)) {
            userMap.set(emailKey, {
              id: data.id,
              email: data.email,
              name: data.name || "",
              slack_handle: data.slack_handle,
              slack_image_url: data.slack_image_url,
              slack_id: data.slack_id,
              title: data.title,
            });
            parsed++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }

      addLog(
        "success",
        `Loaded ${parsed} users from directory (${skipped} skipped/duplicate)`
      );
      setDirectoryUsers(userMap);
      return userMap;
    } catch (error: any) {
      addLog("error", `Failed to load users.json: ${error.message}`);
      throw error;
    }
  }, [addLog]);

  // Migrate access_control collection
  const migrateAccessControl = useCallback(
    async (userMap: Map<string, DirectoryUser>) => {
      setProgress((prev) => ({
        ...prev,
        phase: "migrating-access",
        currentItem: "Loading access_control entries...",
      }));
      addLog("info", "Starting access_control migration...");

      const quick = await waitForQuick();
      const collection = quick.db.collection("access_control");
      const entries = await collection.find();

      addLog("info", `Found ${entries.length} access_control entries`);

      setProgress((prev) => ({
        ...prev,
        total: entries.length,
        stats: { ...prev.stats, accessEntriesTotal: entries.length },
      }));

      let updated = 0;
      let skipped = 0;
      let notFound = 0;
      let errors = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentItem: `Processing: ${entry.user_email || entry.id}`,
        }));

        try {
          // Check if already has a proper user_id (not email-based)
          if (entry.user_id && !entry.user_id.includes("@")) {
            addLog(
              "info",
              `Skipped ${entry.user_email}: already has user_id ${entry.user_id}`
            );
            skipped++;
            continue;
          }

          // Look up user by email
          const email = entry.user_email?.toLowerCase();
          if (!email) {
            addLog("warning", `Entry ${entry.id} has no user_email`);
            notFound++;
            continue;
          }

          const directoryUser = userMap.get(email);
          if (!directoryUser) {
            addLog("warning", `User not found in directory: ${email}`);
            notFound++;
            continue;
          }

          // Update entry with user_id
          if (!isDryRun) {
            await collection.update(entry.id, {
              user_id: directoryUser.id,
            });
          }

          addLog(
            "success",
            `${isDryRun ? "[DRY RUN] Would update" : "Updated"} access entry for ${email} -> user_id: ${directoryUser.id}`
          );
          updated++;
        } catch (error: any) {
          addLog("error", `Error processing ${entry.id}: ${error.message}`);
          errors++;
        }

        // Update stats
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            accessEntriesUpdated: updated,
            accessEntriesSkipped: skipped,
            accessEntriesNotFound: notFound,
            errors: prev.stats.errors + (errors > prev.stats.errors ? 1 : 0),
          },
        }));
      }

      addLog(
        "info",
        `Access control migration complete: ${updated} updated, ${skipped} skipped, ${notFound} not found`
      );
    },
    [addLog, isDryRun]
  );

  // Migrate users collection (fix email-based IDs)
  const migrateUsers = useCallback(
    async (userMap: Map<string, DirectoryUser>) => {
      setProgress((prev) => ({
        ...prev,
        phase: "migrating-users",
        current: 0,
        total: 0,
        currentItem: "Loading users collection...",
      }));
      addLog("info", "Starting users collection migration...");

      const quick = await waitForQuick();
      const collection = quick.db.collection("users");
      const users = await collection.find();

      addLog("info", `Found ${users.length} users in collection`);

      // Filter to only users with email-based IDs
      const usersWithEmailIds = users.filter(
        (u: any) => u.id && u.id.includes("@")
      );
      addLog(
        "info",
        `Found ${usersWithEmailIds.length} users with email-based IDs`
      );

      setProgress((prev) => ({
        ...prev,
        total: usersWithEmailIds.length,
        stats: { ...prev.stats, usersTotal: usersWithEmailIds.length },
      }));

      let updated = 0;
      let skipped = 0;
      let notFound = 0;
      let errors = 0;

      for (let i = 0; i < usersWithEmailIds.length; i++) {
        const user = usersWithEmailIds[i];
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentItem: `Processing user: ${user.email || user.id}`,
        }));

        try {
          const email = (user.email || user.id).toLowerCase();
          const directoryUser = userMap.get(email);

          if (!directoryUser) {
            addLog("warning", `User not found in directory: ${email}`);
            notFound++;
            continue;
          }

          // Check if a user with the correct ID already exists
          let existingCorrectUser = null;
          try {
            existingCorrectUser = await collection.findById(directoryUser.id);
          } catch {
            // User doesn't exist with correct ID
          }

          if (existingCorrectUser) {
            // Correct user already exists, we should delete the email-based one
            addLog(
              "info",
              `${isDryRun ? "[DRY RUN] Would delete" : "Deleting"} duplicate email-based user ${user.id} (correct user ${directoryUser.id} exists)`
            );
            if (!isDryRun) {
              await collection.delete(user.id);
            }
            skipped++;
            continue;
          }

          // Create new user with correct ID and delete old one
          // We can't update the ID field, so we need to create new and delete old
          if (!isDryRun) {
            await collection.create({
              id: directoryUser.id,
              email: directoryUser.email.toLowerCase(),
              name: directoryUser.name || user.name,
              slack_image_url: directoryUser.slack_image_url || user.slack_image_url,
              slack_id: directoryUser.slack_id || user.slack_id,
              slack_handle: directoryUser.slack_handle || user.slack_handle,
              title: directoryUser.title || user.title,
            });

            // Delete old email-based user
            await collection.delete(user.id);
          }

          addLog(
            "success",
            `${isDryRun ? "[DRY RUN] Would migrate" : "Migrated"} user ${email}: ${user.id} -> ${directoryUser.id}`
          );
          updated++;
        } catch (error: any) {
          addLog("error", `Error processing user ${user.id}: ${error.message}`);
          errors++;
        }

        // Update stats
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            usersUpdated: updated,
            usersSkipped: skipped,
            usersNotFound: notFound,
            errors: prev.stats.errors + (errors > prev.stats.errors ? 1 : 0),
          },
        }));
      }

      addLog(
        "info",
        `Users migration complete: ${updated} migrated, ${skipped} skipped, ${notFound} not found`
      );
    },
    [addLog, isDryRun]
  );

  // Run full migration
  const runMigration = async () => {
    setIsRunning(true);
    setProgress({
      phase: "loading-users",
      current: 0,
      total: 0,
      currentItem: "Starting migration...",
      logs: [],
      stats: {
        accessEntriesTotal: 0,
        accessEntriesUpdated: 0,
        accessEntriesSkipped: 0,
        accessEntriesNotFound: 0,
        usersTotal: 0,
        usersUpdated: 0,
        usersSkipped: 0,
        usersNotFound: 0,
        errors: 0,
      },
    });

    try {
      addLog("info", `Starting migration (${isDryRun ? "DRY RUN" : "LIVE"})...`);

      // Load directory users
      const userMap = await loadDirectoryUsers();

      // Migrate access_control collection
      await migrateAccessControl(userMap);

      // Migrate users collection
      await migrateUsers(userMap);

      setProgress((prev) => ({
        ...prev,
        phase: "complete",
        currentItem: "Migration complete!",
      }));
      addLog("success", "Migration completed successfully!");
    } catch (error: any) {
      setProgress((prev) => ({
        ...prev,
        phase: "error",
        currentItem: error.message,
      }));
      addLog("error", `Migration failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getPhaseLabel = (phase: MigrationProgress["phase"]) => {
    switch (phase) {
      case "idle":
        return "Ready";
      case "loading-users":
        return "Loading User Directory";
      case "migrating-access":
        return "Migrating Access Control";
      case "migrating-users":
        return "Migrating Users";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Processing";
    }
  };

  const getLogIcon = (type: MigrationLog["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  const getLogColor = (type: MigrationLog["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Access Control Migration</h1>
        <p className="text-gray-600">
          Migrate access_control and users collections to use user.id instead of
          email
        </p>
      </div>

      {progress.phase === "idle" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Migration Options</CardTitle>
            <CardDescription>
              This migration will update the access_control collection to add
              user_id fields, and fix users with email-based IDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="dryRun"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="dryRun" className="text-sm">
                Dry run (preview changes without modifying database)
              </label>
            </div>

            <Button
              onClick={runMigration}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning
                ? "Migration in Progress..."
                : isDryRun
                  ? "Preview Migration (Dry Run)"
                  : "Run Migration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {progress.phase !== "idle" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{getPhaseLabel(progress.phase)}</CardTitle>
              <CardDescription>{progress.currentItem}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                  <span>
                    {progress.total > 0
                      ? Math.round((progress.current / progress.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.phase === "complete"
                        ? "bg-green-500"
                        : progress.phase === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                    style={{
                      width:
                        progress.total > 0
                          ? `${(progress.current / progress.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.stats.accessEntriesUpdated}
                  </div>
                  <div className="text-xs text-gray-600">Access Updated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.stats.accessEntriesSkipped}
                  </div>
                  <div className="text-xs text-gray-600">Access Skipped</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.stats.usersUpdated}
                  </div>
                  <div className="text-xs text-gray-600">Users Migrated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">
                    {progress.stats.accessEntriesNotFound +
                      progress.stats.usersNotFound}
                  </div>
                  <div className="text-xs text-gray-600">Not Found</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {progress.stats.errors}
                  </div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>

              {progress.phase === "complete" && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() =>
                      setProgress((prev) => ({ ...prev, phase: "idle" }))
                    }
                    variant="outline"
                    className="flex-1"
                  >
                    Run Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Migration Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {progress.logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    <span className={getLogColor(log.type)}>
                      {getLogIcon(log.type)}
                    </span>{" "}
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

