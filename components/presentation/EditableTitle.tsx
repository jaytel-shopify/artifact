"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

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
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => save(value)}
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
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left text-white font-semibold text-base flex items-center gap-2 group focus:outline-none cursor-pointer"
        >
          <span className="group-hover:text-white/80 transition-colors">{value || "Untitled Project"}</span>
          <span className="text-xs px-2 py-1 rounded-full border border-white/20 text-white/70 transition-opacity duration-150 opacity-0 group-hover:opacity-100 group-hover:bg-white/10">Edit</span>
        </button>
      )}
      {saving && <span className="text-xs text-white/60">Saving…</span>}
    </div>
  );
}

