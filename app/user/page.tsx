"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import ArtifactFeed from "@/components/presentation/ArtifactFeed";
import { useUserArtifacts } from "@/hooks/useUserArtifacts";
import { Button } from "@/components/ui/button";
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("id") || "";
  const { user } = useAuth();

  const { artifacts, userInfo, isLoading, error } = useUserArtifacts(userId);

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar />,
    right: (
      <>
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ),
  });

  const displayName = userInfo?.name || userInfo?.email || userId;
  const isOwnProfile = user?.id === userId;

  if (!userId) {
    return (
      <div className="mx-auto p-6">
        <p className="text-text-secondary">No user ID provided</p>
      </div>
    );
  }

  return (
    <div>
      {/* User Profile Header */}
      <div className="border-b border-border bg-background px-6 py-6">
        <div className="mx-auto flex flex-col items-center gap-3">
          {userInfo?.slack_image_url && (
            <Image
              src={userInfo.slack_image_url}
              alt={displayName}
              width={64}
              height={64}
              className="h-24 w-24 rounded-full"
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-medium">{displayName}</h1>
            {userInfo?.title && (
              <p className="text-sm text-center text-text-secondary font-medium">
                {userInfo.title}
              </p>
            )}
            {userInfo?.slack_handle && (
              <Button asChild variant="secondary" size="sm" className="mt-2">
                <a
                  href={`https://shopify.slack.com/team/${userInfo.slack_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/slack-logo.svg"
                    alt="Slack"
                    width={20}
                    height={20}
                    className="w-4 h-4"
                  />
                  Slack
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Artifacts Feed */}
      <ArtifactFeed
        artifacts={artifacts}
        isLoading={isLoading}
        error={error}
        emptyMessage={
          isOwnProfile
            ? "You haven't created any public artifacts yet"
            : `${displayName} hasn't created any public artifacts yet`
        }
        userId={userId}
      />
    </div>
  );
}
