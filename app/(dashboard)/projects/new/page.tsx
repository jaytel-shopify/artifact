"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...(creatorId ? { creator_id: creatorId } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create project");
      router.push(`/presentation/${json.project.share_token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Project</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Project name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2"
            placeholder="My Presentation"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Creator ID (optional)</label>
          <input
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2"
            placeholder="user-123"
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          className="inline-flex items-center px-3 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Create"}
        </button>
      </form>
    </main>
  );
}


