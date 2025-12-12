"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Page } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageNavigationSidebarProps {
  isOpen: boolean;
  pages: Page[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageRename?: (pageId: string, newName: string) => Promise<void>;
  onPageCreate?: () => void;
  onPageDelete?: (pageId: string) => void;
  onPageReorder?: (reorderedPages: Page[]) => void;
  isReadOnly?: boolean;
}

interface SortablePageItemProps {
  page: Page;
  isActive: boolean;
  isEditing: boolean;
  isRenaming: boolean;
  isReadOnly: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onEditSave: (newName: string) => void;
  onEditCancel: () => void;
}

function SortablePageItem({
  page,
  isActive,
  isEditing,
  isRenaming,
  isReadOnly,
  onSelect,
  onRename,
  onDelete,
  onEditSave,
  onEditCancel,
}: SortablePageItemProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled: isReadOnly || isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: `${transition}, background-color 100ms ease`,
    opacity: isDragging ? 0.5 : 1,
  };

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && spanRef.current) {
      spanRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(spanRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (spanRef.current) {
      const newName = spanRef.current.textContent?.trim() || "";
      onEditSave(newName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      // Reset content to original
      if (spanRef.current) {
        spanRef.current.textContent = page.name;
      }
      onEditCancel();
    }
  };

  if (isReadOnly) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center p-3 rounded-button cursor-pointer transition-all ${
          isActive
            ? "bg-primary"
            : "hover:bg-primary opacity-50 hover:opacity-100"
        }`}
        onClick={onSelect}
      >
        <span className="text-text-primary text-small flex-1">{page.name}</span>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...(isEditing ? {} : { ...attributes, ...listeners })}
          className={`border border-transparent flex items-center py-2 px-3 rounded-button transition-colors group ${
            isEditing
              ? "border-secondary"
              : isActive
                ? "bg-primary border-border! cursor-grab active:cursor-grabbing"
                : "hover:bg-primary/70 cursor-grab active:cursor-grabbing"
          }`}
          onClick={isEditing ? undefined : onSelect}
        >
          <span
            ref={spanRef}
            className="text-text-primary text-small flex-1 outline-none"
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={() => isEditing && !isRenaming && handleSave()}
            onKeyDown={isEditing ? handleKeyDown : undefined}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            {page.name}
          </span>
          <Pencil
            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={onRename}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename} className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function PageNavigationSidebar({
  pages,
  currentPageId,
  onPageSelect,
  onPageRename,
  onPageCreate,
  onPageDelete,
  onPageReorder,
  isReadOnly = false,
}: PageNavigationSidebarProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts, allowing clicks to work
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePageRename = (page: Page) => {
    setEditingPageId(page.id);
  };

  const handleNameSave = async (pageId: string, newName: string) => {
    if (!newName.trim() || !onPageRename) {
      setEditingPageId(null);
      return;
    }

    setIsRenaming(true);
    try {
      await onPageRename(pageId, newName.trim());
      setEditingPageId(null);
      toast.success("Page renamed successfully");
    } catch (error) {
      toast.error("Failed to rename page. Please try again.");
      console.error("Failed to rename page:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleNameCancel = () => {
    setEditingPageId(null);
  };

  const handleDeletePage = (pageId: string) => {
    // Don't allow deleting the last page
    if (pages.length <= 1) {
      toast.error("Cannot delete the last page");
      return;
    }

    onPageDelete?.(pageId);
    toast.success("Page deleted successfully");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);

      const reorderedPages = arrayMove(pages, oldIndex, newIndex);
      onPageReorder?.(reorderedPages);
    }
  };

  return (
    <aside
      className="bg-background h-full flex-shrink-0 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-[1px] after:h-[200%] after:bg-text-primary/10"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex flex-col h-full p-4">
        {/* Pages List */}
        <div className="flex flex-col gap-1 flex-1 space-y-0 overflow-y-auto">
          {pages.length === 0 ? (
            <div className="text-text-secondary text-center py-4 text-small">
              No pages yet
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {pages.map((page) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    isActive={currentPageId === page.id}
                    isEditing={editingPageId === page.id}
                    isRenaming={isRenaming}
                    isReadOnly={isReadOnly}
                    onSelect={() => onPageSelect?.(page.id)}
                    onRename={() => handlePageRename(page)}
                    onDelete={() => handleDeletePage(page.id)}
                    onEditSave={(newName) => handleNameSave(page.id, newName)}
                    onEditCancel={handleNameCancel}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Add New Page Button (hidden in read-only mode) */}
        {!isReadOnly && onPageCreate && (
          <Button variant="primary-wide" onClick={onPageCreate}>
            <Plus className="h-4 w-4" />
            <span>New page</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
