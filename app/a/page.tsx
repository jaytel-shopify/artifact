"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { ArtifactWithCreator } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { getArtifactById, deleteArtifact } from "@/lib/quick-db";
import ArtifactComponent from "@/components/presentation/Artifact";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { SaveToProjectDialog } from "@/components/artifacts/SaveToProjectDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useReactions } from "@/hooks/useReactions";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { formatTimeAgo } from "@/lib/utils";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import { useUserArtifacts } from "@/hooks/useUserArtifacts";
import { getCurrentPath } from "@/lib/navigation";
import { cacheKeys } from "@/lib/cache-keys";

async function fetchArtifact(
  artifactId: string
): Promise<ArtifactWithCreator | null> {
  const artifact = await getArtifactById(artifactId);
  return artifact;
}

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artifactId = searchParams?.get("id") || "";
  const userId = searchParams?.get("userId") || null;
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Capture the path we came from when this page mounts
  useEffect(() => {
    const path = getCurrentPath();
    // Only store if it's not another detail page
    if (path && !path.startsWith("/a")) {
      setPreviousPath(path);
    }
  }, []); // Empty deps - only run on mount

  const handleBack = useCallback(() => {
    if (previousPath) {
      router.push(previousPath);
    } else {
      router.push("/");
    }
  }, [previousPath, router]);

  const {
    data: artifact,
    isLoading,
    mutate,
  } = useSWR<ArtifactWithCreator | null>(
    artifactId ? `artifact-${artifactId}` : null,
    () => (artifactId ? fetchArtifact(artifactId) : null),
    { revalidateOnFocus: false }
  );

  // Fetch artifacts for navigation - use user artifacts if userId is provided
  const { artifacts: publishedArtifacts } = usePublicArtifacts();
  const { artifacts: userArtifacts } = useUserArtifacts(userId);

  // Use user artifacts for navigation if coming from user profile, otherwise use public artifacts
  const navigationArtifacts = userId ? userArtifacts : publishedArtifacts;

  // Find current artifact index and get next/previous
  const currentIndex = navigationArtifacts.findIndex(
    (a) => a.id === artifactId
  );
  const hasNext = currentIndex > 0; // Going backwards in time (newer)
  const hasPrevious =
    currentIndex >= 0 && currentIndex < navigationArtifacts.length - 1; // Going forwards in time (older)
  const nextArtifact = hasNext ? navigationArtifacts[currentIndex - 1] : null;
  const previousArtifact = hasPrevious
    ? navigationArtifacts[currentIndex + 1]
    : null;

  const handleNext = useCallback(() => {
    if (nextArtifact) {
      router.push(
        `/a/?id=${nextArtifact.id}${userId ? `&userId=${userId}` : ""}`
      );
    }
  }, [nextArtifact, router, userId]);

  const handlePrevious = useCallback(() => {
    if (previousArtifact) {
      router.push(
        `/a/?id=${previousArtifact.id}${userId ? `&userId=${userId}` : ""}`
      );
    }
  }, [previousArtifact, router, userId]);

  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the creator
  const isCreator = user?.id && artifact?.creator_id === user.id;

  const handleDelete = useCallback(async () => {
    if (!artifact || !isCreator) return;

    setIsDeleting(true);
    try {
      await deleteArtifact(artifact.id);
      toast.success("Artifact deleted");

      // Invalidate caches
      globalMutate(cacheKeys.publicArtifacts);
      if (user?.id) {
        globalMutate(cacheKeys.projectsData(user.id));
      }

      // Navigate back
      handleBack();
    } catch (error) {
      console.error("Failed to delete artifact:", error);
      toast.error("Failed to delete artifact");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [artifact, isCreator, user?.id, handleBack]);

  const { userLiked, userDisliked, handleLike, handleDislike } = useReactions({
    artifact,
    mutate,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && hasNext) {
        handleNext();
      } else if (e.key === "ArrowLeft" && hasPrevious) {
        handlePrevious();
      } else if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, handleNext, handlePrevious, handleBack]);

  // Set header content
  useSetHeader({
    left: (
      <Button
        variant="default"
        size="icon"
        onClick={handleBack}
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    ),
    right: (
      <>
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
            aria-label="Delete artifact"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="default"
          onClick={() => setIsSaveDialogOpen(true)}
          disabled={!user}
        >
          Save to Project
        </Button>
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ),
  }, [isCreator]);

  if (isLoading) {
    return null;
  }

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  return (
    <div className="flex flex-col items-center w-full p-6 h-[calc(100vh-var(--spacing-header-height)-var(--spacing-footer-height))]">
      <div className="h-full w-full flex flex-col md:flex-row gap-5">
        <ArtifactComponent
          artifact={artifact}
          className="h-full flex-1 flex md:justify-center items-center min-h-0 overflow-hidden"
        />
        <div className="flex flex-col gap-4 w-[var(--size-detail-sidebar-width)]">
          <h1 className="text-xlarge">{artifact.name}</h1>
          {artifact.description && (
            <p className="text-medium text-text-secondary capitalize">
              {artifact.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (artifact.creator?.id) {
                  router.push(`/user/?id=${artifact.creator.id}`);
                }
              }}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <UserAvatar
                id={artifact.creator?.id}
                email={artifact.creator?.email}
                name={artifact.creator?.name}
                imageUrl={artifact.creator?.slack_image_url}
                size="sm"
              />
              <p className="text-medium text-text-secondary capitalize">
                {artifact.creator?.name}
              </p>
            </button>
            <p
              className="text-medium text-text-secondary capitalize"
              style={{ color: "var(--color-disabled)" }}
            >
              {formatTimeAgo(artifact.created_at, { short: true })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLike}
              variant={userLiked ? "default" : "secondary"}
              className="w-[140px]"
            >
              <span>{artifact.reactions?.like?.length || 0}</span>
              <span className="text-xlarge">😍</span>{" "}
            </Button>
            <Button
              onClick={handleDislike}
              variant={userDisliked ? "default" : "secondary"}
              className="w-[140px]"
            >
              <span>{artifact.reactions?.dislike?.length || 0}</span>
              <span className="text-xlarge">🤔</span>{" "}
            </Button>
          </div>

          <div className="flex gap-2 flex-1 items-end">
            <Button
              variant="default"
              size="icon"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              aria-label="Previous"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleNext}
              disabled={!hasNext}
              aria-label="Next"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Save to Project Dialog */}
      {user && (
        <SaveToProjectDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          artifactId={artifactId}
          artifactName={artifact.name}
          userEmail={user.email}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Artifact"
        description={`Are you sure you want to delete "${artifact.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
