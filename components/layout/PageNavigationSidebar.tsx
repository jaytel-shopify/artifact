"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
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
  editingName: string;
  isRenaming: boolean;
  isReadOnly: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

function SortablePageItem({
  page,
  isActive,
  isEditing,
  editingName,
  isRenaming,
  isReadOnly,
  onSelect,
  onRename,
  onDelete,
  onEditNameChange,
  onEditSave,
  onEditCancel,
}: SortablePageItemProps) {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center p-[var(--spacing-sm)] rounded-[var(--radius-md)]"
      >
        <Input
          type="text"
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onBlur={() => !isRenaming && onEditSave()}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSave();
            if (e.key === "Escape") onEditCancel();
          }}
          className="flex-1 bg-secondary text-foreground border focus:border-accent focus:ring-accent/20"
          style={{ fontSize: "var(--font-size-sm)" }}
          disabled={isRenaming}
          autoFocus
        />
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center p-[var(--spacing-sm)] rounded-[var(--radius-md)] cursor-pointer transition-all ${
          isActive
            ? "bg-tertiary"
            : "hover:bg-secondary opacity-50 hover:opacity-100"
        }`}
        onClick={onSelect}
      >
        <span
          className="text-foreground font-[var(--font-weight-normal)] flex-1"
          style={{ fontSize: "var(--font-size-sm)" }}
        >
          {page.name}
        </span>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`flex items-center p-[var(--spacing-sm)] rounded-[var(--radius-md)] cursor-grab active:cursor-grabbing transition-all ${
            isActive
              ? "bg-tertiary"
              : "hover:bg-secondary opacity-50 hover:opacity-100"
          }`}
          onClick={onSelect}
        >
          <span
            className="text-foreground font-[var(--font-weight-normal)] flex-1"
            style={{ fontSize: "var(--font-size-sm)" }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            {page.name}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function PageNavigationSidebar({
  isOpen,
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
  const [editingName, setEditingName] = useState("");
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
    setEditingName(page.name);
  };

  const handleNameSave = async (pageId: string) => {
    if (!editingName.trim() || !onPageRename) return;

    setIsRenaming(true);
    try {
      await onPageRename(pageId, editingName.trim());
      setEditingPageId(null);
      setEditingName("");
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
    setEditingName("");
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
      className="bg-background h-full flex-shrink-0"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex flex-col h-full p-[var(--spacing-2xl)]">
        {/* Pages List */}
        <div className="flex-1 space-y-0 overflow-y-auto">
          {pages.length === 0 ? (
            <div
              className="text-muted-foreground text-center py-[var(--spacing-xl)]"
              style={{ fontSize: "var(--font-size-sm)" }}
            >
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
                    editingName={editingName}
                    isRenaming={isRenaming}
                    isReadOnly={isReadOnly}
                    onSelect={() => onPageSelect?.(page.id)}
                    onRename={() => handlePageRename(page)}
                    onDelete={() => handleDeletePage(page.id)}
                    onEditNameChange={setEditingName}
                    onEditSave={() => handleNameSave(page.id)}
                    onEditCancel={handleNameCancel}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Add New Page Button (hidden in read-only mode) */}
        {!isReadOnly && onPageCreate && (
          <Button onClick={onPageCreate}>
            <Plus className="h-4 w-4" />
            <span>New Page</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
