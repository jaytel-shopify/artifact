/*!
 * Quick Follow Manager - Reusable follow/spectate module
 * Allows users to follow each other's actions in real-time
 */
import { waitForQuick } from "./quick";

/**
 * Event types that can be captured and broadcasted
 */
export const EventTypes = {
  SCROLL: "scroll",
  CLICK: "click",
  NAVIGATE: "navigate",
  INPUT: "input",
  FOCUS: "focus",
  HOVER: "hover",
  RESIZE: "resize",
  CUSTOM: "custom",
};

/**
 * EventManager - Captures local events and broadcasts them
 */
export class EventManager {
  constructor(room, options = {}) {
    this.room = room;
    this.isCapturing = false;
    this.captureHandlers = new Map();
    this.throttleTimers = new Map();
    this.options = {
      throttleDelay: options.throttleDelay || 50,
      captureScroll: options.captureScroll !== false,
      captureClick: options.captureClick !== false,
      captureInput: options.captureInput !== false,
      captureHover: options.captureHover || false,
      captureFocus: options.captureFocus || false,
      captureResize: options.captureResize || false,
      ...options,
    };
  }

  /**
   * Start capturing events
   */
  startCapturing() {
    if (this.isCapturing) {
      console.log("[FollowManager] Already capturing events");
      return;
    }
    this.isCapturing = true;
    console.log(
      "[FollowManager] Starting event capture with options:",
      this.options
    );

    // Note: Scroll is now handled via custom events in useFollowSync
    if (this.options.captureClick) {
      console.log("[FollowManager] Setting up click capture");
      this.setupClickCapture();
    }
    if (this.options.captureInput) {
      console.log("[FollowManager] Setting up input capture");
      this.setupInputCapture();
    }
    if (this.options.captureHover) {
      this.setupHoverCapture();
    }
    if (this.options.captureFocus) {
      this.setupFocusCapture();
    }
    if (this.options.captureResize) {
      this.setupResizeCapture();
    }
  }

  /**
   * Stop capturing events
   */
  stopCapturing() {
    if (!this.isCapturing) {
      console.log("[EventManager] Already not capturing");
      return;
    }

    console.log("[EventManager] Stopping event capture");
    this.isCapturing = false;

    // Remove all event listeners
    this.captureHandlers.forEach((handler, key) => {
      const [eventType, target] = key.split(":");
      console.log(
        "[EventManager] Removing listener:",
        eventType,
        "from",
        target
      );
      if (target === "window") {
        window.removeEventListener(eventType, handler);
      } else if (target === "document") {
        document.removeEventListener(eventType, handler);
      }
    });

    console.log(
      "[EventManager] Cleared",
      this.captureHandlers.size,
      "handlers"
    );
    this.captureHandlers.clear();
    this.throttleTimers.forEach((timer) => clearTimeout(timer));
    this.throttleTimers.clear();
    console.log("[EventManager] ✅ Event capture stopped");
  }

  /**
   * Broadcast an event to followers
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

  /**
   * Throttle function execution
   */
  throttle(key, fn, delay) {
    if (this.throttleTimers.has(key)) return;

    fn();
    const timer = setTimeout(() => {
      this.throttleTimers.delete(key);
    }, delay);
    this.throttleTimers.set(key, timer);
  }

  /**
   * Setup scroll event capture
   */
  setupScrollCapture() {
    const handler = () => {
      this.throttle(
        "scroll",
        () => {
          const data = {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
          };
          this.broadcast(EventTypes.SCROLL, data);
        },
        this.options.throttleDelay
      );
    };

    window.addEventListener("scroll", handler, { passive: true });
    this.captureHandlers.set("scroll:window", handler);
  }

  /**
   * Setup click event capture
   */
  setupClickCapture() {
    const handler = (e) => {
      // Get the most specific selector for the clicked element
      const selector = this.getElementSelector(e.target);

      const data = {
        selector,
        x: e.clientX,
        y: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        button: e.button,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };

      this.broadcast(EventTypes.CLICK, data);
    };

    document.addEventListener("click", handler, true);
    this.captureHandlers.set("click:document", handler);
  }

  /**
   * Setup input event capture
   */
  setupInputCapture() {
    const handler = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        const selector = this.getElementSelector(e.target);

        this.throttle(
          `input:${selector}`,
          () => {
            const data = {
              selector,
              value: e.target.value || e.target.textContent,
              selectionStart: e.target.selectionStart,
              selectionEnd: e.target.selectionEnd,
            };
            this.broadcast(EventTypes.INPUT, data);
          },
          this.options.throttleDelay
        );
      }
    };

    document.addEventListener("input", handler, true);
    this.captureHandlers.set("input:document", handler);
  }

  /**
   * Setup hover event capture
   */
  setupHoverCapture() {
    const handler = (e) => {
      this.throttle(
        "hover",
        () => {
          const selector = this.getElementSelector(e.target);
          const data = {
            selector,
            x: e.clientX,
            y: e.clientY,
          };
          this.broadcast(EventTypes.HOVER, data);
        },
        this.options.throttleDelay
      );
    };

    document.addEventListener("mouseover", handler, true);
    this.captureHandlers.set("mouseover:document", handler);
  }

  /**
   * Setup focus event capture
   */
  setupFocusCapture() {
    const handler = (e) => {
      const selector = this.getElementSelector(e.target);
      const data = { selector };
      this.broadcast(EventTypes.FOCUS, data);
    };

    document.addEventListener("focus", handler, true);
    this.captureHandlers.set("focus:document", handler);
  }

  /**
   * Setup resize event capture
   */
  setupResizeCapture() {
    const handler = () => {
      this.throttle(
        "resize",
        () => {
          const data = {
            width: window.innerWidth,
            height: window.innerHeight,
          };
          this.broadcast(EventTypes.RESIZE, data);
        },
        this.options.throttleDelay
      );
    };

    window.addEventListener("resize", handler);
    this.captureHandlers.set("resize:window", handler);
  }

  /**
   * Get a CSS selector for an element
   */
  getElementSelector(element) {
    if (!element || element === document.documentElement) {
      return "html";
    }

    // Use ID if available (escape special characters)
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    // Try to find a simpler, more reliable selector first
    // Check for data attributes
    if (element.dataset && Object.keys(element.dataset).length > 0) {
      const dataAttr = Object.keys(element.dataset)[0];
      const dataValue = element.dataset[dataAttr];
      const selector = `[data-${dataAttr}="${dataValue}"]`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Build selector from path with escaped classes
    const path = [];
    let currentElement = element;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let selector = currentElement.nodeName.toLowerCase();

      // Add nth-child for uniqueness
      if (currentElement.parentNode) {
        const siblings = Array.from(currentElement.parentNode.children);
        const index = siblings.indexOf(currentElement);
        selector += `:nth-child(${index + 1})`;
      }

      path.unshift(selector);
      currentElement = currentElement.parentNode;

      // Stop at a unique identifier or after a few levels
      if (path.length > 5) break;
    }

    return path.join(" > ");
  }
}

/**
 * EventExecutor - Receives events and executes them
 */
export class EventExecutor {
  constructor(options = {}) {
    console.log(
      "[EventExecutor] Creating EventExecutor with options:",
      options
    );
    this.isExecuting = false;
    this.eventHandlers = new Map();
    this.options = {
      smoothScroll: options.smoothScroll !== false,
      highlightClicks: options.highlightClicks !== false,
      highlightDuration: options.highlightDuration || 1000,
      ...options,
    };
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

    // Note: Scroll is now handled via custom events in useFollowSync
    // No longer using window scroll events

    // Click handler
    this.on(EventTypes.CLICK, (data) => {
      console.log("[EventExecutor] 🖱️ CLICK handler executing:", data);
      try {
        const element = document.querySelector(data.selector);
        console.log("[EventExecutor] Found element:", element);
        if (element) {
          // Highlight the clicked element
          if (this.options.highlightClicks) {
            console.log("[EventExecutor] Highlighting element");
            this.highlightElement(element);
          }

          // Trigger the click
          console.log("[EventExecutor] Triggering click on element");
          element.click();
          console.log("[EventExecutor] ✅ Click complete");
        } else {
          console.warn(
            "[EventExecutor] ⚠️ Element not found for selector:",
            data.selector
          );
        }
      } catch (error) {
        console.error(
          "[EventExecutor] ❌ Invalid selector or could not execute click:",
          error.message,
          "\nSelector was:",
          data.selector
        );
      }
    });

    // Input handler
    this.on(EventTypes.INPUT, (data) => {
      console.log("[EventExecutor] ⌨️ INPUT handler executing:", data);
      try {
        const element = document.querySelector(data.selector);
        console.log("[EventExecutor] Found input element:", element);
        if (element) {
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            console.log("[EventExecutor] Setting input value:", data.value);
            element.value = data.value;
            element.setSelectionRange(data.selectionStart, data.selectionEnd);
          } else if (element.isContentEditable) {
            console.log(
              "[EventExecutor] Setting contentEditable text:",
              data.value
            );
            element.textContent = data.value;
          }

          // Dispatch input event
          console.log("[EventExecutor] Dispatching input event");
          element.dispatchEvent(new Event("input", { bubbles: true }));
          console.log("[EventExecutor] ✅ Input complete");
        } else {
          console.warn(
            "[EventExecutor] ⚠️ Input element not found for selector:",
            data.selector
          );
        }
      } catch (error) {
        console.error(
          "[EventExecutor] ❌ Invalid selector or could not execute input:",
          error.message,
          "\nSelector was:",
          data.selector
        );
      }
    });

    // Focus handler
    this.on(EventTypes.FOCUS, (data) => {
      console.log("[EventExecutor] 🎯 FOCUS handler executing:", data);
      try {
        const element = document.querySelector(data.selector);
        console.log("[EventExecutor] Found focus element:", element);
        if (element) {
          console.log("[EventExecutor] Focusing element");
          element.focus();
          console.log("[EventExecutor] ✅ Focus complete");
        } else {
          console.warn(
            "[EventExecutor] ⚠️ Focus element not found for selector:",
            data.selector
          );
        }
      } catch (error) {
        console.error(
          "[EventExecutor] ❌ Invalid selector or could not execute focus:",
          error.message,
          "\nSelector was:",
          data.selector
        );
      }
    });

    // Hover handler
    this.on(EventTypes.HOVER, (data) => {
      console.log("[EventExecutor] 👆 HOVER handler executing:", data);
      try {
        const element = document.querySelector(data.selector);
        console.log("[EventExecutor] Found hover element:", element);
        if (element) {
          // Dispatch mouseover event
          const event = new MouseEvent("mouseover", {
            bubbles: true,
            clientX: data.x,
            clientY: data.y,
          });
          console.log("[EventExecutor] Dispatching mouseover event");
          element.dispatchEvent(event);
          console.log("[EventExecutor] ✅ Hover complete");
        } else {
          console.warn(
            "[EventExecutor] ⚠️ Hover element not found for selector:",
            data.selector
          );
        }
      } catch (error) {
        console.error(
          "[EventExecutor] ❌ Invalid selector or could not execute hover:",
          error.message,
          "\nSelector was:",
          data.selector
        );
      }
    });

    // Resize handler
    this.on(EventTypes.RESIZE, (data) => {
      console.log("[EventExecutor] 📏 RESIZE handler executing:", data);
      // Note: Can't actually resize the window in most browsers due to security
      // This is here for custom handling
      console.log(
        "[EventExecutor] Resize event received (cannot resize window):",
        data
      );
    });

    // Custom event handler (placeholder - will be overridden by user)
    this.on(EventTypes.CUSTOM, (data) => {
      console.log("[EventExecutor] 🎨 CUSTOM event received:", data);
      console.log(
        "[EventExecutor] ⚠️ No custom event handler registered. Use manager.onCustomEvent() to handle custom events"
      );
    });

    // Navigate handler
    this.on(EventTypes.NAVIGATE, (data) => {
      console.log("[EventExecutor] 🧭 NAVIGATE handler executing:", data);
      console.log(
        "[EventExecutor] ⚠️ No navigate handler registered. Use manager.setupNavigateHandler() to handle navigation"
      );
    });

    console.log("[EventExecutor] ✅ All default handlers registered");
  }

  /**
   * Highlight an element temporarily
   */
  highlightElement(element) {
    const highlight = document.createElement("div");
    highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 3px solid #3b82f6;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.1);
      z-index: 10001;
      animation: follow-highlight 0.6s ease-out;
    `;

    // Add animation keyframes
    if (!document.getElementById("follow-highlight-style")) {
      const style = document.createElement("style");
      style.id = "follow-highlight-style";
      style.textContent = `
        @keyframes follow-highlight {
          0% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const rect = element.getBoundingClientRect();
    highlight.style.left = rect.left + window.scrollX + "px";
    highlight.style.top = rect.top + window.scrollY + "px";
    highlight.style.width = rect.width + "px";
    highlight.style.height = rect.height + "px";

    document.body.appendChild(highlight);

    setTimeout(() => {
      highlight.remove();
    }, this.options.highlightDuration);
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
    this.options = options;
  }

  /**
   * Initialize the follow manager
   * Can use an existing room connection or create its own
   */
  async init() {
    const usingExistingRoom = !!this.room;
    console.log(
      "[FollowManager] Initializing follow manager",
      usingExistingRoom ? "(using existing room)" : `with room: ${this.roomName}`
    );

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
    this.eventManager = new EventManager(this.room, this.options);
    this.eventExecutor = new EventExecutor(this.options);

    // Setup event listeners
    this.setupEventListeners();

    try {
      // Only join room if we created it ourselves
      if (!usingExistingRoom) {
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
        console.log("[FollowManager] Waiting for room to be fully connected before setting state");
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
    console.log("[FollowManager] Setting up socket event listeners");

    // Listen for follow events from the user we're following
    this.room.on("follow:event", (data, user) => {
      // Only execute if we're following this user (check by email to handle multiple sockets)
      if (this.followingUserEmail && user.email === this.followingUserEmail) {
        this.eventExecutor.execute(data);
      }
    });

    // Listen for user state changes
    this.room.on("user:state", (prevState, nextState, user) => {
      console.log(
        "[FollowManager] User state changed:",
        user.socketId,
        "prev:",
        prevState,
        "next:",
        nextState
      );

      // Check if someone is following us - need to look up the followed user by socketId
      // and compare emails since we have multiple connections per user
      const followedSocketId = nextState.following;
      const prevFollowedSocketId = prevState.following;

      // Helper to check if a socketId belongs to current user (by email)
      const isFollowingMe = (socketId) => {
        if (!socketId) return false;
        const followedUser = this.room.users.get(socketId);
        const myEmail = this.room.user?.email;
        console.log(
          "[FollowManager] Checking if",
          socketId,
          "is me. Their email:",
          followedUser?.email,
          "My email:",
          myEmail
        );
        return followedUser && myEmail && followedUser.email === myEmail;
      };

      // Check if this state change is from THIS socket connection (not just the same user/email)
      const isMyStateChange = user.socketId === this.room.user?.socketId;
      console.log(
        "[FollowManager] Is my state change?",
        isMyStateChange,
        "User socketId:",
        user.socketId,
        "My socketId:",
        this.room.user?.socketId
      );

      // If a user starts following us, add them to followers
      // BUT: don't add ourselves if we're the one who changed state (we're the follower, not the leader)
      if (
        followedSocketId &&
        isFollowingMe(followedSocketId) &&
        !isMyStateChange
      ) {
        console.log(
          "[FollowManager] User started following us:",
          user.name || user.email
        );
        this.followers.add(user.socketId);

        // Auto-start capturing if we have our first follower
        if (this.followers.size === 1 && !this.eventManager.isCapturing) {
          console.log(
            "[FollowManager] 🎯 First follower! Auto-starting event capture"
          );
          this.eventManager.startCapturing();
          this.onLeadStart?.();
        }

        this.onFollowerAdded?.(user);
      }
      // If a user stops following us, remove them from followers
      // BUT: don't process if this is our own state change
      else if (
        !isMyStateChange &&
        prevFollowedSocketId &&
        isFollowingMe(prevFollowedSocketId) &&
        (!followedSocketId || !isFollowingMe(followedSocketId))
      ) {
        console.log(
          "[FollowManager] User stopped following us:",
          user.name || user.email
        );
        this.followers.delete(user.socketId);

        // Auto-stop capturing if we have no more followers
        if (this.followers.size === 0 && this.eventManager.isCapturing) {
          console.log(
            "[FollowManager] 🛑 No more followers. Auto-stopping event capture"
          );
          this.eventManager.stopCapturing();
          this.onLeadStop?.();
        }

        this.onFollowerRemoved?.(user);
      }
    });

    // Listen for user leaving
    this.room.on("user:leave", (user) => {
      console.log("[FollowManager] User left:", user.socketId);

      // If the user we're following leaves, stop following
      if (this.followingUserId === user.socketId) {
        console.log("[FollowManager] The user we were following left");
        this.stopFollowing();
      }

      // Remove from followers if they were following us
      if (this.followers.has(user.socketId)) {
        console.log("[FollowManager] Follower left, removing from list");
        this.followers.delete(user.socketId);

        // Auto-stop capturing if we have no more followers
        if (this.followers.size === 0 && this.eventManager.isCapturing) {
          console.log(
            "[FollowManager] 🛑 No more followers. Auto-stopping event capture"
          );
          this.eventManager.stopCapturing();
          this.onLeadStop?.();
        }
      }
    });
  }

  /**
   * Start following a user
   */
  async followUser(userId) {
    console.log("[FollowManager] followUser called with userId:", userId);

    if (!this.isInitialized) {
      console.warn("[FollowManager] FollowManager not initialized");
      return false;
    }

    // Stop following current user if any
    if (this.followingUserId) {
      console.log("[FollowManager] Already following someone, stopping first");
      this.stopFollowing();
    }

    // Check if user exists
    const user = this.room.users.get(userId);
    if (!user) {
      console.warn("[FollowManager] User not found:", userId);
      return false;
    }

    console.log(
      "[FollowManager] Starting to follow user:",
      user.name || user.email
    );
    this.followingUserId = userId;
    this.followingUserEmail = user.email; // Store email to handle multiple sockets

    // Start executing events from the followed user
    console.log("[FollowManager] Starting event execution");
    this.eventExecutor.startExecuting();

    // Update our state to indicate we're following this user
    console.log("[FollowManager] Updating user state to following:", userId);
    this.room.updateUserState({
      following: userId,
    });

    this.onFollowStart?.(user);
    console.log("[FollowManager] Successfully started following");
    return true;
  }

  /**
   * Stop following the current user
   */
  stopFollowing() {
    if (!this.followingUserId) return;

    console.log(
      "[FollowManager] Stopping follow of user:",
      this.followingUserId
    );
    const user = this.room.users.get(this.followingUserId);
    this.followingUserId = null;
    this.followingUserEmail = null;

    // Stop executing events
    this.eventExecutor.stopExecuting();

    // Update our state - clear following
    this.room.updateUserState({
      following: null,
    });

    console.log("[FollowManager] Successfully stopped following");
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
   * Navigate to a URL (will be broadcast if leading)
   */
  navigateTo(url) {
    if (this.isLeading()) {
      this.eventManager.broadcast(EventTypes.NAVIGATE, { url });
    }
    window.location.href = url;
  }

  /**
   * Setup navigate handler
   */
  setupNavigateHandler(handler) {
    this.eventExecutor.on(EventTypes.NAVIGATE, (data) => {
      handler(data.url);
    });
  }

  /**
   * Destroy the follow manager
   */
  async destroy() {
    this.eventManager?.stopCapturing();
    this.eventExecutor?.stopExecuting();

    if (this.room) {
      await this.room.leave();
    }

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
