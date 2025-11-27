"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { ArtifactWithCreator, Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { getArtifactById } from "@/lib/quick-db";
import ArtifactComponent from "@/components/presentation/Artifact";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { SaveToProjectDialog } from "@/components/artifacts/SaveToProjectDialog";
import { useReactions } from "@/hooks/useReactions";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { waitForQuick } from "@/lib/quick";
import { createUser, getAllUsers } from "@/lib/quick-users";

// Type for the users.json response
type QuickUserEntry = {
  email: string;
  name: string;
  slack_image_url?: string;
  slack_id?: string;
  slack_handle?: string;
  title?: string;
  github?: string;
};

async function fetchArtifact(
  artifactId: string
): Promise<ArtifactWithCreator | null> {
  const artifact = await getArtifactById(artifactId);
  return artifact;
}

async function fetchAllArtifacts(): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  return await collection.find();
}

async function fetchUsersJson(): Promise<QuickUserEntry[]> {
  const response = await fetch("https://quick.shopify.io/users.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch users.json: ${response.status}`);
  }
  return await response.json();
}

type MigrationStatus = {
  total: number;
  checked: number;
  missing: number;
  created: number;
  notFound: string[];
  errors: string[];
};

export default function Page() {
  const searchParams = useSearchParams();
  const artifactId = searchParams?.get("id") || "";
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] =
    useState<MigrationStatus | null>(null);

  const { data: artifact, mutate } = useSWR<ArtifactWithCreator | null>(
    artifactId ? `artifact-${artifactId}` : null,
    () => (artifactId ? fetchArtifact(artifactId) : null),
    { revalidateOnFocus: false }
  );

  const { user } = useAuth();
  const { userLiked, userDisliked, handleLike, handleDislike } = useReactions({
    artifact,
    mutate,
  });

  const migrateUsers = useCallback(async () => {
    setIsMigrating(true);
    const status: MigrationStatus = {
      total: 0,
      checked: 0,
      missing: 0,
      created: 0,
      notFound: [],
      errors: [],
    };

    try {
      // 1. Fetch all artifacts
      console.log("[Migration] Fetching all artifacts...");
      const allArtifacts = await fetchAllArtifacts();
      status.total = allArtifacts.length;
      setMigrationStatus({ ...status });

      // 2. Get unique creator_ids
      const creatorIds = new Set<string>();
      for (const artifact of allArtifacts) {
        if (artifact.creator_id) {
          creatorIds.add(artifact.creator_id);
        }
      }
      console.log(`[Migration] Found ${creatorIds.size} unique creator_ids`);

      // 3. Get all existing users
      const existingUsers = await getAllUsers();
      const existingUserIds = new Set(existingUsers.map((u) => u.id));
      const existingUserEmails = new Map(
        existingUsers.map((u) => [u.email.toLowerCase(), u])
      );

      // 4. Find missing users
      const missingCreatorIds: string[] = [];
      for (const creatorId of creatorIds) {
        status.checked++;
        // Check if it looks like an email (old format) or UUID (new format)
        const isEmail = creatorId.includes("@");

        if (isEmail) {
          // Old format: creator_id is an email, check if user exists by email
          if (!existingUserEmails.has(creatorId.toLowerCase())) {
            missingCreatorIds.push(creatorId);
          }
        } else {
          // New format: creator_id is a UUID, check if user exists by id
          if (!existingUserIds.has(creatorId)) {
            missingCreatorIds.push(creatorId);
          }
        }
        setMigrationStatus({ ...status });
      }

      status.missing = missingCreatorIds.length;
      console.log(
        `[Migration] Found ${missingCreatorIds.length} missing users`
      );
      setMigrationStatus({ ...status });

      if (missingCreatorIds.length === 0) {
        console.log("[Migration] All users exist!");
        setIsMigrating(false);
        return;
      }

      // 5. Fetch users.json
      console.log("[Migration] Fetching users.json...");
      let usersJsonData: QuickUserEntry[] = [];
      try {
        usersJsonData = await fetchUsersJson();
        console.log(
          `[Migration] Loaded ${usersJsonData.length} users from users.json`
        );
      } catch (error) {
        status.errors.push(`Failed to fetch users.json: ${error}`);
        setMigrationStatus({ ...status });
        setIsMigrating(false);
        return;
      }

      // Create lookup map by email
      const usersJsonMap = new Map<string, QuickUserEntry>();
      for (const u of usersJsonData) {
        if (u.email) {
          usersJsonMap.set(u.email.toLowerCase(), u);
        }
      }

      // 6. For each missing user, try to find in users.json and create
      for (const creatorId of missingCreatorIds) {
        const isEmail = creatorId.includes("@");

        if (isEmail) {
          // creator_id is an email - look up in users.json
          const userData = usersJsonMap.get(creatorId.toLowerCase());

          if (userData) {
            try {
              await createUser({
                email: userData.email,
                name: userData.name,
                slack_image_url: userData.slack_image_url,
                slack_id: userData.slack_id,
                slack_handle: userData.slack_handle,
                title: userData.title,
                github: userData.github,
              });
              status.created++;
              console.log(`[Migration] Created user: ${userData.email}`);
            } catch (error) {
              status.errors.push(
                `Failed to create user ${userData.email}: ${error}`
              );
            }
          } else {
            status.notFound.push(creatorId);
            console.warn(
              `[Migration] User not found in users.json: ${creatorId}`
            );
          }
        } else {
          // creator_id is a UUID - we can't look this up without more info
          status.notFound.push(`UUID: ${creatorId}`);
          console.warn(
            `[Migration] Cannot resolve UUID creator_id: ${creatorId}`
          );
        }

        setMigrationStatus({ ...status });
      }

      console.log("[Migration] Complete!", status);
    } catch (error) {
      status.errors.push(`Migration error: ${error}`);
      console.error("[Migration] Error:", error);
    } finally {
      setMigrationStatus({ ...status });
      setIsMigrating(false);
    }
  }, []);

  // Set header content
  useSetHeader({
    left: (
      <Button variant="default" size="icon" href="/" aria-label="Back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
    ),
    right: (
      <>
        <Button
          variant="default"
          onClick={() => setIsSaveDialogOpen(true)}
          disabled={!user}
        >
          Save to Project
        </Button>
        <DarkModeToggle />
      </>
    ),
  });

  // Show migration UI if no artifact ID
  if (!artifactId) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="max-w-xl w-full space-y-6">
          <h1 className="text-xl font-semibold">User Migration Tool</h1>
          <p className="text-text-secondary">
            Check if all artifacts have a creator_id that matches an existing
            User. Missing users will be fetched from users.json and created.
          </p>

          <Button
            onClick={migrateUsers}
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              "Run User Migration"
            )}
          </Button>

          {migrationStatus && (
            <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Migration Status</h3>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Artifacts:</div>
                <div className="font-mono">{migrationStatus.total}</div>

                <div>Creator IDs Checked:</div>
                <div className="font-mono">{migrationStatus.checked}</div>

                <div>Missing Users:</div>
                <div className="font-mono">{migrationStatus.missing}</div>

                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Users Created:
                </div>
                <div className="font-mono text-green-500">
                  {migrationStatus.created}
                </div>
              </div>

              {migrationStatus.notFound.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 text-amber-500 text-sm mb-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Found in users.json ({migrationStatus.notFound.length}):
                  </div>
                  <div className="text-xs font-mono bg-surface-primary rounded p-2 max-h-32 overflow-y-auto">
                    {migrationStatus.notFound.map((id, i) => (
                      <div key={i} className="truncate">
                        {id}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationStatus.errors.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 text-red-500 text-sm mb-1">
                    <AlertCircle className="h-3 w-3" />
                    Errors ({migrationStatus.errors.length}):
                  </div>
                  <div className="text-xs font-mono bg-surface-primary rounded p-2 max-h-32 overflow-y-auto text-red-500">
                    {migrationStatus.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="flex gap-4">
        <ArtifactComponent
          artifact={artifact}
          className="w-full max-w-[800px] max-h-[80vh] rounded-card overflow-hidden"
        />
        <div>
          <h1 className="text-medium mb-4">Artifact {artifact.name}</h1>
          {artifact.description && (
            <p className="text-small text-text-secondary capitalize">
              {artifact.description}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleLike}
              variant={userLiked ? "default" : "outline"}
            >
              😍 {artifact.reactions?.like?.length || 0}
            </Button>
            <Button
              onClick={handleDislike}
              variant={userDisliked ? "default" : "outline"}
            >
              🤔 {artifact.reactions?.dislike?.length || 0}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <UserAvatar
              id={artifact.creator?.id}
              email={artifact.creator?.email}
              name={artifact.creator?.name}
              imageUrl={artifact.creator?.slack_image_url}
              size="sm"
            />
            <p className="text-small text-text-secondary capitalize">
              {artifact.creator?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Save to Project Dialog */}
      {user && (
        <SaveToProjectDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          artifactId={artifactId}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
