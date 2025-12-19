import React from "react";
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Upload,
  Edit,
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import type { Page } from "@/types";

interface CarouselItemContextMenuProps {
  children: React.ReactNode;
  contentType: "image" | "video" | "url" | "titleCard" | "pdf" | "figma";
  metadata?: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  onUpdateMetadata?: (updates: {
    hideUI?: boolean;
    loop?: boolean;
    muted?: boolean;
  }) => Promise<void>;
  onReplaceMedia?: (file: File) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => Promise<void>;
  onMoveToPage?: (pageId: string) => Promise<void>;
  pages?: Page[];
  currentPageId?: string;
  isReadOnly?: boolean;
}

export function CarouselItemContextMenu({
  children,
  contentType,
  metadata,
  onUpdateMetadata,
  onReplaceMedia,
  onEdit,
  onDelete,
  onPublish,
  onMoveToPage,
  pages,
  currentPageId,
  isReadOnly = false,
}: CarouselItemContextMenuProps) {
  const isVideo = contentType === "video";
  const isTitleCard = contentType === "titleCard";

  // Filter out the current page from the move options
  const availablePages = pages?.filter((p) => p.id !== currentPageId) || [];
  const canMoveToPage = onMoveToPage && availablePages.length > 0;

  // If read-only or no handlers, just return children without context menu
  if (
    isReadOnly ||
    (!onDelete && !onUpdateMetadata && !onReplaceMedia && !onEdit && !onPublish && !canMoveToPage)
  ) {
    return <>{children}</>;
  }

  const handleReplaceMedia = () => {
    if (!onReplaceMedia) return;

    const input = document.createElement("input");
    input.type = "file";

    if (isVideo) {
      input.accept = ".mp4,.mov,.webm,video/*";
    } else {
      input.accept = ".jpg,.jpeg,.png,.gif,.webp,image/*";
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await onReplaceMedia(file);
        } catch (error) {
          console.error("Failed to replace media:", error);
        }
      }
    };

    input.click();
  };

  const toggleVideoUI = async () => {
    if (!onUpdateMetadata) return;
    try {
      await onUpdateMetadata({ hideUI: !metadata?.hideUI });
      toast.success(
        metadata?.hideUI ? "Video controls enabled" : "Video controls hidden"
      );
    } catch {
      toast.error("Failed to update video settings");
    }
  };

  const toggleVideoLoop = async () => {
    if (!onUpdateMetadata) return;
    try {
      await onUpdateMetadata({ loop: !metadata?.loop });
      toast.success(
        metadata?.loop ? "Video loop disabled" : "Video loop enabled"
      );
    } catch {
      toast.error("Failed to update video settings");
    }
  };

  const toggleVideoMute = async () => {
    if (!onUpdateMetadata) return;
    const currentMuted = metadata?.muted !== false;
    try {
      await onUpdateMetadata({ muted: !currentMuted });
      toast.success(currentMuted ? "Video unmuted" : "Video muted");
    } catch {
      toast.error("Failed to update video settings");
    }
  };

  const showDivider = (condition: boolean) => {
    return condition ? (
      <ContextMenuItem disabled className="h-px bg-border p-0 m-1" />
    ) : null;
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {/* Title Card Edit Option */}
        {isTitleCard && onEdit && (
          <>
            <ContextMenuItem
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </ContextMenuItem>
            {showDivider(true)}
          </>
        )}

        {/* Video Controls */}
        {isVideo && onUpdateMetadata && (
          <>
            <ContextMenuItem
              onClick={toggleVideoUI}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {!metadata?.hideUI ? <Check className="w-3 h-3" /> : null}
              </div>
              {!metadata?.hideUI ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              Show Controls
            </ContextMenuItem>

            <ContextMenuItem
              onClick={toggleVideoLoop}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {metadata?.loop ? <Check className="w-3 h-3" /> : null}
              </div>
              <RotateCcw className="w-4 h-4" />
              Loop Video
            </ContextMenuItem>

            <ContextMenuItem
              onClick={toggleVideoMute}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {metadata?.muted === false ? (
                  <Check className="w-3 h-3" />
                ) : null}
              </div>
              {metadata?.muted !== false ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              Audio On
            </ContextMenuItem>

            {showDivider(true)}
          </>
        )}

        {/* Replace Media */}
        {onReplaceMedia && !isTitleCard && (
          <ContextMenuItem
            onClick={handleReplaceMedia}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Replace Media
          </ContextMenuItem>
        )}

        {/* Publish Option */}
        {onPublish && (
          <ContextMenuItem
            onClick={onPublish}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Publish
          </ContextMenuItem>
        )}

        {/* Move to Page Submenu */}
        {canMoveToPage && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Move to Page
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {availablePages.map((page) => (
                <ContextMenuItem
                  key={page.id}
                  onClick={async () => {
                    try {
                      await onMoveToPage(page.id);
                      toast.success(`Moved to "${page.name}"`);
                    } catch {
                      toast.error("Failed to move artifact");
                    }
                  }}
                >
                  {page.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Divider before delete */}
        {showDivider(
          !!(
            ((onReplaceMedia && !isTitleCard) ||
              (isTitleCard && onEdit) ||
              onPublish ||
              canMoveToPage) &&
            onDelete
          )
        )}

        {/* Delete Option */}
        {onDelete && (
          <ContextMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
