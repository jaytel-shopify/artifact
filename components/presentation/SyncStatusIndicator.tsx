"use client";

import { useEffect, useState } from "react";

interface User {
  socketId: string;
  name: string;
  email: string;
  slackImageUrl?: string;
  slackHandle?: string;
}

interface SyncStatusIndicatorProps {
  isSyncReady: boolean;
  getUsers: () => User[];
}

export default function SyncStatusIndicator({
  isSyncReady,
  getUsers,
}: SyncStatusIndicatorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Update users list when triggered (by WebSocket events, not polling)
  useEffect(() => {
    if (!isSyncReady) {
      setUsers([]);
      return;
    }

    setUsers(getUsers());
  }, [isSyncReady, getUsers, updateTrigger]);

  // Expose update function to parent via window event
  useEffect(() => {
    const handleUserChange = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    window.addEventListener("artifactSyncUserChange", handleUserChange);
    return () =>
      window.removeEventListener("artifactSyncUserChange", handleUserChange);
  }, []);

  const viewersCount = users.length;

  return (
    <div className="flex items-center gap-2">
      {/* Viewer Avatars (only show when synced and there are viewers) */}
      {isSyncReady && viewersCount > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-blue-500/10 border-blue-500/20 text-blue-600">
          <div className="flex items-center -space-x-2">
            {users.slice(0, 5).map((user, index) => (
              <div
                key={user.socketId}
                className="relative group"
                style={{ zIndex: 5 - index }}
                title={user.name || user.email}
              >
                {user.slackImageUrl ? (
                  <img
                    src={user.slackImageUrl}
                    alt={user.name || user.email}
                    className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-blue-500/20 hover:ring-blue-500/40 transition-all"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-blue-500/20 bg-blue-500 flex items-center justify-center text-[10px] font-semibold text-white">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {viewersCount > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-blue-500/20 bg-blue-600 flex items-center justify-center text-[10px] font-semibold text-white">
                +{viewersCount - 5}
              </div>
            )}
          </div>
          <span className="ml-1 whitespace-nowrap">
            {viewersCount} {viewersCount === 1 ? "viewer" : "viewers"}
          </span>
        </div>
      )}
    </div>
  );
}
