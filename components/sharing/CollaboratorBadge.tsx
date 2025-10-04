"use client";

import { Users } from "lucide-react";

interface CollaboratorBadgeProps {
  creatorEmail: string;
}

/**
 * CollaboratorBadge
 * 
 * Compact badge displayed in the header for invited collaborators (not creators).
 * Shows that the user has edit permissions on someone else's project.
 */
export default function CollaboratorBadge({ creatorEmail }: CollaboratorBadgeProps) {
  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-green-500/30 bg-green-500/10 text-green-600"
      title={`You can edit this project (owned by ${creatorEmail})`}
    >
      <Users className="h-4 w-4" />
      <span className="text-sm font-medium">Collaborator</span>
    </div>
  );
}

