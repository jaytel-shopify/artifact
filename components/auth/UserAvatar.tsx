"use client";

import { memo } from "react";
import { useAuth } from "./AuthProvider";

interface UserAvatarProps {
  email?: string;
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * UserAvatar component that can work in two modes:
 * 1. With props - show specific user's avatar
 * 2. Without props - show current authenticated user's avatar
 */
export function UserAvatar({ email, name, imageUrl, size = "md" }: UserAvatarProps) {
  const { user: currentUser, loading } = useAuth();

  // Use provided props or fallback to current user
  const user = email || name || imageUrl ? { email, fullName: name, slackImageUrl: imageUrl } : currentUser;

  const sizeClasses = {
    sm: "w-6 h-6 min-w-6 text-xs",
    md: "w-8 h-8 min-w-8 text-sm",
    lg: "w-10 h-10 min-w-10 text-base",
  };

  const sizeClass = sizeClasses[size];

  if (loading && !email) {
    return (
      <div className={`${sizeClass} flex-shrink-0 rounded-full bg-gray-300 animate-pulse flex items-center justify-center font-medium`}>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${sizeClass} flex-shrink-0 rounded-full bg-gray-300 flex items-center justify-center font-medium`}>
        ?
      </div>
    );
  }

  const displayName = user.fullName || user.email || name || email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  // Use provided image or Slack image if available
  const avatarImage = imageUrl || user.slackImageUrl;
  
  if (avatarImage) {
    return (
      <img
        src={avatarImage}
        alt={displayName}
        className={`${sizeClass} flex-shrink-0 rounded-full`}
        title={displayName}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium`}
      title={displayName}
    >
      {initials}
    </div>
  );
}

// Also export as default for backward compatibility
export default memo(UserAvatar);
