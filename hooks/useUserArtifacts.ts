import useSWR from "swr";
import { waitForQuick } from "@/lib/quick";
import type { Artifact, ArtifactWithCreator, User } from "@/types";

async function fetchUserArtifacts(userId: string): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  return await collection
    .where({ creator_id: userId, published: true })
    .orderBy("created_at", "desc")
    .find();
}

async function fetchUserInfo(userId: string): Promise<User | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("users");
  const userData = await collection.findById(userId);
  return userData ? (userData as User) : null;
}

export function useUserArtifacts(userId: string | null) {
  // Fetch user info
  const { data: userInfo, isLoading: userInfoLoading } = useSWR(
    userId ? `user-${userId}` : null,
    () => (userId ? fetchUserInfo(userId) : null)
  );

  // Fetch user's artifacts
  const {
    data: artifacts = [],
    isLoading: artifactsLoading,
    error,
  } = useSWR<Artifact[]>(
    userId ? `user-artifacts-${userId}` : null,
    () => (userId ? fetchUserArtifacts(userId) : [])
  );

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
    isLoading: userInfoLoading || artifactsLoading,
    error,
  };
}

