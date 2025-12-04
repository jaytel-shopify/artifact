"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SquareArrowOutUpRight,
  Globe,
  Image as ImageIcon,
  Video,
  FileText,
  Figma,
  Type,
} from "lucide-react";
import { toast } from "sonner";

// Get icon based on artifact type
function getArtifactIcon(
  artifactType?: string,
  className: string = "h-3.5 w-3.5 flex-shrink-0"
) {
  switch (artifactType) {
    case "url":
      return <Globe className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Video className={className} />;
    case "pdf":
      return <FileText className={className} />;
    case "figma":
      return <Figma className={className} />;
    case "titleCard":
      return <Type className={className} />;
    default:
      return <FileText className={className} />;
  }
}

interface EditableArtifactTitleProps {
  title: string;
  artifactId: string;
  onUpdate?: (newTitle: string) => Promise<void>;
  className?: string;
  artifactType?: string;
  sourceUrl?: string;
  readOnly?: boolean;
}

export default function EditableArtifactTitle({
  title,
  artifactId,
  onUpdate,
  className = "",
  artifactType,
  sourceUrl,
  readOnly = false,
}: EditableArtifactTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local title when prop changes
  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    if (!readOnly && onUpdate) {
      setIsEditing(true);
    }
  }, [readOnly, onUpdate]);

  const handleSave = useCallback(async () => {
    if (!onUpdate || currentTitle.trim() === title.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(currentTitle.trim() || "Untitled");
      setIsEditing(false);
      if (currentTitle.trim() !== title.trim()) {
        toast.success("Artifact title updated");
      }
    } catch (error) {
      toast.error("Failed to update title. Please try again.");
      console.error("Failed to update artifact title:", error);
      // Revert to original title on error
      setCurrentTitle(title);
    } finally {
      setIsUpdating(false);
    }
  }, [currentTitle, title, onUpdate]);

  const handleCancel = useCallback(() => {
    setCurrentTitle(title);
    setIsEditing(false);
  }, [title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const isUrlArtifact = artifactType === "url";

  if (isEditing) {
    return (
      <div className={`flex items-center gap-0 ${className}`}>
        {isUrlArtifact && sourceUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="external-link-button h-6 w-6 p-0 flex-shrink-0 text-text-secondary hover:text-text-primary hover:bg-primary"
            onClick={(e) => {
              e.stopPropagation();
              window.open(sourceUrl, "_blank", "noopener,noreferrer");
            }}
            aria-label="Open in new tab"
          >
            <SquareArrowOutUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
        <Input
          ref={inputRef}
          type="text"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isUpdating}
          placeholder="Untitled"
          className="h-6 text-small bg-transparent text-text-primary border border-[#3E8AE2] focus:border-[#3E8AE2] focus:bg-transparent px-2 py-1 min-w-0 w-full max-w-full"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {/* Left: External link for URL artifacts */}
      {isUrlArtifact && sourceUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="external-link-button h-6 w-6 p-0 flex-shrink-0 text-text-secondary hover:text-text-primary hover:bg-primary"
          onClick={(e) => {
            e.stopPropagation();
            window.open(sourceUrl, "_blank", "noopener,noreferrer");
          }}
          aria-label="Open in new tab"
        >
          <SquareArrowOutUpRight className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Center: Title */}
      <div
        className={`${
          readOnly
            ? "px-2 py-1"
            : "cursor-text hover:bg-primary border border-transparent rounded-md px-2 py-1 transition-colors duration-200"
        } flex-1 min-w-0`}
        onClick={handleClick}
        title={readOnly ? undefined : "Click to edit"}
      >
        <div className="text-small text-text-secondary truncate select-none">
          {currentTitle || "Untitled"}
        </div>
      </div>
    </div>
  );
}
