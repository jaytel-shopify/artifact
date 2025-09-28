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
  is_shared: boolean;
  shared_at: string | null;
  created_at: string;
  updated_at: string;
  settings: ProjectSettings;
};

export type ArtifactType = "figma" | "url" | "image" | "video" | "pdf";

export type UrlViewportMetadata = {
  viewport?: string;
  width?: number;
  height?: number;
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


