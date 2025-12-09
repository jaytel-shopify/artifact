"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import { updateArtifact } from "@/lib/quick-db";
import { toast } from "sonner";
import type { Artifact, ArtifactWithPosition } from "@/types";

interface PublishArtifactDialogProps {
  artifact: Artifact | ArtifactWithPosition | null;
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (artifact: Artifact) => void;
}

export default function PublishArtifactDialog({
  artifact,
  isOpen,
  onClose,
  onPublished,
}: PublishArtifactDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize form when artifact changes
  useEffect(() => {
    if (artifact) {
      setName(artifact.name || "");
      setDescription(artifact.description || "");
    }
  }, [artifact]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsPublishing(false);
    }
  }, [isOpen]);

  const handlePublish = async () => {
    if (!artifact || !name.trim()) return;

    setIsPublishing(true);
    try {
      const updatedArtifact = await updateArtifact(artifact.id, {
        name: name.trim(),
        description: description.trim(),
        published: true,
        published_at: new Date().toISOString(),
      });
      
      toast.success("Artifact published to feed!");
      onPublished?.(updatedArtifact);
      onClose();
    } catch (error) {
      console.error("Failed to publish artifact:", error);
      toast.error("Failed to publish artifact");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      onClose();
    }
  };

  if (!artifact) return null;

  const isVideo = artifact.type === "video";
  const isImage = artifact.type === "image";
  const isUrl = artifact.type === "url";
  const thumbnailUrl = (artifact.metadata as Record<string, unknown>)?.thumbnail_url as string | undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        showCloseButton={!isPublishing}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Publish to Feed
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {/* Media Preview */}
          <div className="relative flex items-center justify-center rounded-xl">
            <div className="size-40 flex items-center justify-center">
              {isVideo ? (
                thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={artifact.name}
                    className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                  />
                ) : (
                  <video
                    src={artifact.source_url}
                    className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                    muted
                    playsInline
                  />
                )
              ) : isImage ? (
                <img
                  src={artifact.source_url}
                  alt={artifact.name}
                  className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                />
              ) : isUrl && thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={artifact.name}
                  className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                />
              ) : (
                <div className="w-40 h-40 bg-secondary/20 rounded-button-inner shadow-lg rotate-3 flex items-center justify-center">
                  <Globe className="w-12 h-12 text-text-secondary" />
                </div>
              )}
            </div>
          </div>

          {/* Info text */}
          <div className="text-center">
            <p className="text-small text-text-secondary">
              Publishing will share this artifact to the public feed where other team members can see it.
            </p>
          </div>

          {/* Name input */}
          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this artifact"
              disabled={isPublishing}
            />
          </div>

          {/* Description input */}
          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={isPublishing}
              rows={3}
              className="w-full min-w-0 rounded-button border border-border bg-background p-3 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-small resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={handlePublish}
            disabled={isPublishing || !name.trim()}
            className="w-full"
          >
            {isPublishing ? "Publishing..." : "Publish to Feed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

