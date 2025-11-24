export type Project = {
  id: string;
  name: string;
  creator_id: string;
  folder_id: string | null; // Reference to parent folder (null if uncategorized)
  created_at: string;
  updated_at: string;
  last_accessed_at?: string; // For "last opened" sorting (optional for backward compat)
  pages?: Page[]; // Optional: populated when needed (e.g., search results)
};

export type ArtifactType =
  | "figma"
  | "url"
  | "image"
  | "video"
  | "pdf"
  | "titleCard";

export type UrlViewportMetadata = {
  viewport?: string;
  width?: number;
  height?: number;
};

export type VideoMetadata = {
  thumbnail_url?: string;
  hideUI?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export type TitleCardMetadata = {
  headline?: string;
  subheadline?: string;
};

export type CollectionMetadata = {
  collection_id?: string; // ID shared by all artifacts in this collection
  is_expanded?: boolean; // Whether the collection is currently expanded in the carousel
  [key: string]: unknown; // Allow for future extensibility
};

export type ArtifactReactions = {
  like: string[]; // Array of user_ids who liked
  dislike: string[]; // Array of user_ids who disliked
};

export type Page = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Artifact = {
  id: string;
  project_id: string;
  page_id: string;
  type: ArtifactType;
  source_url: string;
  file_path: string | null;
  name: string;
  description?: string;
  position: number;
  metadata: Record<string, unknown> &
    Partial<
      UrlViewportMetadata &
        VideoMetadata &
        TitleCardMetadata &
        CollectionMetadata
    >;
  reactions: ArtifactReactions;
  published: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
};

export type ViewportState = {
  columns_in_view: number; // 1-8
  scroll_x: number; // px offset
  focused_artifact_id: string | null;
};

// ==================== FOLDERS ====================

export type Folder = {
  id: string;
  name: string;
  creator_id: string; // Owner's email
  position: number; // For manual ordering
  created_at: string;
  updated_at: string;
  last_accessed_at?: string; // For "last opened" sorting
};

// Access control types moved to lib/access-control.ts
// FolderAccess is now part of the unified AccessEntry type
