/*!
 * Artifact Sync - Real-time artifact synchronization across users
 * Provides real-time sync for artifact operations (create, update, delete, reorder)
 */
import { waitForQuick } from "./quick";
import type { Artifact } from "@/types";

// Event types for artifact operations
export enum ArtifactSyncEvent {
  CREATE = "artifact:create",
  UPDATE = "artifact:update",
  DELETE = "artifact:delete",
  REORDER = "artifact:reorder",
  REPLACE_MEDIA = "artifact:replace_media",
}

export interface ArtifactEventPayload {
  pageId: string;
  artifact?: Artifact;
  artifactId?: string;
  updates?: Partial<Artifact>;
  orderedIds?: string[];
  timestamp: number;
  userId: string;
  socketId: string; // To distinguish different sessions of the same user
}

export class ArtifactSyncManager {
  private room: any = null;
  private pageId: string;
  private isConnected = false;
  private eventHandlers = new Map<ArtifactSyncEvent, Set<Function>>();
  private userId: string = "";
  private socketId: string = "";

  constructor(pageId: string) {
    this.pageId = pageId;
  }

  async init(): Promise<boolean> {
    try {
      const quick = await waitForQuick();

      // Get user identity
      const user = await quick.id.waitForUser();
      this.userId = user.email;

      // Join room for this specific page
      const roomName = `artifacts-${this.pageId}`;
      this.room = quick.socket.room(roomName);

      // Set up event handlers
      this.setupEventHandlers();

      // Join the room
      await this.room.join();
      this.isConnected = true;

      // Store our socket ID for filtering our own events
      this.socketId = this.room.user?.socketId || "";

      // Trigger UI update to show other users already in the room
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
      }

      return true;
    } catch (error) {
      console.error("[ArtifactSync] Failed to initialize:", error);
      return false;
    }
  }

  private setupEventHandlers() {
    // Listen for all artifact sync events
    Object.values(ArtifactSyncEvent).forEach((eventType) => {
      this.room.on(eventType, (payload: ArtifactEventPayload) => {
        // Don't process our own events (filter by socketId, not userId)
        // This allows the same user in different browser windows to sync
        if (payload.socketId === this.socketId) {
          return;
        }

        // Notify all registered handlers
        const handlers = this.eventHandlers.get(eventType as ArtifactSyncEvent);
        if (handlers) {
          handlers.forEach((handler) => handler(payload));
        }
      });
    });

    // Connection lifecycle
    this.room.on("connect", () => {
      this.isConnected = true;
    });

    this.room.on("disconnect", () => {
      this.isConnected = false;
    });

    // User presence events
    this.room.on("user:join", () => {
      // Trigger UI update via custom event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
      }
    });

    this.room.on("user:leave", () => {
      // Trigger UI update via custom event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
      }
    });
  }

  /**
   * Register a handler for a specific artifact event
   */
  on(
    eventType: ArtifactSyncEvent,
    handler: (payload: ArtifactEventPayload) => void
  ) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Helper to create and emit an event payload
   */
  private emit(
    eventType: ArtifactSyncEvent,
    data: Partial<
      Omit<ArtifactEventPayload, "pageId" | "timestamp" | "userId" | "socketId">
    >
  ) {
    if (!this.isConnected) return;

    const payload: ArtifactEventPayload = {
      pageId: this.pageId,
      timestamp: Date.now(),
      userId: this.userId,
      socketId: this.socketId,
      ...data,
    };

    this.room.emit(eventType, payload);
  }

  /**
   * Broadcast an artifact creation event
   */
  broadcastCreate(artifact: Artifact) {
    this.emit(ArtifactSyncEvent.CREATE, { artifact });
  }

  /**
   * Broadcast an artifact update event
   */
  broadcastUpdate(artifactId: string, updates: Partial<Artifact>) {
    this.emit(ArtifactSyncEvent.UPDATE, { artifactId, updates });
  }

  /**
   * Broadcast an artifact deletion event
   */
  broadcastDelete(artifactId: string) {
    this.emit(ArtifactSyncEvent.DELETE, { artifactId });
  }

  /**
   * Broadcast an artifact reorder event
   */
  broadcastReorder(orderedIds: string[]) {
    this.emit(ArtifactSyncEvent.REORDER, { orderedIds });
  }

  /**
   * Broadcast a media replacement event
   */
  broadcastReplaceMedia(artifactId: string, updates: Partial<Artifact>) {
    this.emit(ArtifactSyncEvent.REPLACE_MEDIA, { artifactId, updates });
  }

  /**
   * Get connected users count
   */
  getUsersCount(): number {
    if (!this.room || !this.room.users) return 0;
    return this.room.users.size;
  }

  /**
   * Get list of connected users (excluding self)
   */
  getUsers(): any[] {
    if (!this.room || !this.room.users) return [];
    const allUsers = Array.from(this.room.users.values());
    const currentSocketId = this.room.user?.socketId;

    // Filter out current user
    const otherUsers = allUsers.filter(
      (user: any) => user.socketId !== currentSocketId
    );

    // Only log if count changes (reduce noise)
    const currentCount = otherUsers.length;
    if (!this.lastUserCount || this.lastUserCount !== currentCount) {
      console.log(
        `[ArtifactSync] 👥 ${currentCount} viewer${currentCount === 1 ? "" : "s"} connected`
      );
      this.lastUserCount = currentCount;
    }

    return otherUsers;
  }

  private lastUserCount?: number;

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Clean up and disconnect
   */
  async destroy() {
    if (this.room) {
      try {
        await this.room.leave();
      } catch (error) {
        console.error("[ArtifactSync] Error leaving room:", error);
      }
    }
    this.eventHandlers.clear();
    this.isConnected = false;
    this.room = null;
  }
}
