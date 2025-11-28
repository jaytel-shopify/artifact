import { mutate as globalMutate, KeyedMutator } from "swr";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateArtifact } from "@/lib/quick-db";
import { cacheKeys } from "@/lib/cache-keys";
import type { Artifact } from "@/types";

interface UseReactionsOptions {
  artifact: Artifact | null | undefined;
  /** Optional local mutator for the specific artifact (e.g., from useSWR) */
  mutate?: KeyedMutator<Artifact | null>;
}

export function useReactions({ artifact, mutate }: UseReactionsOptions) {
  const { user } = useAuth();

  const userLiked =
    user?.id && artifact ? artifact.reactions?.like?.includes(user.id) : false;
  const userDisliked =
    user?.id && artifact
      ? artifact.reactions?.dislike?.includes(user.id)
      : false;

  const toggleReaction = async (type: "like" | "dislike") => {
    if (!user?.id || !artifact) return;

    const currentReactions = artifact.reactions || { like: [], dislike: [] };
    const reactionArray = currentReactions[type] || [];
    const hasReacted = reactionArray.includes(user.id);

    const newReactions = {
      ...currentReactions,
      [type]: hasReacted
        ? reactionArray.filter((id) => id !== user.id)
        : [...reactionArray, user.id],
    };

    const optimisticArtifact: Artifact = {
      ...artifact,
      reactions: newReactions,
    };

    // Optimistic update for local mutator if provided
    if (mutate) {
      mutate(optimisticArtifact, { revalidate: false });
    }

    // Optimistic update for public-artifacts cache
    globalMutate(
      cacheKeys.publicArtifacts,
      (current: Artifact[] = []) =>
        current.map((a) =>
          a.id === artifact.id ? { ...a, reactions: newReactions } : a
        ),
      { revalidate: false }
    );

    try {
      await updateArtifact(artifact.id, { reactions: newReactions });
    } catch (error) {
      console.error(`Failed to toggle ${type}:`, error);
      // Revert on error
      if (mutate) mutate();
      globalMutate(cacheKeys.publicArtifacts);
    }
  };

  const handleLike = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    await toggleReaction("like");
  };

  const handleDislike = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    await toggleReaction("dislike");
  };

  return {
    userLiked,
    userDisliked,
    handleLike,
    handleDislike,
    canReact: !!user,
  };
}
