import { cn } from "@/lib/utils";

/**
 * Base Skeleton primitive
 * Renders an animated pulse placeholder
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/10", className)}
      {...props}
    />
  );
}

/**
 * ProjectCardSkeleton
 * Matches ProjectCard layout: 300/250 aspect ratio with cover area and footer
 */
function ProjectCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary rounded-card border-border flex flex-col gap-0 overflow-hidden border aspect-[300/250]",
        className
      )}
    >
      {/* Cover area - 3 column preview */}
      <div className="flex flex-1 w-full p-2 pt-4 gap-2">
        <Skeleton className="flex-1 rounded-card-inner" />
        <Skeleton className="flex-1 rounded-card-inner" />
        <Skeleton className="flex-1 rounded-card-inner" />
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

/**
 * FolderCardSkeleton
 * Matches FolderCard layout: simple card with title and count
 */
function FolderCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary rounded-card border-border border p-4 space-y-2",
        className
      )}
    >
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

/**
 * FeedCardSkeleton
 * Matches FeedCard for masonry grid - variable aspect ratios
 */
function FeedCardSkeleton({
  className,
  aspectRatio = "4/3",
}: {
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div
      className={cn(
        "bg-primary rounded-card border-border border overflow-hidden",
        className
      )}
      style={{ aspectRatio }}
    >
      <Skeleton className="w-full h-full rounded-none" />
    </div>
  );
}

/**
 * ArtifactCardSkeleton
 * For published artifacts grid - square aspect ratio
 */
function ArtifactCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary rounded-card border-border border overflow-hidden aspect-square",
        className
      )}
    >
      <Skeleton className="w-full h-full rounded-none" />
    </div>
  );
}

/**
 * ProjectsPageSkeleton
 * Full page skeleton for /projects with folders and projects sections
 */
function ProjectsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Folders Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <FolderCardSkeleton key={`folder-${i}`} />
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={`project-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * FolderPageSkeleton
 * Full page skeleton for /folder view
 */
function FolderPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * HomeFeedSkeleton
 * Masonry grid skeleton for home page feed
 */
function HomeFeedSkeleton() {
  // Create varied aspect ratios for realistic masonry look
  const aspectRatios = [
    ["4/3", "3/4", "1/1", "4/5"],
    ["3/4", "4/3", "4/5", "1/1"],
    ["1/1", "4/5", "4/3", "3/4"],
    ["4/5", "1/1", "3/4", "4/3"],
  ];

  return (
    <div className="mx-auto p-6">
      <div className="grid grid-cols-4 gap-2 lg:gap-6">
        {aspectRatios.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 lg:gap-6">
            {column.map((ratio, rowIndex) => (
              <FeedCardSkeleton
                key={`${colIndex}-${rowIndex}`}
                aspectRatio={ratio}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CanvasSkeleton
 * Skeleton for the presentation canvas on /p page
 */
function CanvasSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex gap-4 w-full max-w-6xl px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="w-full aspect-[3/4] rounded-card" />
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  ProjectCardSkeleton,
  FolderCardSkeleton,
  FeedCardSkeleton,
  ArtifactCardSkeleton,
  ProjectsPageSkeleton,
  FolderPageSkeleton,
  HomeFeedSkeleton,
  CanvasSkeleton,
};
