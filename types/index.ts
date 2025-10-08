export type ProjectSettings = {
  default_columns: number;
  allow_viewer_control: boolean;
  background_color: string;
};

export type Project = {
  id: string;
  name: string;
  creator_id: string;
  share_token: string;
  folder_id: string | null; // Reference to parent folder (null if uncategorized)
  created_at: string;
  updated_at: string;
  last_accessed_at?: string; // For "last opened" sorting (optional for backward compat)
  settings: ProjectSettings;
};

export type ArtifactType = "figma" | "url" | "image" | "video";

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
  position: number;
  metadata: Record<string, unknown> | UrlViewportMetadata;
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

export type FolderAccess = {
  id: string;
  folder_id: string; // Reference to folder
  user_email: string; // Collaborator's email
  role: "editor" | "viewer"; // Permission level
  created_at: string;
  updated_at: string;
};
