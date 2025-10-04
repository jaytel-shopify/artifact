"use client";

import { Eye } from "lucide-react";

/**
 * ReadOnlyBadge
 * 
 * Compact badge displayed in the header when viewing someone else's project.
 * Matches the size and style of other header buttons.
 */
export default function ReadOnlyBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-600">
      <Eye className="h-4 w-4" />
      <span className="text-sm font-medium">View only</span>
    </div>
  );
}

