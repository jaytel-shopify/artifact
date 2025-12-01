"use client";

import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import Link from "next/link";
import { useReactions } from "@/hooks/useReactions";
import { ArtifactWithCreator } from "@/hooks/usePublicArtifacts";
import { UserAvatar } from "@/components/auth/UserAvatar";

interface FeedCardProps {
  artifact: ArtifactWithCreator;
  tabIndex?: number;
}

export default function FeedCard({ artifact, tabIndex }: FeedCardProps) {
  const { userLiked, userDisliked, handleLike, handleDislike, canReact } =
    useReactions({ artifact });

  return (
    <div className="rounded-card w-full relative grid h-fit cursor-pointer overflow-hidden border border-border">
      <ArtifactThumbnail
        artifact={artifact}
        className="col-span-1 col-start-1 row-span-2 row-start-1 w-full rounded-card"
      />

      <div className="col-span-1 col-start-1 row-start-2 p-2 opacity-0 transition-opacity duration-300 hover:opacity-100 md:p-4 flex justify-between items-center">
        <Link
          href={`/a/?id=${artifact.id}`}
          className="after:absolute after:inset-0 after:content-['']"
          tabIndex={tabIndex}
        >
          <span className="pl-2 pr-3 h-8 flex items-center justify-center rounded-button bg-primary/80 backdrop-blur-md gap-2">
            <UserAvatar
              id={artifact.creator?.id}
              email={artifact.creator?.email}
              name={artifact.creator?.name}
              imageUrl={artifact.creator?.slack_image_url}
              size="sm"
            />
            <h3 className="text-small text-text-primary line-clamp-1 overflow-ellipsis">
              {artifact.creator?.name}
            </h3>
          </span>
        </Link>
        <div className="relative z-10 flex gap-2">
          <button
            onClick={handleLike}
            disabled={!canReact}
            className={`flex items-center gap-1 text-small px-3 h-8 rounded-button text-text-primary transition-colors ${
              userLiked
                ? "bg-primary"
                : "bg-primary/80 backdrop-blur-md hover:bg-primary"
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
            className={`flex items-center gap-1 text-small px-3 h-8 rounded-button text-text-primary transition-colors ${
              userDisliked
                ? "bg-primary"
                : "bg-primary/80 backdrop-blur-md hover:bg-primary"
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
