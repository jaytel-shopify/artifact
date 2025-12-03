"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserAvatar } from "@/components/auth/UserAvatar";

/**
 * User avatar for the header that links to the user's profile.
 * Shows nothing if user is not logged in.
 */
export default function HeaderUserAvatar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href={`/user/?id=${user.id}`} prefetch={false}>
      <UserAvatar size="lg" />
    </Link>
  );
}
