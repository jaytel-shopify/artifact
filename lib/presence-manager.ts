/*!
 * Presence Manager - User presence and collaboration
 * Manages real-time user presence tracking via WebSockets
 */
import { waitForQuick } from "./quick";

export class PresenceManager {
  private room: any = null;
  private projectId: string;
  private pageId: string;
  private isConnected = false;
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

      this.setupEventHandlers();
      await this.room.join();
      this.isConnected = true;
      this.socketId = this.room.user?.socketId || "";

      // Update user state immediately with full profile info (including slack avatar)
      // This will trigger user:state events for other users, causing them to re-render
      this.room.updateUserState({
        slackImageUrl: user.slackImageUrl,
        slackHandle: user.slackHandle,
        slackId: user.slackId,
        fullName: user.fullName,
        title: user.title,
      });

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
    this.room.on("connect", () => {
      this.isConnected = true;
      this.lastUserCount = undefined;
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 100);
      }
    });

    this.room.on("disconnect", () => {
      this.isConnected = false;
    });

    this.room.on("user:join", () => {
      this.lastUserCount = undefined;
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 50);
      }
    });

    this.room.on("user:leave", () => {
      this.lastUserCount = undefined;
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
        }, 50);
      }
    });

    this.room.on("user:state", () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("artifactSyncUserChange"));
      }
    });
  }

  getRoom(): any {
    return this.room;
  }

  getUsersCount(): number {
    if (!this.room || !this.room.users) return 0;
    return this.room.users.size;
  }

  getUsers(): any[] {
    if (!this.room || !this.room.users) {
      this.lastUserCount = undefined;
      return [];
    }

    const allUsers = Array.from(this.room.users.values());
    const currentSocketId = this.room.user?.socketId;

    // Merge user base data with their state (which contains slack profile info)
    const enrichedUsers = allUsers
      .filter((user: any) => user.socketId !== currentSocketId)
      .map((user: any) => ({
        socketId: user.socketId,
        name: user.name,
        email: user.email,
        slackImageUrl: user.state?.slackImageUrl,
        slackHandle: user.state?.slackHandle,
        slackId: user.state?.slackId,
        fullName: user.state?.fullName || user.name,
        title: user.state?.title || user.title,
      }));

    const currentCount = enrichedUsers.length;
    if (
      this.lastUserCount === undefined ||
      this.lastUserCount !== currentCount
    ) {
      this.lastUserCount = currentCount;
    }

    // Return new array reference each time to ensure React detects changes
    return enrichedUsers;
  }

  private lastUserCount?: number;

  isReady(): boolean {
    return this.isConnected && this.room && this.room.user;
  }

  // Used when reusing an existing manager after navigation
  async ensureConnected(): Promise<boolean> {
    if (this.isConnected && this.room?.user) {
      return true;
    }

    if (this.room && !this.isConnected) {
      try {
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

  async destroy() {
    if (this.room) {
      try {
        await this.room.leave();
      } catch (error) {
        console.error("[ArtifactSync] Error leaving room:", error);
      }
    }
    this.isConnected = false;
    this.room = null;
  }
}
