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
  isPresenceReady: boolean;
  getUsers: () => User[];
  onFollowUser?: (socketId: string) => void;
  followingUserId?: string | null;
}

export default function SyncStatusIndicator({
  isPresenceReady,
  getUsers,
  onFollowUser,
  followingUserId,
}: SyncStatusIndicatorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Update users list when triggered (by WebSocket events, not polling)
  useEffect(() => {
    if (!isPresenceReady) {
      setUsers([]);
      return;
    }

    const usersList = getUsers();

    // Count by socket ID (each connection counts as a separate viewer)
    setUsers(usersList);
  }, [isPresenceReady, getUsers, updateTrigger]);

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
      {/* Viewer Avatars (only show when synced and there are other viewers) */}
      {isPresenceReady && viewersCount >= 1 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-blue-500/10 border-blue-500/20 text-blue-600">
          <div className="flex items-center -space-x-2">
            {users.slice(0, 5).map((user, index) => {
              const displayName = user.name || user.email || "Unknown";
              const initial = displayName[0].toUpperCase();
              const isFollowing = followingUserId === user.socketId;

              return (
                <div
                  key={user.socketId}
                  className="relative group"
                  style={{ zIndex: 5 - index }}
                  onClick={() => onFollowUser?.(user.socketId)}
                >
                  {user.slackImageUrl ? (
                    <img
                      src={user.slackImageUrl}
                      alt={displayName}
                      title={displayName}
                      width={24}
                      height={24}
                      className={`w-6 h-6 min-w-[24px] min-h-[24px] flex-shrink-0 rounded-full border-2 transition-all cursor-pointer object-cover ${
                        isFollowing
                          ? "border-white ring-2 ring-red-500"
                          : "border-white ring-1 ring-blue-500/20 hover:ring-2 hover:ring-blue-500/40"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 min-w-[24px] min-h-[24px] flex-shrink-0 rounded-full border-2 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-semibold text-white transition-all cursor-pointer ${
                        isFollowing
                          ? "border-white ring-2 ring-red-500"
                          : "border-white ring-1 ring-blue-500/20 hover:ring-2 hover:ring-blue-500/40"
                      }`}
                      title={displayName}
                    >
                      {initial}
                    </div>
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {displayName}
                  </div>
                </div>
              );
            })}
            {viewersCount > 5 && (
              <div
                className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-[10px] font-semibold text-white"
                title={`${viewersCount - 5} more viewer${viewersCount - 5 === 1 ? "" : "s"}`}
              >
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
