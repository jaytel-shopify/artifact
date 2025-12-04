"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { getUserByEmail } from "@/lib/quick-users";

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

// Fetch slack images for a list of emails
async function fetchSlackImages(emails: string[]) {
  const results = await Promise.all(emails.map((e) => getUserByEmail(e)));
  return Object.fromEntries(emails.map((e, i) => [e, results[i]?.slack_image_url]));
}

export default function SyncStatusIndicator({
  isPresenceReady,
  getUsers,
  onFollowUser,
  followingUserId,
}: SyncStatusIndicatorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Update users list when triggered
  useEffect(() => {
    if (!isPresenceReady) {
      setUsers([]);
      return;
    }
    setUsers(getUsers());
  }, [isPresenceReady, getUsers, updateTrigger]);

  // Fetch slack images from database (SWR handles caching)
  const emails = users.map((u) => u.email);
  const { data: slackImages } = useSWR(
    emails.length > 0 ? ["slack-images", ...emails] : null,
    () => fetchSlackImages(emails)
  );

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
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-medium border bg-primary/10 border-primary/20 text-text-primary">
          <div className="flex items-center -space-x-2">
            {users.slice(0, 5).map((user, index) => {
              const displayName = user.name || user.email || "Unknown";
              const initial = displayName[0].toUpperCase();
              const isFollowing = followingUserId === user.socketId;
              const imageUrl = user.slackImageUrl || slackImages?.[user.email];

              return (
                <div
                  key={user.socketId}
                  className="relative group cursor-pointer"
                  style={{ zIndex: 5 - index }}
                  onClick={() => onFollowUser?.(user.socketId)}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={displayName}
                      title={displayName}
                      width={36}
                      height={36}
                      className={`w-9 h-9 flex-shrink-0 rounded-full border border-border transition-all cursor-pointer object-cover ${
                        isFollowing
                          ? "border-primary-foreground ring-2 ring-destructive"
                          : "border-primary-foreground ring-1 ring-primary/20 hover:ring-2 hover:ring-primary/40"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 flex-shrink-0 rounded-full border bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-medium font-medium text-text-primary transition-all cursor-pointer ${
                        isFollowing
                          ? "border-primary-foreground ring-2 ring-destructive"
                          : "border-primary-foreground ring-1 ring-primary/20 hover:ring-2 hover:ring-primary/40"
                      }`}
                      title={displayName}
                    >
                      {initial}
                    </div>
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-primary text-text-primary text-small rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {displayName}
                  </div>
                </div>
              );
            })}
            {viewersCount > 5 && (
              <div
                className="w-9 h-9 rounded-full border border-border ring-1 ring-primary/20 bg-primary flex items-center justify-center text-small text-text-primary"
                title={`${viewersCount - 5} more viewer${viewersCount - 5 === 1 ? "" : "s"}`}
              >
                +{viewersCount - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
