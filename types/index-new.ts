export type ArtifactType =
  | "figma"
  | "url"
  | "image"
  | "video"
  | "pdf"
  | "titleCard";

export type UrlContent = {
  url: string;
  viewport?: string;
  width?: number;
  height?: number;
};

export type VideoContent = {
  url: string;
  thumbnail_url?: string;
};

export type ImageContent = {
  url: string;
  width?: number;
  height?: number;
};

export type TitleCardContent = {
  headline?: string;
  subheadline?: string;
};

export type Visibility = "public" | "private";

export type Artifact = {
  id: string;
  type: ArtifactType;
  title: string;
  content: UrlContent & ImageContent & VideoContent & TitleCardContent;
  author_id: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  title: string;
  owner_id: string;
  depth: number;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type FolderArtifact = {
  folder_id: string;
  artifact_id: string;
  created_at: string;
  position: number;
};

export type Role = "owner" | "editor" | "viewer";

export type FolderMember = {
  folder_id: string;
  user_id: string;
  role: Role;
};
