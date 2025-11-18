import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Artifact } from "@/types";

interface TitleCardState {
  artifactId: string;
  headline: string;
  subheadline: string;
}

/**
 * Hook to manage title card editing
 */
export function useTitleCardEditor(
  artifacts: Artifact[],
  updateArtifact: (id: string, updates: any) => Promise<any>
) {
  const [editingTitleCard, setEditingTitleCard] =
    useState<TitleCardState | null>(null);
  const [titleCardError, setTitleCardError] = useState("");

  const handleEditTitleCard = useCallback(
    (artifactId: string) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (!artifact) return;

      const metadata = artifact.content as
        | { headline?: string; subheadline?: string }
        | undefined;

      setEditingTitleCard({
        artifactId,
        headline: metadata?.headline || "",
        subheadline: metadata?.subheadline || "",
      });
      setTitleCardError("");
    },
    [artifacts]
  );

  const handleTitleCardSubmit = useCallback(async () => {
    if (!editingTitleCard) return;

    const { headline, subheadline, artifactId } = editingTitleCard;

    if (!headline && !subheadline) {
      setTitleCardError("Please enter at least a headline or subheadline");
      return;
    }

    try {
      await updateArtifact(artifactId, {
        name: headline || "Title Card",
        metadata: {
          headline,
          subheadline,
        },
      });

      toast.success("Title card updated");
      setEditingTitleCard(null);
      setTitleCardError("");
    } catch (err) {
      toast.error("Failed to update title card. Please try again.");
      console.error(err);
    }
  }, [editingTitleCard, updateArtifact]);

  return {
    editingTitleCard,
    setEditingTitleCard,
    titleCardError,
    setTitleCardError,
    handleEditTitleCard,
    handleTitleCardSubmit,
  };
}
