import useSWR from "swr";
import { waitForQuick } from "@/lib/quick";
import { getUserFromDirectoryById } from "@/lib/access-control";
import type { Artifact, ArtifactWithCreator, User } from "@/types";

async function fetchUserArtifacts(userId: string): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  return await collection
    .where({ creator_id: userId, published: true })
    .orderBy("published_at", "desc")
    .find();
}

async function fetchUserInfo(userId: string): Promise<User | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("users");

  // First try Quick.db
  const results = await collection.where({ id: userId }).find();
  if (results.length > 0) {
    const dbUser = results[0] as User;

    // If title is missing, fetch from directory and merge
    if (!dbUser.title) {
      const directoryUser = await getUserFromDirectoryById(userId);
      if (directoryUser?.title) {
        return { ...dbUser, title: directoryUser.title };
      }
    }
    return dbUser;
  }

  // Fall back to /users.json for users who haven't logged in
  return await getUserFromDirectoryById(userId);
}

export function useUserArtifacts(userId: string | null) {
  // Fetch user info
  const { data: userInfo, isLoading: userInfoLoading } = useSWR(
    userId ? `user-${userId}` : null,
    () => (userId ? fetchUserInfo(userId) : null)
  );

  // Fetch user's artifacts
  const {
    data: artifactsData,
    isLoading: artifactsLoading,
    error,
  } = useSWR<Artifact[]>(userId ? `user-artifacts-${userId}` : null, () =>
    userId ? fetchUserArtifacts(userId) : []
  );

  // Only use empty array once data has been fetched
  const artifacts = artifactsData ?? [];

  // Attach creator info to artifacts
  const artifactsWithCreator: ArtifactWithCreator[] = artifacts.map(
    (artifact) => ({
      ...artifact,
      creator: userInfo || undefined,
    })
  );

  return {
    artifacts: artifactsWithCreator,
    userInfo,
    isLoading:
      userInfoLoading || artifactsLoading || artifactsData === undefined,
    hasLoadedOnce: artifactsData !== undefined,
    error,
  };
}
