/*!
 * Quick Follow Manager - Reusable follow/spectate module
 * Allows users to follow each other's actions in real-time
 */
import { waitForQuick } from "./quick";

/**
 * Event types - now primarily using CUSTOM for application-specific events
 */
export const EventTypes = {
  CUSTOM: "custom",
};

/**
 * EventManager - Broadcasts custom events to followers
 */
export class EventManager {
  constructor(room) {
    this.room = room;
    this.isCapturing = false;
  }

  /**
   * Start capturing/broadcasting events
   */
  startCapturing() {
    if (this.isCapturing) {
      console.log("[FollowManager] Already capturing events");
      return;
    }
    this.isCapturing = true;
    console.log("[FollowManager] Started event broadcasting");
  }

  /**
   * Stop capturing/broadcasting events
   */
  stopCapturing() {
    if (!this.isCapturing) {
      console.log("[EventManager] Already not capturing");
      return;
    }

    console.log("[EventManager] Stopping event broadcasting");
    this.isCapturing = false;
    console.log("[EventManager] ✅ Event broadcasting stopped");
  }

  /**
   * Broadcast a custom event to followers
   */
  broadcast(eventType, data) {
    if (!this.isCapturing) {
      console.log("[FollowManager] Not capturing, skipping broadcast");
      return;
    }

    console.log("[FollowManager] Broadcasting event:", eventType, data);
    this.room.emit("follow:event", {
      type: eventType,
      data,
      timestamp: Date.now(),
    });
  }
}

/**
 * EventExecutor - Receives and executes custom events
 */
export class EventExecutor {
  constructor() {
    console.log("[EventExecutor] Creating EventExecutor");
    this.isExecuting = false;
    this.eventHandlers = new Map();
    this.setupDefaultHandlers();
    console.log(
      "[EventExecutor] EventExecutor created with",
      this.eventHandlers.size,
      "handlers"
    );
  }

  /**
   * Start executing received events
   */
  startExecuting() {
    console.log("[FollowManager] Starting event execution");
    this.isExecuting = true;
  }

  /**
   * Stop executing received events
   */
  stopExecuting() {
    console.log("[FollowManager] Stopping event execution");
    this.isExecuting = false;
  }

  /**
   * Execute an event
   */
  execute(event) {
    if (!this.isExecuting) {
      return;
    }

    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      try {
        handler(event.data);
      } catch (error) {
        console.error("[EventExecutor] Error in handler:", error);
      }
    }
  }

  /**
   * Register a custom event handler
   */
  on(eventType, handler) {
    console.log(
      "[EventExecutor] Registering handler for event type:",
      eventType
    );
    this.eventHandlers.set(eventType, handler);
    console.log("[EventExecutor] Total handlers now:", this.eventHandlers.size);
  }

  /**
   * Remove an event handler
   */
  off(eventType) {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Setup default event handlers
   */
  setupDefaultHandlers() {
    console.log("[EventExecutor] Setting up default event handlers");

    // Custom event handler (placeholder - will be overridden by user)
    this.on(EventTypes.CUSTOM, (data) => {
      console.log("[EventExecutor] 🎨 CUSTOM event received:", data);
      console.log(
        "[EventExecutor] ⚠️ No custom event handler registered. Use manager.onCustomEvent() to handle custom events"
      );
    });

    console.log("[EventExecutor] ✅ All default handlers registered");
  }
}

/**
 * FollowManager - Main manager for follow/spectate functionality
 */
export class QuickFollowManager {
  constructor(options = {}) {
    this.roomName = options.roomName || "follow";
    this.room = options.room || null; // Accept existing room connection
    this.eventManager = null;
    this.eventExecutor = null;
    this.isInitialized = false;
    this.followingUserId = null;
    this.followingUserEmail = null; // Track email to handle multiple sockets
    this.followers = new Set();

    // Callback hooks
    this.onBroadcastInitialState = null;
  }

  /**
   * Initialize the follow manager
   * Can use an existing room connection or create its own
   */
  async init() {
    if (this.isInitialized) {
      console.log("[FollowManager] Already initialized");
      return true;
    }

    // If no room provided, create one
    if (!this.room) {
      const quick = await waitForQuick();
      console.log("[FollowManager] Quick SDK loaded, creating room");
      this.room = quick.socket.room(this.roomName);
    }

    // Create event manager and executor
    console.log("[FollowManager] Creating EventManager and EventExecutor");
    this.eventManager = new EventManager(this.room);
    this.eventExecutor = new EventExecutor();

    // Setup event listeners
    this.setupEventListeners();

    try {
      // Join room if not already connected
      if (!this.room.user) {
        console.log("[FollowManager] Joining room...");
        await this.room.join();
        console.log("[FollowManager] Successfully joined room");
      } else {
        console.log("[FollowManager] Using existing room connection");
      }

      this.isInitialized = true;

      // Update user state to indicate not following anyone
      // Only if room has a user (meaning it's connected)
      if (this.room.user) {
        this.room.updateUserState({
          following: null,
        });
        console.log("[FollowManager] Initial user state set");
      } else {
        console.log(
          "[FollowManager] Waiting for room to be fully connected before setting state"
        );
      }

      return true;
    } catch (error) {
      console.error("[FollowManager] Failed to initialize:", error);
      return false;
    }
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    // Listen for follow events from the user we're following
    this.room.on("follow:event", (data, user) => {
      // Guard: Ignore if this manager has been destroyed
      if (!this.isInitialized) {
        return;
      }
      
      // Only execute if we're following this user (check by email to handle multiple sockets)
      if (this.followingUserEmail && user.email === this.followingUserEmail) {
        this.eventExecutor.execute(data);
      }
    });

    // Listen for user state changes
    this.room.on("user:state", (prevState, nextState, user) => {
      // Guard: Ignore if this manager has been destroyed
      if (!this.isInitialized) {
        return;
      }
      
      // Check if someone is following us - need to look up the followed user by socketId
      // and compare emails since we have multiple connections per user
      const followedSocketId = nextState.following;
      const prevFollowedSocketId = prevState.following;

      // Helper to check if a socketId belongs to current user (by email)
      const isFollowingMe = (socketId) => {
        if (!socketId) return false;
        const followedUser = this.room.users.get(socketId);
        const myEmail = this.room.user?.email;
        return followedUser && myEmail && followedUser.email === myEmail;
      };

      // Check if this state change is from THIS socket connection (not just the same user/email)
      const isMyStateChange = user.socketId === this.room.user?.socketId;

      // IMPORTANT: Completely ignore my own state changes for follower/leader logic
      if (isMyStateChange) {
        return;
      }

      // If a user starts following us, add them to followers
      if (
        followedSocketId &&
        isFollowingMe(followedSocketId)
      ) {
        this.followers.add(user.socketId);

        // Auto-start capturing if we have our first follower
        if (this.followers.size === 1 && !this.eventManager.isCapturing) {
          this.eventManager.startCapturing();
          this.onLeadStart?.();
        }

        this.onFollowerAdded?.(user);

        // Broadcast current state to the new follower immediately
        // Add small delay to ensure follower's isFollowing state is updated
        setTimeout(() => {
          // Ensure we're capturing before broadcasting
          if (!this.eventManager.isCapturing) {
            this.eventManager.startCapturing();
          }

          this.onBroadcastInitialState?.();
        }, 100);
      }
      // If a user stops following us, remove them from followers
      else if (
        prevFollowedSocketId &&
        isFollowingMe(prevFollowedSocketId) &&
        (!followedSocketId || !isFollowingMe(followedSocketId))
      ) {
        this.followers.delete(user.socketId);

        // Auto-stop capturing if we have no more followers
        if (this.followers.size === 0 && this.eventManager.isCapturing) {
          this.eventManager.stopCapturing();
          this.onLeadStop?.();
        }

        this.onFollowerRemoved?.(user);
      }
    });

    // Listen for user leaving
    this.room.on("user:leave", (user) => {
      // Guard: Ignore if this manager has been destroyed
      if (!this.isInitialized) {
        return;
      }
      
      // If the user we're following leaves, stop following
      if (this.followingUserId === user.socketId) {
        this.stopFollowing();
      }

      // Remove from followers if they were following us
      if (this.followers.has(user.socketId)) {
        this.followers.delete(user.socketId);

        // Auto-stop capturing if we have no more followers
        if (this.followers.size === 0 && this.eventManager.isCapturing) {
          this.eventManager.stopCapturing();
          this.onLeadStop?.();
        }

        this.onFollowerRemoved?.(user);
      }
    });
  }

  /**
   * Start following a user
   */
  async followUser(userId) {
    if (!this.isInitialized) {
      console.warn("[FollowManager] Not initialized");
      return false;
    }

    // Stop following current user if any
    if (this.followingUserId) {
      this.stopFollowing();
    }

    // Check if user exists
    const user = this.room.users.get(userId);
    if (!user) {
      console.warn("[FollowManager] User not found:", userId);
      return false;
    }

    this.followingUserId = userId;
    this.followingUserEmail = user.email; // Store email to handle multiple sockets

    // Start executing events from the followed user
    this.eventExecutor.startExecuting();

    // Update our state to indicate we're following this user
    this.room.updateUserState({
      following: userId,
    });

    this.onFollowStart?.(user);
    return true;
  }

  /**
   * Stop following the current user
   */
  stopFollowing() {
    if (!this.followingUserId) return;

    const user = this.room.users.get(this.followingUserId);
    this.followingUserId = null;
    this.followingUserEmail = null;

    // Stop executing events
    this.eventExecutor.stopExecuting();

    // Update our state - clear following
    this.room.updateUserState({
      following: null,
    });

    this.onFollowStop?.(user);
  }

  /**
   * Start being a leader (broadcast events)
   * NOTE: This is now automatic! You become a leader when someone follows you.
   * This method is kept for backwards compatibility and manual control if needed.
   */
  startLeading() {
    console.log("[FollowManager] startLeading called (manual mode)");

    if (!this.isInitialized) {
      console.warn("[FollowManager] FollowManager not initialized");
      return false;
    }

    // Stop following anyone
    if (this.followingUserId) {
      console.log(
        "[FollowManager] Currently following someone, stopping first"
      );
      this.stopFollowing();
    }

    // Start capturing and broadcasting events
    if (!this.eventManager.isCapturing) {
      console.log("[FollowManager] Starting event capture (manual mode)");
      this.eventManager.startCapturing();
      this.onLeadStart?.();
      console.log("[FollowManager] Successfully started leading (manual mode)");
      return true;
    } else {
      console.log("[FollowManager] Already capturing events");
      return true;
    }
  }

  /**
   * Stop being a leader
   * NOTE: If you have followers, this will only work temporarily until the next event.
   * To truly stop leading, your followers need to unfollow you.
   */
  stopLeading() {
    console.log("[FollowManager] stopLeading called (manual mode)");

    if (this.followers.size > 0) {
      console.warn(
        "[FollowManager] ⚠️ You still have",
        this.followers.size,
        "followers. They won't receive events until you have actions again."
      );
    }

    if (this.eventManager.isCapturing) {
      this.eventManager.stopCapturing();
      this.onLeadStop?.();
      console.log("[FollowManager] Stopped leading (manual mode)");
    }
  }

  /**
   * Broadcast a custom event
   */
  broadcastCustomEvent(eventName, data) {
    if (!this.isInitialized || !this.eventManager.isCapturing) {
      console.warn("Not currently leading, cannot broadcast");
      return;
    }

    this.eventManager.broadcast(EventTypes.CUSTOM, {
      eventName,
      data,
    });
  }

  /**
   * Register a handler for custom events
   */
  onCustomEvent(handler) {
    this.eventExecutor.on(EventTypes.CUSTOM, (data) => {
      handler(data.eventName, data.data);
    });
  }

  /**
   * Get list of users we can follow
   */
  getAvailableUsers() {
    if (!this.room) return [];

    return Array.from(this.room.users.values()).filter(
      (user) => user.socketId !== this.room.user?.socketId
    );
  }

  /**
   * Get list of users following us
   */
  getFollowers() {
    if (!this.room) return [];

    return Array.from(this.followers)
      .map((socketId) => this.room.users.get(socketId))
      .filter(Boolean);
  }

  /**
   * Check if we're currently following someone
   */
  isFollowing() {
    return this.followingUserId !== null;
  }

  /**
   * Check if we're currently leading
   */
  isLeading() {
    return this.eventManager?.isCapturing || false;
  }

  /**
   * Get the user we're following
   */
  getFollowedUser() {
    if (!this.followingUserId) return null;
    return this.room.users.get(this.followingUserId);
  }

  /**
   * Destroy the follow manager
   */
  async destroy() {
    this.eventManager?.stopCapturing();
    this.eventExecutor?.stopExecuting();

    this.isInitialized = false;
    this.followingUserId = null;
    this.followingUserEmail = null;
    this.followers.clear();
  }

  /**
   * Callback hooks
   * @type {((user: any) => void) | null}
   */
  onFollowStart = null;

  /**
   * @type {((user: any) => void) | null}
   */
  onFollowStop = null;

  /**
   * @type {(() => void) | null}
   */
  onLeadStart = null;

  /**
   * @type {(() => void) | null}
   */
  onLeadStop = null;

  /**
   * @type {((user: any) => void) | null}
   */
  onFollowerAdded = null;

  /**
   * @type {((user: any) => void) | null}
   */
  onFollowerRemoved = null;
}

export default QuickFollowManager;
