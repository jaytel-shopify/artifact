"use client";

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

interface PageNavigationSidebarProps {
  isOpen: boolean;
  pages: Page[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageRename?: (pageId: string, newName: string) => Promise<void>;
  onPageCreate?: () => void;
  onPageDelete?: (pageId: string) => void;
}

export default function PageNavigationSidebar({
  pages,
  currentPageId,
  onPageSelect,
  onPageRename,
  onPageCreate,
  onPageDelete
}: PageNavigationSidebarProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

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
      setEditingName('');
      toast.success("Page renamed successfully");
    } catch (error) {
      toast.error("Failed to rename page. Please try again.");
      console.error('Failed to rename page:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleNameCancel = () => {
    setEditingPageId(null);
    setEditingName('');
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

  return (
    <aside 
      className="bg-[var(--color-background-primary)] border-r border-[var(--color-border-primary)] h-full flex-shrink-0"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <div className="flex flex-col h-full p-[var(--spacing-2xl)]">
        {/* Pages List */}
        <div className="flex-1 space-y-0 overflow-y-auto">
          {pages.length === 0 ? (
            <div className="text-[var(--color-text-secondary)] text-center py-[var(--spacing-xl)]" style={{ fontSize: 'var(--font-size-sm)' }}>
              No pages yet
            </div>
          ) : (
            pages.map((page) => (
              <div key={page.id}>
                {editingPageId === page.id ? (
                  <div className="flex items-center p-[var(--spacing-sm)] rounded-[var(--radius-md)]">
                    <Input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => !isRenaming && handleNameSave(page.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave(page.id);
                        if (e.key === 'Escape') handleNameCancel();
                      }}
                      className="flex-1 bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] focus:border-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]/20"
                      style={{ fontSize: 'var(--font-size-sm)' }}
                      disabled={isRenaming}
                      autoFocus
                    />
                  </div>
                ) : (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div
                        className={`flex items-center p-[var(--spacing-sm)] rounded-[var(--radius-md)] cursor-pointer transition-all ${
                          currentPageId === page.id 
                            ? 'bg-[var(--color-background-tertiary)]' 
                            : 'hover:bg-[var(--color-background-secondary)] opacity-50 hover:opacity-100'
                        }`}
                        onClick={() => onPageSelect?.(page.id)}
                      >
                        <span 
                          className="text-[var(--color-text-primary)] font-[var(--font-weight-normal)] flex-1"
                          style={{ fontSize: 'var(--font-size-sm)' }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handlePageRename(page);
                          }}
                        >
                          {page.name}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handlePageRename(page)}>
                        Rename
                      </ContextMenuItem>
                      {pages.length > 1 && (
                        <ContextMenuItem 
                          variant="destructive"
                          onClick={() => handleDeletePage(page.id)}
                        >
                          Delete
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add New Page Button */}
        <div className="pt-[var(--spacing-lg)] border-t border-[var(--color-border-primary)] mt-[var(--spacing-lg)]">
          <button
            onClick={onPageCreate}
            className="flex items-center gap-[var(--spacing-sm)] w-full p-[var(--spacing-sm)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] transition-all cursor-pointer"
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            <span className="text-lg">+</span>
            <span>New Page</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
