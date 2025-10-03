"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EditableArtifactTitleProps {
  title: string;
  artifactId: string;
  onUpdate: (newTitle: string) => Promise<void>;
  className?: string;
}

export default function EditableArtifactTitle({
  title,
  artifactId,
  onUpdate,
  className = "",
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  if (isEditing) {
    return (
      <div className={`text-center ${className}`}>
        <Input
          ref={inputRef}
          type="text"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isUpdating}
          placeholder="Untitled"
          className="h-6 text-xs text-center bg-transparent border-0 focus:bg-white focus:text-gray-800 focus:border-gray-300 px-1 py-0.5 min-w-0 w-full max-w-full"
          style={{ 
            fontSize: '14px',
            lineHeight: '1.2',
            minWidth: '60px',
            maxWidth: '440px'
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`text-center cursor-pointer hover:bg-white/5 rounded-md px-2 py-1 transition-colors duration-200 ${className}`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      <div 
        className="text-xs text-gray-400 truncate select-none"
        style={{ 
          fontSize: '14px',
          lineHeight: '1.2',
          maxWidth: '440px',
          margin: '0 auto'
        }}
      >
        {currentTitle || "Untitled"}
      </div>
    </div>
  );
}
