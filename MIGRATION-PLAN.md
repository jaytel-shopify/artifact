# Quick Platform Migration Plan

## Executive Summary

This document outlines the comprehensive plan to migrate from a Next.js server-side architecture with Supabase backend to a pure client-side static site using Quick's platform APIs. The migration is broken into 4 sequential phases to minimize risk and ensure a smooth transition.

---

## Current Architecture Analysis

### Tech Stack
- **Framework**: Next.js 15.5.3 with Server Components & API Routes
- **Authentication**: Supabase Auth (OAuth with Google)
- **Database**: Supabase Postgres (4 tables: projects, pages, artifacts, project_access)
- **Storage**: Supabase Storage (artifacts bucket for images, videos, PDFs)
- **Client State**: SWR for data fetching and caching

### Database Schema
```
projects
├─ id (UUID)
├─ name (VARCHAR)
├─ creator_id (UUID)
├─ share_token (VARCHAR)
├─ created_at (TIMESTAMP)
├─ updated_at (TIMESTAMP)
└─ settings (JSONB)

pages
├─ id (UUID)
├─ project_id (UUID) → projects(id)
├─ name (VARCHAR)
├─ position (INTEGER)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

artifacts
├─ id (UUID)
├─ project_id (UUID) → projects(id)
├─ page_id (UUID) → pages(id)
├─ type (VARCHAR) [figma, url, image, video, pdf]
├─ source_url (TEXT)
├─ file_path (TEXT)
├─ name (VARCHAR)
├─ position (INTEGER)
├─ metadata (JSONB)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

project_access
├─ id (UUID)
├─ project_id (UUID) → projects(id)
├─ user_id (UUID)
├─ role (VARCHAR) [owner, presenter, viewer]
└─ created_at (TIMESTAMP)
```

### Current API Routes (to be eliminated)
1. `GET /api/projects` - List all projects
2. `POST /api/projects` - Create project
3. `GET /api/projects/[id]` - Get project by ID
4. `PATCH /api/projects/[id]` - Update project
5. `DELETE /api/projects/[id]` - Delete project
6. `GET /api/projects/by-share?token=` - Get project by share token
7. `GET /api/projects/[id]/pages` - List pages
8. `POST /api/projects/[id]/pages` - Create page
9. `PATCH /api/projects/[id]/pages/[pageId]` - Update page
10. `DELETE /api/projects/[id]/pages/[pageId]` - Delete page
11. `GET /api/projects/[id]/pages/[pageId]/artifacts` - List artifacts
12. `POST /api/projects/[id]/pages/[pageId]/artifacts` - Create artifact
13. `PATCH /api/projects/[id]/pages/[pageId]/artifacts` - Reorder artifacts
14. `PATCH /api/projects/[id]/artifacts/[artifactId]` - Update artifact
15. `DELETE /api/projects/[id]/artifacts/[artifactId]` - Delete artifact
16. `POST /api/upload` - Upload files to storage
17. `GET /api/projects/covers` - Generate project cover images
18. `GET /api/embed/preview` - Generate embed previews

### Files Using Supabase
- `lib/supabase.ts` - Admin & browser client factory
- `lib/supabase-server.ts` - Server-side client with cookies
- `lib/supabase-browser.ts` - Client-side browser client
- `components/auth/AuthProvider.tsx` - Auth context and Google OAuth
- All API routes in `app/api/**`
- All hooks in `hooks/**` (useProject, usePages, useArtifacts, etc.)

---

## Phase 1: Convert to Client-Side Only Architecture

### Goal
Remove all Next.js server-side features and convert to a pure static site that can be deployed to Quick.

### Changes Required

#### 1.1 Remove Server Components & API Routes
- **Delete** entire `app/api/` directory
- Convert all Server Components to Client Components
- Remove `"use server"` directives
- Add `"use client"` to all page components

#### 1.2 Update Next.js Configuration
**File**: `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Static HTML export
  distDir: "dist", // Quick deployment directory
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Better static routing
};

export default nextConfig;
```

#### 1.3 Create Quick Integration Library
**File**: `lib/quick.ts`
```typescript
"use client";

// Type definitions for Quick APIs
declare global {
  interface Window {
    quick: {
      db: QuickDB;
      fs: QuickFS;
      id: QuickIdentity;
      ai: QuickAI;
      socket: QuickSocket;
      site: QuickSite;
    };
  }
}

interface QuickDB {
  collection(name: string): QuickCollection;
}

interface QuickCollection {
  create(data: any): Promise<any>;
  find(): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<void>;
  delete(id: string): Promise<void>;
  where(query: any): QuickQuery;
  subscribe(handlers: {
    onCreate?: (doc: any) => void;
    onUpdate?: (doc: any) => void;
    onDelete?: (id: string) => void;
  }): () => void;
}

interface QuickQuery {
  select(fields: string[]): QuickQuery;
  limit(n: number): QuickQuery;
  find(): Promise<any[]>;
}

interface QuickFS {
  upload(files: File[], options?: { strategy?: string }): Promise<{
    files: Array<{
      url: string;
      fullUrl: string;
      size: number;
      mimeType: string;
    }>;
  }>;
  uploadFile(file: File, options?: {
    onProgress?: (progress: { percentage: number }) => void;
  }): Promise<{
    files: Array<{
      url: string;
      fullUrl: string;
      size: number;
      mimeType: string;
    }>;
  }>;
}

interface QuickIdentity {
  email: string;
  fullName: string;
  firstName: string;
  slackHandle?: string;
  slackId?: string;
  slackImageUrl?: string;
  title?: string;
  github?: string;
  waitForUser(): Promise<QuickIdentity>;
}

interface QuickAI {
  ask(prompt: string): Promise<string>;
  askWithSystem(system: string, prompt: string): Promise<string>;
}

interface QuickSocket {
  room(name: string): QuickRoom;
}

interface QuickRoom {
  join(): Promise<void>;
  leave(): Promise<void>;
  on(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, data: any): void;
}

interface QuickSite {
  create(subdomain: string, files: File[], options?: { force?: boolean }): Promise<any>;
  get(subdomain: string): Promise<any>;
  delete(subdomain: string, options?: { confirm?: boolean }): Promise<void>;
}

// Helper to ensure Quick is loaded
export function useQuick() {
  if (typeof window === "undefined") return null;
  return window.quick;
}

// Wait for Quick to be ready
export async function waitForQuick(): Promise<typeof window.quick> {
  if (typeof window === "undefined") {
    throw new Error("Quick is only available in the browser");
  }
  
  if (window.quick) {
    return window.quick;
  }
  
  return new Promise((resolve) => {
    const checkQuick = () => {
      if (window.quick) {
        resolve(window.quick);
      } else {
        setTimeout(checkQuick, 100);
      }
    };
    checkQuick();
  });
}
```

#### 1.4 Update Root Layout
**File**: `app/layout.tsx`
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Load Quick SDK */}
        <script src="/client/quick.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

#### 1.5 Remove Server-Side Auth Callback
- **Delete** `app/auth/callback/route.ts` (no longer needed)
- Update auth flow to be entirely client-side

#### 1.6 Update Package Scripts
**File**: `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next build && next export",
    "deploy": "pnpm build && quick deploy dist your-subdomain-name"
  }
}
```

#### 1.7 Files to Modify
- `app/page.tsx` - Add "use client"
- `app/(dashboard)/projects/page.tsx` - Add "use client"
- `app/(dashboard)/projects/[id]/page.tsx` - Add "use client"
- `app/(dashboard)/projects/new/page.tsx` - Add "use client"
- `app/presentation/[shareToken]/page.tsx` - Add "use client"
- `app/settings/page.tsx` - Add "use client"

---

## Phase 2: Replace Supabase Auth with Quick.id

### Goal
Remove Supabase authentication and use Quick's built-in identity system.

### Changes Required

#### 2.1 Update AuthProvider
**File**: `components/auth/AuthProvider.tsx`
```typescript
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { waitForQuick } from "@/lib/quick";

interface AuthContextValue {
  user: QuickUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface QuickUser {
  email: string;
  fullName: string;
  firstName: string;
  slackHandle?: string;
  slackId?: string;
  slackImageUrl?: string;
  title?: string;
  github?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<QuickUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initUser() {
      try {
        const quick = await waitForQuick();
        const userData = await quick.id.waitForUser();
        
        if (mounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initUser();

    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: async () => {
      // Quick handles auth automatically via Google
      // Just reload the page to trigger auth flow
      window.location.reload();
    },
    signOut: async () => {
      // Quick handles signout - redirect to logout endpoint
      window.location.href = "/logout";
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
```

#### 2.2 Update UserAvatar Component
**File**: `components/auth/UserAvatar.tsx`
```typescript
"use client";

import { useAuth } from "./AuthProvider";
import { Avatar } from "@/components/ui/avatar";

export function UserAvatar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Avatar>
      {user.slackImageUrl ? (
        <img src={user.slackImageUrl} alt={user.fullName} />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200">
          {user.firstName?.[0] || user.email[0].toUpperCase()}
        </div>
      )}
    </Avatar>
  );
}
```

#### 2.3 Remove Supabase Dependencies
- **Delete** `lib/supabase.ts`
- **Delete** `lib/supabase-server.ts`
- **Delete** `lib/supabase-browser.ts`
- Remove from `package.json`:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
  - `@supabase/auth-helpers-nextjs`

#### 2.4 Update Login Page
**File**: `app/auth/login/page.tsx`
```typescript
"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/projects");
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Artifact</h1>
        <p className="text-gray-600 mb-8">
          Quick automatically handles authentication for Shopify employees
        </p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>Redirecting...</p>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 3: Replace Supabase Storage with Quick.fs

### Goal
Migrate file uploads from Supabase Storage to Quick's file storage system.

### Changes Required

#### 3.1 Create Quick Storage Helper
**File**: `lib/quick-storage.ts`
```typescript
"use client";

import { waitForQuick } from "./quick";

export interface UploadResult {
  url: string;
  fullUrl: string;
  size: number;
  mimeType: string;
}

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const quick = await waitForQuick();

  const result = await quick.fs.uploadFile(file, {
    onProgress: (progress) => {
      onProgress?.(progress.percentage);
    },
  });

  return result.files[0];
}

export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  const quick = await waitForQuick();

  const result = await quick.fs.upload(files, {
    strategy: "hybrid", // timestamp + random
  });

  return result.files;
}
```

#### 3.2 Update ArtifactAdder Component
**File**: `components/upload/ArtifactAdder.tsx`
```typescript
// Replace the upload logic
import { uploadFiles } from "@/lib/quick-storage";

// In handleAdd function:
if (files.length > 0) {
  setUploadState({
    uploading: true,
    totalFiles: files.length,
    completedFiles: 0,
    currentProgress: 0,
  });

  const uploadResults = await uploadFiles(files);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = uploadResults[i];

    const type = file.type.startsWith("video/")
      ? "video"
      : file.type === "application/pdf"
        ? "pdf"
        : "image";

    const artifactName = generateArtifactName(type, result.fullUrl, file);
    await createArtifact({
      type,
      source_url: result.fullUrl,
      file_path: result.url, // Relative path
      name: artifactName,
    });

    setUploadState((prev) => ({
      ...prev,
      completedFiles: i + 1,
      currentProgress: Math.round(((i + 1) / files.length) * 100),
    }));
  }
}
```

#### 3.3 Update DropzoneUploader
**File**: `components/upload/DropzoneUploader.tsx`
```typescript
// Update upload logic to use Quick.fs
import { uploadFiles } from "@/lib/quick-storage";

// Replace fetch("/api/upload") with uploadFiles()
```

#### 3.4 Update Presentation Page Upload
**File**: `app/presentation/[shareToken]/page.tsx`
```typescript
import { uploadFiles } from "@/lib/quick-storage";

const handleFileUpload = useCallback(async (files: File[]) => {
  if (!project?.id || !currentPageId) return;

  try {
    setUploadState({
      uploading: true,
      totalFiles: files.length,
      completedFiles: 0,
      currentProgress: 0,
    });

    const uploadResults = await uploadFiles(files);

    let completedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = uploadResults[i];

      const type = file.type.startsWith("video/")
        ? "video"
        : file.type === "application/pdf"
          ? "pdf"
          : "image";

      const artifactName = generateArtifactName(type, result.fullUrl, file);
      await createArtifact({
        type,
        source_url: result.fullUrl,
        file_path: result.url,
        name: artifactName,
      });

      completedCount++;
      setUploadState((prev) => ({
        ...prev,
        completedFiles: completedCount,
        currentProgress: Math.round((completedCount / files.length) * 100),
      }));
    }

    toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`);
    refetchArtifacts();
  } catch (err) {
    toast.error("Failed to upload files");
    console.error(err);
  } finally {
    setUploadState({
      uploading: false,
      totalFiles: 0,
      completedFiles: 0,
      currentProgress: 0,
    });
  }
}, [project?.id, currentPageId, createArtifact, refetchArtifacts]);
```

---

## Phase 4: Replace Supabase Database with Quick.db

### Goal
Convert all Postgres database operations to Quick's JSON-based database.

### Changes Required

#### 4.1 Create Quick Database Service Layer
**File**: `lib/quick-db.ts`
```typescript
"use client";

import { waitForQuick } from "./quick";
import type { Project, Page, Artifact } from "@/types";

// ==================== PROJECTS ====================

export async function getProjects(creatorId?: string): Promise<Project[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  let projects = await collection.find();

  if (creatorId) {
    projects = projects.filter((p: Project) => p.creator_id === creatorId);
  }

  // Sort by created_at descending
  return projects.sort(
    (a: Project, b: Project) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getProjectById(id: string): Promise<Project | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  return await collection.findById(id);
}

export async function getProjectByShareToken(token: string): Promise<Project | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  const projects = await collection.where({ share_token: token }).find();
  return projects[0] || null;
}

export async function createProject(data: {
  name: string;
  creator_id: string;
  share_token: string;
  settings?: any;
}): Promise<Project> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");

  const project = await collection.create({
    name: data.name,
    creator_id: data.creator_id,
    share_token: data.share_token,
    settings: data.settings || {
      default_columns: 3,
      allow_viewer_control: true,
      background_color: "#ffffff",
    },
  });

  // Create default page
  await createPage({
    project_id: project.id,
    name: "Page 01",
    position: 0,
  });

  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "settings">>
): Promise<Project> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("projects");
  await collection.update(id, updates);
  return await collection.findById(id);
}

export async function deleteProject(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all artifacts
  const artifacts = await getArtifacts(id);
  await Promise.all(artifacts.map((a) => deleteArtifact(a.id)));

  // Delete all pages
  const pages = await getPages(id);
  await Promise.all(pages.map((p) => deletePage(p.id)));

  // Delete project
  const projectCollection = quick.db.collection("projects");
  await projectCollection.delete(id);
}

// ==================== PAGES ====================

export async function getPages(projectId: string): Promise<Page[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");
  const pages = await collection.where({ project_id: projectId }).find();
  return pages.sort((a: Page, b: Page) => a.position - b.position);
}

export async function getPageById(id: string): Promise<Page | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");
  return await collection.findById(id);
}

export async function createPage(data: {
  project_id: string;
  name: string;
  position: number;
}): Promise<Page> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");
  return await collection.create(data);
}

export async function updatePage(
  id: string,
  updates: Partial<Pick<Page, "name" | "position">>
): Promise<Page> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("pages");
  await collection.update(id, updates);
  return await collection.findById(id);
}

export async function deletePage(id: string): Promise<void> {
  const quick = await waitForQuick();

  // Delete all artifacts on this page
  const artifacts = await getArtifactsByPage(id);
  await Promise.all(artifacts.map((a) => deleteArtifact(a.id)));

  // Delete page
  const collection = quick.db.collection("pages");
  await collection.delete(id);
}

// ==================== ARTIFACTS ====================

export async function getArtifacts(projectId: string): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  const artifacts = await collection.where({ project_id: projectId }).find();
  return artifacts.sort((a: Artifact, b: Artifact) => a.position - b.position);
}

export async function getArtifactsByPage(pageId: string): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  const artifacts = await collection.where({ page_id: pageId }).find();
  return artifacts.sort((a: Artifact, b: Artifact) => a.position - b.position);
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  return await collection.findById(id);
}

export async function createArtifact(data: {
  project_id: string;
  page_id: string;
  type: string;
  source_url: string;
  file_path?: string;
  name: string;
  position: number;
  metadata?: any;
}): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  return await collection.create({
    ...data,
    metadata: data.metadata || {},
  });
}

export async function updateArtifact(
  id: string,
  updates: Partial<Artifact>
): Promise<Artifact> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  await collection.update(id, updates);
  return await collection.findById(id);
}

export async function deleteArtifact(id: string): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  await collection.delete(id);
}

export async function reorderArtifacts(updates: Array<{ id: string; position: number }>): Promise<void> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");
  await Promise.all(
    updates.map(({ id, position }) => collection.update(id, { position }))
  );
}

// ==================== REALTIME SUBSCRIPTIONS ====================

export function subscribeToProjects(handlers: {
  onCreate?: (project: Project) => void;
  onUpdate?: (project: Project) => void;
  onDelete?: (id: string) => void;
}): () => void {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    const quick = await waitForQuick();
    const collection = quick.db.collection("projects");
    unsubscribe = collection.subscribe(handlers);
  })();

  return () => unsubscribe?.();
}

export function subscribeToPages(
  projectId: string,
  handlers: {
    onCreate?: (page: Page) => void;
    onUpdate?: (page: Page) => void;
    onDelete?: (id: string) => void;
  }
): () => void {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    const quick = await waitForQuick();
    const collection = quick.db.collection("pages");
    // Note: Quick.db doesn't have built-in filtering for subscriptions
    // We'll need to filter in the handler
    unsubscribe = collection.subscribe({
      onCreate: (doc) => {
        if (doc.project_id === projectId) handlers.onCreate?.(doc);
      },
      onUpdate: (doc) => {
        if (doc.project_id === projectId) handlers.onUpdate?.(doc);
      },
      onDelete: (id) => handlers.onDelete?.(id),
    });
  })();

  return () => unsubscribe?.();
}

export function subscribeToArtifacts(
  pageId: string,
  handlers: {
    onCreate?: (artifact: Artifact) => void;
    onUpdate?: (artifact: Artifact) => void;
    onDelete?: (id: string) => void;
  }
): () => void {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    const quick = await waitForQuick();
    const collection = quick.db.collection("artifacts");
    unsubscribe = collection.subscribe({
      onCreate: (doc) => {
        if (doc.page_id === pageId) handlers.onCreate?.(doc);
      },
      onUpdate: (doc) => {
        if (doc.page_id === pageId) handlers.onUpdate?.(doc);
      },
      onDelete: (id) => handlers.onDelete?.(id),
    });
  })();

  return () => unsubscribe?.();
}
```

#### 4.2 Update Hooks to Use Quick Database

**File**: `hooks/useProject.ts`
```typescript
"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { getProjectById, updateProject, deleteProject } from "@/lib/quick-db";
import type { Project } from "@/types";

async function fetcher(id: string) {
  return await getProjectById(id);
}

export function useProject(projectId: string | undefined) {
  const { data: project, error, isLoading, mutate } = useSWR<Project | null>(
    projectId ? `project-${projectId}` : null,
    () => projectId ? fetcher(projectId) : null,
    { revalidateOnFocus: false }
  );

  const updateProjectName = useCallback(
    async (name: string) => {
      if (!projectId) return;
      await updateProject(projectId, { name });
      await mutate();
    },
    [projectId, mutate]
  );

  const deleteProjectById = useCallback(async () => {
    if (!projectId) return;
    await deleteProject(projectId);
  }, [projectId]);

  return {
    project,
    isLoading,
    error,
    updateProjectName,
    deleteProject: deleteProjectById,
    refetch: mutate,
  };
}
```

**File**: `hooks/usePages.ts`
```typescript
"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import { getPages, createPage, updatePage, deletePage as deletePageDB } from "@/lib/quick-db";
import type { Page } from "@/types";

async function fetcher(projectId: string) {
  return await getPages(projectId);
}

export function usePages(projectId: string | undefined) {
  const { data: pages = [], error, isLoading, mutate } = useSWR<Page[]>(
    projectId ? `pages-${projectId}` : null,
    () => projectId ? fetcher(projectId) : [],
    { revalidateOnFocus: false }
  );

  const createNewPage = useCallback(
    async (name: string) => {
      if (!projectId) return null;

      const nextPosition = pages.length;
      const page = await createPage({
        project_id: projectId,
        name,
        position: nextPosition,
      });

      await mutate();
      return page;
    },
    [projectId, pages.length, mutate]
  );

  const updatePageData = useCallback(
    async (pageId: string, updates: Partial<Pick<Page, "name" | "position">>) => {
      if (!projectId) return null;
      const page = await updatePage(pageId, updates);
      await mutate();
      return page;
    },
    [projectId, mutate]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      if (!projectId) return;
      await deletePageDB(pageId);
      await mutate();
    },
    [projectId, mutate]
  );

  const reorderPages = useCallback(
    async (reorderedPages: Page[]) => {
      if (!projectId) return;

      // Optimistic update
      mutate(reorderedPages, false);

      // Update on server
      try {
        await Promise.all(
          reorderedPages.map((page, index) => updatePage(page.id, { position: index }))
        );
        await mutate();
      } catch (error) {
        // Revert on error
        await mutate();
        throw error;
      }
    },
    [projectId, mutate]
  );

  return {
    pages,
    isLoading,
    error,
    createPage: createNewPage,
    updatePage: updatePageData,
    deletePage,
    reorderPages,
    refetch: mutate,
  };
}
```

**File**: `hooks/useArtifacts.ts`
```typescript
"use client";

import useSWR from "swr";
import { useCallback } from "react";
import {
  getArtifactsByPage,
  createArtifact as createArtifactDB,
  updateArtifact as updateArtifactDB,
  deleteArtifact as deleteArtifactDB,
  reorderArtifacts as reorderArtifactsDB,
} from "@/lib/quick-db";
import type { Artifact } from "@/types";

async function fetcher(pageId: string) {
  return await getArtifactsByPage(pageId);
}

export function useArtifacts(projectId: string | undefined, pageId: string | undefined) {
  const { data: artifacts = [], error, isLoading, mutate } = useSWR<Artifact[]>(
    pageId ? `artifacts-${pageId}` : null,
    () => pageId ? fetcher(pageId) : [],
    { revalidateOnFocus: false }
  );

  const createArtifact = useCallback(
    async (data: {
      type: string;
      source_url: string;
      file_path?: string;
      name: string;
      metadata?: any;
    }) => {
      if (!projectId || !pageId) return null;

      const nextPosition = artifacts.length;
      const artifact = await createArtifactDB({
        project_id: projectId,
        page_id: pageId,
        ...data,
        position: nextPosition,
      });

      await mutate();
      return artifact;
    },
    [projectId, pageId, artifacts.length, mutate]
  );

  const updateArtifact = useCallback(
    async (artifactId: string, updates: Partial<Artifact>) => {
      const artifact = await updateArtifactDB(artifactId, updates);
      await mutate();
      return artifact;
    },
    [mutate]
  );

  const deleteArtifact = useCallback(
    async (artifactId: string) => {
      await deleteArtifactDB(artifactId);
      await mutate();
    },
    [mutate]
  );

  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      // Optimistic update
      mutate(reorderedArtifacts, false);

      try {
        await reorderArtifactsDB(
          reorderedArtifacts.map((a, index) => ({ id: a.id, position: index }))
        );
        await mutate();
      } catch (error) {
        // Revert on error
        await mutate();
        throw error;
      }
    },
    [mutate]
  );

  return {
    artifacts,
    isLoading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    reorderArtifacts,
    refetch: mutate,
  };
}
```

#### 4.3 Update Projects Page
**File**: `app/(dashboard)/projects/page.tsx`
```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getProjects, createProject } from "@/lib/quick-db";
import type { Project } from "@/types";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  async function loadProjects() {
    try {
      const data = await getProjects(user?.email);
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!user) return;

    try {
      const shareToken = nanoid();
      await createProject({
        name: "Untitled Project",
        creator_id: user.email,
        share_token: shareToken,
      });
      await loadProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  }

  // ... rest of component
}
```

#### 4.4 Update Type Definitions
Since Quick.db automatically adds `id`, `created_at`, and `updated_at`, update types:

**File**: `types/index.ts`
```typescript
// Keep existing types - Quick.db will automatically add id, created_at, updated_at
// No changes needed, just document that these fields are auto-generated
```

---

## Testing Strategy

### Phase 1 Testing
1. Build static export: `pnpm build`
2. Verify `dist/` folder contains static HTML files
3. Test local static server: `npx serve dist`
4. Verify all pages load without hydration errors

### Phase 2 Testing
1. Deploy to Quick test subdomain
2. Verify Quick identity loads correctly
3. Test user info display (email, name, avatar)
4. Verify auth redirects work properly

### Phase 3 Testing
1. Test file uploads for images, videos, PDFs
2. Verify file URLs are accessible
3. Test progress indicators
4. Verify file size limits and error handling

### Phase 4 Testing
1. Test CRUD operations for projects
2. Test CRUD operations for pages
3. Test CRUD operations for artifacts
4. Test drag-and-drop reordering
5. Test real-time updates across browser tabs
6. Test share token access
7. Performance test with large datasets

---

## Data Migration Plan

### Exporting from Supabase
```sql
-- Export projects
COPY (SELECT * FROM projects) TO '/tmp/projects.json';

-- Export pages
COPY (SELECT * FROM pages) TO '/tmp/pages.json';

-- Export artifacts
COPY (SELECT * FROM artifacts) TO '/tmp/artifacts.json';
```

### Importing to Quick.db
Create migration script:

**File**: `scripts/migrate-data.ts`
```typescript
import * as fs from "fs";

async function migrateData() {
  // Load Quick
  const projects = JSON.parse(fs.readFileSync("./data/projects.json", "utf-8"));
  const pages = JSON.parse(fs.readFileSync("./data/pages.json", "utf-8"));
  const artifacts = JSON.parse(fs.readFileSync("./data/artifacts.json", "utf-8"));

  // Note: Run this in browser console on deployed Quick site
  console.log("Run this in browser console:");
  console.log(`
    const projectsCol = quick.db.collection("projects");
    const pagesCol = quick.db.collection("pages");
    const artifactsCol = quick.db.collection("artifacts");

    // Import projects
    for (const project of ${JSON.stringify(projects)}) {
      await projectsCol.create(project);
    }

    // Import pages
    for (const page of ${JSON.stringify(pages)}) {
      await pagesCol.create(page);
    }

    // Import artifacts
    for (const artifact of ${JSON.stringify(artifacts)}) {
      await artifactsCol.create(artifact);
    }

    console.log("Migration complete!");
  `);
}

migrateData();
```

---

## Deployment Process

### Initial Deployment
```bash
# Build static site
pnpm build

# Deploy to Quick
quick deploy dist artifact-app

# Site will be available at:
# https://artifact-app.quick.shopify.io
```

### Subsequent Deployments
```bash
# Same process - Quick will prompt to overwrite
pnpm build && quick deploy dist artifact-app
```

---

## Rollback Plan

If any phase fails:

1. **Keep Supabase running** until migration is 100% complete
2. **Maintain git branches** for each phase
3. **Test thoroughly** in a separate Quick subdomain before switching production
4. **Export data** before each major change

### Emergency Rollback
```bash
# Revert to previous git commit
git checkout main
git reset --hard <previous-commit>

# Redeploy old version
pnpm build && quick deploy dist artifact-app --force
```

---

## Timeline Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1: Client-Side Architecture | 2-3 days | Medium |
| Phase 2: Quick.id Authentication | 1-2 days | Low |
| Phase 3: Quick.fs Storage | 1-2 days | Low |
| Phase 4: Quick.db Database | 3-5 days | High |
| **Total** | **7-12 days** | - |

---

## Risk Assessment

### High Risk
- **Data loss during migration** - Mitigate with thorough backups and testing
- **Quick.db query performance** - JSON queries may be slower than SQL
- **Quick.db querying limitations** - No complex joins or aggregations

### Medium Risk
- **File URL changes** - Old Supabase URLs will break
- **Share token collisions** - Need to verify uniqueness in Quick.db
- **Real-time subscription overhead** - May impact performance with many users

### Low Risk
- **Authentication** - Quick handles this automatically
- **File uploads** - Quick.fs is well-tested
- **Static deployment** - Next.js export is mature

---

## Post-Migration Cleanup

After successful migration:

1. **Delete Supabase dependencies** from package.json
2. **Remove unused files**: `lib/supabase*.ts`, `app/api/**`
3. **Archive Supabase project** (don't delete immediately)
4. **Update documentation** and README
5. **Update environment variables** (remove Supabase vars)
6. **Monitor Quick.db usage** and quotas

---

## Questions to Resolve

1. **Quick.db collections** - Are there limits on collection size?
2. **Quick.fs storage** - What are the storage limits and quotas?
3. **Quick identity** - Can we map Supabase user IDs to Quick user emails?
4. **Permissions** - Do we need to implement our own role-based access control?
5. **Search** - How do we implement full-text search in Quick.db?

---

## Appendix: Quick API Reference

### Database Operations
```javascript
const col = quick.db.collection("projects");

// Create
const doc = await col.create({ name: "Project 1" });

// Read
const all = await col.find();
const one = await col.findById(id);

// Update
await col.update(id, { name: "Updated" });

// Delete
await col.delete(id);

// Query
const filtered = await col.where({ status: "active" }).limit(10).find();

// Subscribe
const unsub = col.subscribe({
  onCreate: (doc) => console.log("Created:", doc),
  onUpdate: (doc) => console.log("Updated:", doc),
  onDelete: (id) => console.log("Deleted:", id),
});
```

### File Storage
```javascript
// Upload single file
const result = await quick.fs.uploadFile(file, {
  onProgress: (p) => console.log(p.percentage + "%"),
});

// Upload multiple
const results = await quick.fs.upload(files);
```

### Identity
```javascript
const user = await quick.id.waitForUser();
console.log(user.email, user.fullName);
```

---

## Success Criteria

✅ All Next.js API routes eliminated
✅ Application runs as pure static HTML/JS/CSS
✅ Authentication via Quick.id working
✅ File uploads to Quick.fs working
✅ All database operations via Quick.db working
✅ Real-time updates functioning
✅ Share tokens working correctly
✅ Drag-and-drop reordering working
✅ All existing features maintained
✅ Performance acceptable (< 2s page loads)
✅ Successfully deployed to Quick subdomain

---

**End of Migration Plan**


