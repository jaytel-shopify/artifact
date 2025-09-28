"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function EditableTitle({
  initialValue,
  projectId,
}: {
  initialValue: string;
  projectId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function save(next: string) {
    if (!projectId || !next.trim()) {
      setValue(initialValue);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
    } catch (err) {
      console.error(err);
      setValue(initialValue);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save(value);
              }
              if (e.key === "Escape") {
                setValue(initialValue);
                setEditing(false);
              }
            }}
            className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/40 focus:ring-white/30 min-w-[200px]"
            disabled={saving}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => save(value)}
            disabled={saving}
            className="h-8 w-8 text-white hover:bg-white/10"
            aria-label="Save project name"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left text-white font-semibold text-base px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <span>{value || "Untitled Project"}</span>
        </button>
      )}
      {saving && <span className="text-xs text-white/60 ml-2">Saving…</span>}
    </div>
  );
}

