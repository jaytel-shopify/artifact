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
      className={cn("animate-pulse rounded-md bg-secondary/50", className)}
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
      {/* Footer */}
      <div className="mt-auto p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      {/* Cover area - 3 column preview */}
      <div className="flex flex-1 w-[140%] p-2 pt-0 h-full overflow-hidden">
        <div className="flex-1 p-1">
          <Skeleton className="h-full rounded-card-inner" />
        </div>
        <div className="flex-1 p-1">
          <Skeleton className="h-full rounded-card-inner" />
        </div>
        <div className="flex-1 p-1">
          <Skeleton className="h-full rounded-card-inner" />
        </div>
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
        "rounded-card w-full relative grid h-fit overflow-hidden border border-border",
        className
      )}
      style={{ aspectRatio }}
    >
      {/* Thumbnail area */}
      <Skeleton className="col-span-1 col-start-1 row-span-2 row-start-1 w-full h-full rounded-none" />
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
    <div className="max-w-[1100px] mx-auto p-6 space-y-10">
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
      <div className="@container">
        <div className="grid grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)] @3xl:grid-cols-3 @10xl:grid-cols-4">
          {aspectRatios.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[inherit]">
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
