"use client";

import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import Link from "@/components/ui/TransitionLink";
import { useReactions } from "@/hooks/useReactions";
import { ArtifactWithCreator } from "@/hooks/usePublicArtifacts";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { useState } from "react";

interface FeedCardProps {
  artifact: ArtifactWithCreator;
  tabIndex?: number;
  /** Pass userId to enable navigation within a user's artifacts */
  userId?: string;
}

export default function FeedCard({
  artifact,
  tabIndex,
  userId,
}: FeedCardProps) {
  const { userLiked, userDisliked, handleLike, handleDislike, canReact } =
    useReactions({ artifact });

  const [activeViewTransition, setActiveViewTransition] = useState(false);

  return (
    <div className="rounded-card w-full relative grid h-fit cursor-pointer overflow-hidden border border-border group">
      <Link
        href={`/a/?id=${artifact.id}${userId ? `&userId=${userId}` : ""}`}
        className="col-span-1 col-start-1 row-span-2 row-start-1 w-full hover:opacity-100"
        tabIndex={tabIndex}
        onClick={(e) => {
          // setActiveViewTransition(true);
        }}
      >
        <ArtifactThumbnail
          artifact={artifact}
          className="w-full"
          activeViewTransition={activeViewTransition}
        />
      </Link>

      <div className="relative z-1 col-span-1 col-start-1 row-start-2 p-2 opacity-1 group-hover:opacity-100 transition-opacity duration-300 md:p-4 flex justify-between items-center">
        <Link
          href={`/user/?id=${artifact.creator?.id}`}
          className="pl-2 pr-3 h-8 flex items-center justify-center rounded-button bg-dark/35 backdrop-blur-md gap-2 hover:bg-dark transition-colors"
        >
          <UserAvatar
            id={artifact.creator?.id}
            email={artifact.creator?.email}
            name={artifact.creator?.name}
            imageUrl={artifact.creator?.slack_image_url}
            size="sm"
          />
          <h3 className="text-small text-light line-clamp-1 overflow-ellipsis">
            {artifact.creator?.name}
          </h3>
        </Link>
        <div className="relative z-10 flex gap-2">
          <button
            onClick={handleLike}
            disabled={!canReact}
            className={`flex items-center gap-1 text-small px-3 h-8 rounded-button text-light transition-colors ${
              userLiked
                ? "bg-dark"
                : "bg-dark/35 backdrop-blur-md hover:bg-dark"
            } ${!canReact ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="tabular-nums">
              {artifact.reactions?.like?.length || 0}
            </span>
            <span className="text-lg leading-none">😍</span>
          </button>
          <button
            onClick={handleDislike}
            disabled={!canReact}
            className={`flex items-center gap-1 text-small px-3 h-8 rounded-button text-light transition-colors ${
              userDisliked
                ? "bg-dark"
                : "bg-dark/35 backdrop-blur-md hover:bg-dark"
            } ${!canReact ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="tabular-nums">
              {artifact.reactions?.dislike?.length || 0}
            </span>
            <span className="text-lg leading-none">🤔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
