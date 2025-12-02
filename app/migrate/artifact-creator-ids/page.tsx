"use client";

import { useState, useCallback } from "react";
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
  artifactsTotal: number;
  artifactsNeedingMigration: number;
  artifactsUpdated: number;
  artifactsSkipped: number;
  projectsTotal: number;
  projectsNeedingMigration: number;
  projectsUpdated: number;
  projectsSkipped: number;
  usersCreated: number;
  usersFoundInDirectory: number;
  usersFoundInCollection: number;
  errors: number;
}

interface MigrationProgress {
  phase:
    | "idle"
    | "loading-users"
    | "analyzing-artifacts"
    | "migrating-artifacts"
    | "analyzing-projects"
    | "migrating-projects"
    | "complete"
    | "error";
  current: number;
  total: number;
  currentItem: string;
  logs: MigrationLog[];
  stats: MigrationStats;
}

export default function ArtifactCreatorIdsMigrationPage() {
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: "idle",
    current: 0,
    total: 0,
    currentItem: "",
    logs: [],
    stats: {
      artifactsTotal: 0,
      artifactsNeedingMigration: 0,
      artifactsUpdated: 0,
      artifactsSkipped: 0,
      projectsTotal: 0,
      projectsNeedingMigration: 0,
      projectsUpdated: 0,
      projectsSkipped: 0,
      usersCreated: 0,
      usersFoundInDirectory: 0,
      usersFoundInCollection: 0,
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
      return userMap;
    } catch (error: any) {
      addLog("error", `Failed to load users.json: ${error.message}`);
      throw error;
    }
  }, [addLog]);

  // Analyze artifacts to see how many need migration
  const analyzeArtifacts = useCallback(async () => {
    setProgress((prev) => ({
      ...prev,
      phase: "analyzing-artifacts",
      currentItem: "Loading artifacts...",
    }));
    addLog("info", "Analyzing artifacts collection...");

    const quick = await waitForQuick();
    const artifactsCollection = quick.db.collection("artifacts");
    const artifacts = await artifactsCollection.find();

    addLog("info", `Found ${artifacts.length} total artifacts`);

    // Find artifacts with email-based creator_ids
    const needsMigration = artifacts.filter(
      (a: any) => a.creator_id && a.creator_id.includes("@")
    );

    addLog(
      "info",
      `Found ${needsMigration.length} artifacts with email-based creator_id`
    );

    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        artifactsTotal: artifacts.length,
        artifactsNeedingMigration: needsMigration.length,
      },
    }));

    return { artifacts, needsMigration };
  }, [addLog]);

  // Analyze projects to see how many need migration
  const analyzeProjects = useCallback(async () => {
    setProgress((prev) => ({
      ...prev,
      phase: "analyzing-projects",
      currentItem: "Loading projects...",
    }));
    addLog("info", "Analyzing projects collection...");

    const quick = await waitForQuick();
    const projectsCollection = quick.db.collection("projects");
    const projects = await projectsCollection.find();

    addLog("info", `Found ${projects.length} total projects`);

    // Find projects with email-based creator_ids
    const needsMigration = projects.filter(
      (p: any) => p.creator_id && p.creator_id.includes("@")
    );

    addLog(
      "info",
      `Found ${needsMigration.length} projects with email-based creator_id`
    );

    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        projectsTotal: projects.length,
        projectsNeedingMigration: needsMigration.length,
      },
    }));

    return { projects, needsMigration };
  }, [addLog]);

  // Get or create user by email
  const getOrCreateUserByEmail = useCallback(
    async (
      email: string,
      userMap: Map<string, DirectoryUser>,
      usersCollection: any,
      statsRef: { usersCreated: number; usersFoundInDirectory: number; usersFoundInCollection: number }
    ): Promise<{ userId: string; source: "directory" | "collection" | "created" } | null> => {
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check directory users first
      const directoryUser = userMap.get(normalizedEmail);
      if (directoryUser) {
        // Also ensure this user exists in the collection
        try {
          await usersCollection.findById(directoryUser.id);
        } catch {
          // User doesn't exist in collection, create it
          if (!isDryRun) {
            try {
              await usersCollection.create({
                id: directoryUser.id,
                email: directoryUser.email.toLowerCase(),
                name: directoryUser.name,
                slack_image_url: directoryUser.slack_image_url,
                slack_id: directoryUser.slack_id,
                slack_handle: directoryUser.slack_handle,
                title: directoryUser.title,
              });
              addLog("info", `Created user from directory: ${directoryUser.email}`);
              statsRef.usersCreated++;
            } catch {
              // User might have been created in a parallel operation
            }
          }
        }
        statsRef.usersFoundInDirectory++;
        return { userId: directoryUser.id, source: "directory" };
      }

      // 2. Check if user exists in collection by email
      const existingUsers = await usersCollection
        .where({ email: normalizedEmail })
        .find();
      
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        // If the user has a proper ID (not email-based), use it
        if (!existingUser.id.includes("@")) {
          statsRef.usersFoundInCollection++;
          return { userId: existingUser.id, source: "collection" };
        }
      }

      // 3. Create a new user with a generated ID
      // This is for users not in the directory
      const namePart = normalizedEmail.split("@")[0] || "Unknown User";
      const name = namePart
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      // Generate a simple ID from the email for consistency
      const userId = `user_${normalizedEmail.replace(/[@.]/g, "_")}`;

      if (!isDryRun) {
        try {
          await usersCollection.create({
            id: userId,
            email: normalizedEmail,
            name,
          });
          addLog("info", `Created new user: ${normalizedEmail} -> ${userId}`);
          statsRef.usersCreated++;
        } catch (err: any) {
          // User might already exist with this ID
          addLog("warning", `Could not create user ${userId}: ${err.message}`);
        }
      } else {
        statsRef.usersCreated++;
      }

      return { userId, source: "created" };
    },
    [addLog, isDryRun]
  );

  // Migrate artifacts
  const migrateArtifacts = useCallback(
    async (
      needsMigration: any[],
      userMap: Map<string, DirectoryUser>,
      usersCollection: any
    ) => {
      setProgress((prev) => ({
        ...prev,
        phase: "migrating-artifacts",
        current: 0,
        total: needsMigration.length,
        currentItem: "Starting artifact migration...",
      }));
      addLog("info", `Migrating ${needsMigration.length} artifacts...`);

      const quick = await waitForQuick();
      const artifactsCollection = quick.db.collection("artifacts");

      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const statsRef = { usersCreated: 0, usersFoundInDirectory: 0, usersFoundInCollection: 0 };

      for (let i = 0; i < needsMigration.length; i++) {
        const artifact = needsMigration[i];
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentItem: `Processing artifact: ${artifact.name || artifact.id} (${artifact.creator_id})`,
        }));

        try {
          const email = artifact.creator_id;
          const result = await getOrCreateUserByEmail(email, userMap, usersCollection, statsRef);

          if (!result) {
            addLog("warning", `Could not resolve user for: ${email}`);
            skipped++;
            continue;
          }

          const { userId, source } = result;

          // Update artifact
          if (!isDryRun) {
            await artifactsCollection.update(artifact.id, {
              creator_id: userId,
            });
          }

          addLog(
            "success",
            `${isDryRun ? "[DRY RUN] Would update" : "Updated"} artifact "${artifact.name || artifact.id}": ${email} -> ${userId} (${source})`
          );
          updated++;
        } catch (error: any) {
          addLog("error", `Error processing artifact ${artifact.id}: ${error.message}`);
          errors++;
        }

        // Update stats
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            artifactsUpdated: updated,
            artifactsSkipped: skipped,
            usersCreated: statsRef.usersCreated,
            usersFoundInDirectory: statsRef.usersFoundInDirectory,
            usersFoundInCollection: statsRef.usersFoundInCollection,
            errors,
          },
        }));
      }

      addLog(
        "info",
        `Artifact migration complete: ${updated} updated, ${skipped} skipped, ${errors} errors`
      );

      return statsRef;
    },
    [addLog, isDryRun, getOrCreateUserByEmail]
  );

  // Migrate projects
  const migrateProjects = useCallback(
    async (
      needsMigration: any[],
      userMap: Map<string, DirectoryUser>,
      usersCollection: any,
      initialStatsRef: { usersCreated: number; usersFoundInDirectory: number; usersFoundInCollection: number }
    ) => {
      setProgress((prev) => ({
        ...prev,
        phase: "migrating-projects",
        current: 0,
        total: needsMigration.length,
        currentItem: "Starting project migration...",
      }));
      addLog("info", `Migrating ${needsMigration.length} projects...`);

      const quick = await waitForQuick();
      const projectsCollection = quick.db.collection("projects");

      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const statsRef = { ...initialStatsRef };

      for (let i = 0; i < needsMigration.length; i++) {
        const project = needsMigration[i];
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentItem: `Processing project: ${project.name || project.id} (${project.creator_id})`,
        }));

        try {
          const email = project.creator_id;
          const result = await getOrCreateUserByEmail(email, userMap, usersCollection, statsRef);

          if (!result) {
            addLog("warning", `Could not resolve user for project: ${email}`);
            skipped++;
            continue;
          }

          const { userId, source } = result;

          // Update project
          if (!isDryRun) {
            await projectsCollection.update(project.id, {
              creator_id: userId,
            });
          }

          addLog(
            "success",
            `${isDryRun ? "[DRY RUN] Would update" : "Updated"} project "${project.name || project.id}": ${email} -> ${userId} (${source})`
          );
          updated++;
        } catch (error: any) {
          addLog("error", `Error processing project ${project.id}: ${error.message}`);
          errors++;
        }

        // Update stats
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            projectsUpdated: updated,
            projectsSkipped: skipped,
            usersCreated: statsRef.usersCreated,
            usersFoundInDirectory: statsRef.usersFoundInDirectory,
            usersFoundInCollection: statsRef.usersFoundInCollection,
            errors: prev.stats.errors + errors,
          },
        }));
      }

      addLog(
        "info",
        `Project migration complete: ${updated} updated, ${skipped} skipped, ${errors} errors`
      );
    },
    [addLog, isDryRun, getOrCreateUserByEmail]
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
        artifactsTotal: 0,
        artifactsNeedingMigration: 0,
        artifactsUpdated: 0,
        artifactsSkipped: 0,
        projectsTotal: 0,
        projectsNeedingMigration: 0,
        projectsUpdated: 0,
        projectsSkipped: 0,
        usersCreated: 0,
        usersFoundInDirectory: 0,
        usersFoundInCollection: 0,
        errors: 0,
      },
    });

    try {
      addLog("info", `Starting migration (${isDryRun ? "DRY RUN" : "LIVE"})...`);

      // Load directory users
      const userMap = await loadDirectoryUsers();

      // Get users collection for later use
      const quick = await waitForQuick();
      const usersCollection = quick.db.collection("users");

      // Analyze artifacts
      const { needsMigration: artifactsToMigrate } = await analyzeArtifacts();

      // Analyze projects
      const { needsMigration: projectsToMigrate } = await analyzeProjects();

      if (artifactsToMigrate.length === 0 && projectsToMigrate.length === 0) {
        addLog("success", "No artifacts or projects need migration!");
        setProgress((prev) => ({
          ...prev,
          phase: "complete",
          currentItem: "No migration needed",
        }));
        return;
      }

      // Migrate artifacts
      let statsRef = { usersCreated: 0, usersFoundInDirectory: 0, usersFoundInCollection: 0 };
      if (artifactsToMigrate.length > 0) {
        statsRef = await migrateArtifacts(artifactsToMigrate, userMap, usersCollection);
      }

      // Migrate projects
      if (projectsToMigrate.length > 0) {
        await migrateProjects(projectsToMigrate, userMap, usersCollection, statsRef);
      }

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
      case "analyzing-artifacts":
        return "Analyzing Artifacts";
      case "migrating-artifacts":
        return "Migrating Artifacts";
      case "analyzing-projects":
        return "Analyzing Projects";
      case "migrating-projects":
        return "Migrating Projects";
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
        <h1 className="text-4xl font-bold mb-2">Creator ID Migration</h1>
        <p className="text-gray-600">
          Migrate artifact and project creator_id from email addresses to user IDs
        </p>
      </div>

      {progress.phase === "idle" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Migration Options</CardTitle>
            <CardDescription>
              This migration will update all artifacts and projects that have email-based
              creator_id values to use the proper user.id instead. Users will be
              created in the users collection if they don&apos;t exist.
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
                {/* Artifacts Section */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {progress.stats.artifactsTotal}
                  </div>
                  <div className="text-xs text-gray-600">Total Artifacts</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.stats.artifactsNeedingMigration}
                  </div>
                  <div className="text-xs text-gray-600">Artifacts Need Migration</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.stats.artifactsUpdated}
                  </div>
                  <div className="text-xs text-gray-600">Artifacts Updated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.stats.artifactsSkipped}
                  </div>
                  <div className="text-xs text-gray-600">Artifacts Skipped</div>
                </div>

                {/* Projects Section */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {progress.stats.projectsTotal}
                  </div>
                  <div className="text-xs text-gray-600">Total Projects</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.stats.projectsNeedingMigration}
                  </div>
                  <div className="text-xs text-gray-600">Projects Need Migration</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.stats.projectsUpdated}
                  </div>
                  <div className="text-xs text-gray-600">Projects Updated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.stats.projectsSkipped}
                  </div>
                  <div className="text-xs text-gray-600">Projects Skipped</div>
                </div>

                {/* Users Section */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {progress.stats.usersFoundInDirectory}
                  </div>
                  <div className="text-xs text-gray-600">From Directory</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-cyan-600">
                    {progress.stats.usersFoundInCollection}
                  </div>
                  <div className="text-xs text-gray-600">From Collection</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">
                    {progress.stats.usersCreated}
                  </div>
                  <div className="text-xs text-gray-600">Users Created</div>
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
