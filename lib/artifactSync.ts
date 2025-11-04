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
  private projectId: string;
  private pageId: string;
  private isConnected = false;
  private eventHandlers = new Map<ArtifactSyncEvent, Set<Function>>();
  private userId: string = "";
  private socketId: string = "";

  constructor(projectId: string, pageId: string) {
    this.projectId = projectId;
    this.pageId = pageId;
  }

  async init(): Promise<boolean> {
    try {
      const quick = await waitForQuick();

      // Get user identity with full profile (including slack data)
      const user = await quick.id.waitForUser();
      this.userId = user.email;

      // Join room for this specific project (not page, so viewers persist across pages)
      const roomName = `artifacts-${this.projectId}`;
      this.room = quick.socket.room(roomName);

      // Set up event handlers
      this.setupEventHandlers();

      // Join the room
      await this.room.join();
      this.isConnected = true;

      // Store our socket ID for filtering our own events
      this.socketId = this.room.user?.socketId || "";

      // Update user state with full profile info (including slack avatar)
      this.room.updateUserState({
        slackImageUrl: user.slackImageUrl,
        slackHandle: user.slackHandle,
        slackId: user.slackId,
        fullName: user.fullName,
        title: user.title,
      });

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
      // Reset user count cache on reconnect
      this.lastUserCount = undefined;
      // Trigger UI update
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 100);
      }
    });

    this.room.on("disconnect", () => {
      this.isConnected = false;
    });

    // User presence events
    this.room.on("user:join", () => {
      // Reset cache to force new log
      this.lastUserCount = undefined;
      // Trigger UI update via custom event (use setTimeout to ensure room.users is updated)
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 50);
      }
    });

    this.room.on("user:leave", () => {
      // Reset cache to force new log
      this.lastUserCount = undefined;
      // Trigger UI update via custom event (use setTimeout to ensure room.users is updated)
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 50);
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
   * Get the room instance (for sharing with other managers)
   */
  getRoom(): any {
    return this.room;
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
    if (!this.room || !this.room.users) {
      // Reset cache when room is not available
      this.lastUserCount = undefined;
      return [];
    }

    // Get all users and filter out self
    const allUsers = Array.from(this.room.users.values());
    const currentSocketId = this.room.user?.socketId;

    // Merge user base data with their state (which contains slack profile info)
    const enrichedUsers = allUsers
      .filter((user: any) => user.socketId !== currentSocketId)
      .map((user: any) => ({
        socketId: user.socketId,
        name: user.name,
        email: user.email,
        // Get slack data from user state (set during init)
        slackImageUrl: user.state?.slackImageUrl,
        slackHandle: user.state?.slackHandle,
        slackId: user.state?.slackId,
        fullName: user.state?.fullName || user.name,
        title: user.state?.title || user.title,
      }));

    // Track current count for change detection
    const currentCount = enrichedUsers.length;
    if (
      this.lastUserCount === undefined ||
      this.lastUserCount !== currentCount
    ) {
      this.lastUserCount = currentCount;
    }

    // Return a new array reference each time to ensure React detects changes
    return enrichedUsers;
  }

  private lastUserCount?: number;

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && this.room && this.room.user;
  }

  /**
   * Ensure the room is connected, reconnecting if necessary
   * Used when reusing an existing manager after navigation
   */
  async ensureConnected(): Promise<boolean> {
    // If already connected and has user, we're good
    if (this.isConnected && this.room?.user) {
      return true;
    }

    // If room exists but disconnected, try to reconnect
    if (this.room && !this.isConnected) {
      try {
        // Room might auto-reconnect, just wait for user to be available
        await this.room.join();
        this.isConnected = true;
        this.socketId = this.room.user?.socketId || "";
        return true;
      } catch (error) {
        console.error("[ArtifactSync] Failed to reconnect:", error);
        return false;
      }
    }

    return false;
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
