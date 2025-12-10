"use client";

import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { getUserByEmail } from "@/lib/quick-users";
import { ChevronDown } from "lucide-react";

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
  useMockData?: boolean;
}

// Generate 10 mock users for testing
const MOCK_USERS: User[] = [
  {
    socketId: "mock-1",
    name: "Alice Chen",
    email: "alice@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=1",
  },
  {
    socketId: "mock-2",
    name: "Bob Smith",
    email: "bob@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=2",
  },
  {
    socketId: "mock-3",
    name: "Carol White",
    email: "carol@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=3",
  },
  {
    socketId: "mock-4",
    name: "David Lee",
    email: "david@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=4",
  },
  {
    socketId: "mock-5",
    name: "Emma Davis",
    email: "emma@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    socketId: "mock-6",
    name: "Frank Miller",
    email: "frank@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=6",
  },
  {
    socketId: "mock-7",
    name: "Grace Kim",
    email: "grace@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=7",
  },
  {
    socketId: "mock-8",
    name: "Henry Park",
    email: "henry@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=8",
  },
  {
    socketId: "mock-9",
    name: "Ivy Zhang",
    email: "ivy@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=9",
  },
  {
    socketId: "mock-10",
    name: "Jack Brown",
    email: "jack@shopify.com",
    slackImageUrl: "https://i.pravatar.cc/150?img=10",
  },
];

// Fetch slack images for a list of emails
async function fetchSlackImages(emails: string[]) {
  const results = await Promise.all(emails.map((e) => getUserByEmail(e)));
  return Object.fromEntries(
    emails.map((e, i) => [e, results[i]?.slack_image_url])
  );
}

export default function SyncStatusIndicator({
  isPresenceReady,
  getUsers,
  onFollowUser,
  followingUserId,
  useMockData = false,
}: SyncStatusIndicatorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Update users list when triggered (or use mock data)
  useEffect(() => {
    if (useMockData) {
      setUsers(MOCK_USERS);
      return;
    }
    if (!isPresenceReady) {
      setUsers([]);
      return;
    }
    setUsers(getUsers());
  }, [isPresenceReady, getUsers, updateTrigger, useMockData]);

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
      {/* Viewer Avatars (only show when synced and there are other viewers, or mock mode) */}
      {(useMockData || isPresenceReady) && viewersCount >= 1 && (
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
          {/* Chevron dropdown button - only show when more than 5 viewers */}
          {viewersCount > 5 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="ml-1 p-1 rounded-full hover:bg-primary/20 transition-colors"
                title="View all viewers"
              >
                <ChevronDown
                  className={`w-4 h-4 text-text-primary transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-primary border border-border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-small text-text-secondary px-2 py-1 mb-1">
                      {viewersCount} viewer{viewersCount !== 1 ? "s" : ""}
                    </div>
                    {users.map((user) => {
                      const displayName = user.name || user.email || "Unknown";
                      const initial = displayName[0].toUpperCase();
                      const isFollowing = followingUserId === user.socketId;
                      const imageUrl =
                        user.slackImageUrl || slackImages?.[user.email];

                      return (
                        <button
                          key={user.socketId}
                          onClick={() => {
                            onFollowUser?.(user.socketId);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-primary-foreground/10 transition-colors ${
                            isFollowing ? "bg-destructive/10" : ""
                          }`}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={displayName}
                              width={32}
                              height={32}
                              className={`w-8 h-8 rounded-full object-cover border ${
                                isFollowing
                                  ? "border-destructive"
                                  : "border-border"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-small font-medium text-text-primary border ${
                                isFollowing
                                  ? "border-destructive"
                                  : "border-border"
                              }`}
                            >
                              {initial}
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <div className="text-small font-medium text-text-primary truncate">
                              {displayName}
                            </div>
                            {user.email && (
                              <div className="text-xs text-text-secondary truncate">
                                {user.email}
                              </div>
                            )}
                          </div>
                          {isFollowing && (
                            <span className="text-xs text-destructive font-medium">
                              Following
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
