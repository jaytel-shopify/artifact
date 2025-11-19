"use client";

/**
 * Quick Platform Integration Library
 *
 * This library provides TypeScript definitions and helper functions
 * for the Quick platform APIs (quick.db, quick.fs, quick.id, etc.)
 */

// Type definitions for Quick APIs
declare global {
  interface Window {
    quick: {
      db: QuickDB;
      fs: QuickFS;
      id: QuickIdentity & {
        user: QuickIdentity;
        waitForUser(): Promise<QuickIdentity>;
      };
      ai: QuickAI;
      socket: QuickSocket;
      site: QuickSite;
      slack: QuickSlack;
      auth: QuickAuth;
    };
  }
}

// ==================== DATABASE ====================
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
  orderBy(field: string, direction: "asc" | "desc"): QuickQuery;
  limit(n: number): QuickQuery;
  offset(n: number): QuickQuery;
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

// ==================== FILE STORAGE ====================
interface QuickFS {
  upload(
    files: File[],
    options?: {
      strategy?: "uuid" | "timestamp" | "hybrid" | "original";
    }
  ): Promise<
    | Array<{
        originalName: string;
        filename: string;
        url: string;
        fullUrl: string;
        size: number;
        mimeType: string;
      }>
    | {
        files: Array<{
          originalName: string;
          filename: string;
          url: string;
          fullUrl: string;
          size: number;
          mimeType: string;
        }>;
      }
  >;

  uploadFile(
    file: File,
    options?: {
      onProgress?: (progress: {
        percentage: number;
        loaded: number;
        total: number;
      }) => void;
    }
  ): Promise<{
    originalName: string;
    filename: string;
    url: string;
    fullUrl: string;
    size: number;
    mimeType: string;
  }>;
}

// ==================== IDENTITY ====================
interface QuickIdentity {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  slackHandle?: string;
  slackId?: string;
  slackImageUrl?: string;
  title?: string;
  github?: string;
  timestamp?: string;
}

// ==================== AI ====================
interface QuickAI {
  ask(prompt: string): Promise<string>;
  askWithSystem(system: string, prompt: string): Promise<string>;
  chat(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<{ choices: Array<{ message: { content: string } }> }>;
  chatStream(
    messages: Array<{ role: string; content: string }>,
    callback: (contentChunk: string | null, fullContent: string) => void
  ): Promise<void>;
  embed(text: string): Promise<number[]>;
}

// ==================== WEBSOCKET ====================
interface QuickSocket {
  room(name: string): QuickRoom;
}

interface QuickRoom {
  join(): Promise<void>;
  leave(): Promise<void>;
  on(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, data: any): void;
  users: Map<string, QuickUser>;
  user: QuickUser;
  updateUserState(state: any): void;
}

interface QuickUser {
  socketId: string;
  name: string;
  email: string;
  slackHandle?: string;
  slackId?: string;
  slackImageUrl?: string;
  title?: string;
  state: any;
}

// ==================== SITE MANAGEMENT ====================
interface QuickSite {
  create(
    subdomain: string,
    files: File[],
    options?: {
      force?: boolean;
    }
  ): Promise<{
    message: string;
    url: string;
  }>;

  get(subdomain: string): Promise<{
    subdomain: string;
    url: string;
    lastModified: string;
    "modified-by": string;
  } | null>;

  delete(
    subdomain: string,
    options?: {
      confirm?: boolean;
    }
  ): Promise<void>;
}

// ==================== SLACK ====================
interface QuickSlack {
  sendMessage(channel: string, text: string, options?: any): Promise<any>;
  sendAlert(
    channel: string,
    message: string,
    level: "info" | "warning" | "error" | "success"
  ): Promise<any>;
  sendStatus(
    channel: string,
    status: "online" | "offline" | "maintenance" | "degraded",
    message: string
  ): Promise<any>;
  sendCode(
    channel: string,
    code: string,
    language: string,
    title?: string
  ): Promise<any>;
  sendTable(
    channel: string,
    title: string,
    headers: string[],
    rows: any[][]
  ): Promise<any>;
}

// ==================== AUTH ====================
interface QuickAuth {
  requestScopes(scopes: string[]): Promise<{ hasRequiredScopes: boolean }>;
}

export type {
  QuickDB,
  QuickCollection,
  QuickQuery,
  QuickFS,
  QuickIdentity,
  QuickAI,
  QuickSocket,
  QuickRoom,
  QuickUser,
  QuickSite,
  QuickSlack,
  QuickAuth,
};
