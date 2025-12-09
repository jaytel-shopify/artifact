// ==================== USERS ====================

/**
 * User entity stored in Quick.db users collection.
 * Represents a Shopify employee who uses the app.
 */
export type User = {
  id: string;
  name: string;
  email: string;
  slack_handle?: string;
  slack_id?: string;
  slack_image_url?: string;
  title?: string;
};

// ==================== PROJECTS ====================

export type Project = {
  id: string;
  name: string;
  creator_id: string; // References User.id
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

export type MediaDimensionsMetadata = {
  width?: number;
  height?: number;
};

export type VideoMetadata = MediaDimensionsMetadata & {
  thumbnail_url?: string;
  hideUI?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export type ImageMetadata = MediaDimensionsMetadata;

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
  type: ArtifactType;
  source_url: string;
  file_path: string | null;
  name: string;
  description?: string;
  tags?: string[]; // Optional: tags for categorization/filtering
  metadata: Record<string, unknown> &
    Partial<
      UrlViewportMetadata &
        ImageMetadata &
        VideoMetadata &
        TitleCardMetadata &
        CollectionMetadata
    >;
  reactions: ArtifactReactions;
  published: boolean;
  published_at?: string; // When the artifact was published to the feed
  published_by?: string; // User.id of who published the artifact (shown in feed/detail instead of creator)
  creator_id: string; // References User.id
  created_at: string;
  updated_at: string;
};

// ==================== PROJECT ARTIFACTS (Junction Table) ====================

/**
 * Junction table for many-to-many relationship between Artifacts and Projects/Pages.
 * Allows the same artifact to be added to multiple projects/pages with per-context positioning.
 */
export type ProjectArtifact = {
  id: string;
  project_id: string;
  page_id: string;
  artifact_id: string;
  position: number; // Position within this page context
  created_at: string;
  updated_at: string;
  name: string;
};

/**
 * Artifact with position context - returned when querying artifacts by page/project.
 * Combines the artifact data with its position from the junction table.
 */
export type ArtifactWithPosition = Artifact & {
  position: number;
  project_artifact_id: string; // ID of the junction entry (for updates/deletes)
};

/**
 * Artifact with creator user data attached.
 * Used when displaying artifacts with creator info.
 * If published_by is set, publisher will be populated instead of (or in addition to) creator.
 */
export type ArtifactWithCreator = Artifact & {
  creator?: User;
  publisher?: User; // The user who published the artifact (if different from creator)
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
  creator_id: string; // References User.id
  position: number; // For manual ordering
  created_at: string;
  updated_at: string;
  last_accessed_at?: string; // For "last opened" sorting
};

// Access control types moved to lib/access-control.ts
// FolderAccess is now part of the unified AccessEntry type

export interface LottieMethods {
  playSegments: (
    segments: [number, number] | [number, number][],
    forceFlag?: boolean
  ) => void;
}
