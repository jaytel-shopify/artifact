"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import { toast } from "sonner";

interface EditableArtifactTitleProps {
  title: string;
  artifactId: string;
  onUpdate: (newTitle: string) => Promise<void>;
  className?: string;
  artifactType?: string;
  sourceUrl?: string;
}

export default function EditableArtifactTitle({
  title,
  artifactId,
  onUpdate,
  className = "",
  artifactType,
  sourceUrl,
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

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (currentTitle.trim() === title.trim()) {
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
      <div className={className}>
        <Input
          ref={inputRef}
          type="text"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isUpdating}
          placeholder="Untitled"
          className="h-6 text-xs bg-white/10 text-white border border-white/20 focus:border-white/40 focus:bg-white/20 px-2 py-1 min-w-0 w-full max-w-full"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Center: Title */}
      <div
        className="cursor-pointer hover:bg-white/5 rounded-md px-2 py-1 transition-colors duration-200 flex-1 min-w-0"
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit"
      >
        <div className="text-xs text-gray-400 truncate select-none">
          {currentTitle || "Untitled"}
        </div>
      </div>

      {/* Right: External link for URL artifacts */}
      {isUrlArtifact && sourceUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0 text-gray-500 hover:text-gray-300 hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            window.open(sourceUrl, "_blank", "noopener,noreferrer");
          }}
          aria-label="Open in new tab"
        >
          <SquareArrowOutUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
