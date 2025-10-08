/*!
 * Quick Multiplayer Cursors - Reusable multiplayer cursor module
 * Provides real-time cursor synchronization across Quick sites
 */
import { waitForQuick } from "./quick";

export class QuickMultiplayerCursors {
  constructor(s = {}) {
    ((this.roomName = s.roomName || "cursors"),
      (this.container = s.container || document.body),
      (this.inactivityTimeout = s.inactivityTimeout || 5e3),
      (this.showUserList = s.showUserList || !1),
      (this.cursorImage = s.cursorImage || null),
      (this.customStyles = s.styles || {}),
      (this.room = null),
      (this.cursorElements = new Map()),
      (this.lastCursorMoveAt = new Map()),
      (this.overlayElement = null),
      (this.userListElement = null),
      (this.pruneTimer = null),
      (this.isConnected = !1),
      (this.lastMousePosition = {
        x: 0,
        y: 0,
      }),
      (this.handleMouseMove = this.handleMouseMove.bind(this)),
      (this.handleScroll = this.handleScroll.bind(this)),
      (this.updateCursorPosition = this.updateCursorPosition.bind(this)),
      (this.pruneCursors = this.pruneCursors.bind(this)));
    this._s = s;
  }
  async init() {
    const quick = await waitForQuick();

    (this.createOverlay(),
      this.addStyles(),
      this.showUserList && this.createUserList(),
      (this.room = quick.socket.room(this.roomName)),
      this.setupEventHandlers());
    try {
      return (
        await this.room.join(),
        (this.isConnected = !0),
        this.room.users.forEach((s) => {
          s.socketId !== this.room.user?.socketId &&
            this.updateRemoteCursor(s, s.state);
        }),
        this.startPruneTimer(),
        this.setupLocalCursorTracking(),
        !0
      );
    } catch (s) {
      return (
        console.error("QuickMultiplayerCursors: Failed to join room", s),
        !1
      );
    }
  }
  createOverlay() {
    ((this.overlayElement = document.createElement("div")),
      (this.overlayElement.className = "qmc-overlay"),
      (this.overlayElement.style.cssText =
        "\n        position: fixed;\n        inset: 0;\n        pointer-events: none;\n        z-index: 10000;\n      "),
      document.body.appendChild(this.overlayElement));
  }
  addStyles() {
    if (document.getElementById("qmc-styles")) return;
    const s = document.createElement("style");
    ((s.id = "qmc-styles"),
      (s.textContent = `\n        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');\n        \n        .qmc-cursor {\n          position: absolute;\n          transform: none;\n          pointer-events: none;\n          display: flex;\n          align-items: center;\n          gap: 6px;\n          transition: opacity 0.3s ease;\n        }\n        \n        .qmc-cursor-pointer {\n          width: ${this.customStyles.pointerSize || "20px"};\n          height: ${this.customStyles.pointerSize || "20px"};\n          margin-left: -10px;\n          margin-top: -10px;\n        }\n        \n        .qmc-cursor-dot {\n          width: 10px;\n          height: 10px;\n          border-radius: 50%;\n          border: 2px solid ${this.customStyles.dotBorder || "#000"};\n          background: ${this.customStyles.dotColor || "#fff"};\n          box-shadow: 3px 3px 0 rgba(0,0,0,1);\n        }\n        \n        .qmc-cursor-label {\n          display: inline-flex;\n          align-items: center;\n          gap: 6px;\n          background: ${this.customStyles.labelBg || "#111"};\n          color: ${this.customStyles.labelColor || "#fff"};\n          border: 2px solid ${this.customStyles.labelBorder || "#000"};\n          border-radius: 999px;\n          padding: 2px 6px;\n          font-size: 11px;\n          font-family: 'JetBrains Mono', monospace;\n          font-weight: 700;\n          box-shadow: 3px 3px 0 rgba(0,0,0,1);\n          white-space: nowrap;\n        }\n        \n        .qmc-cursor-label img {\n          width: 14px;\n          height: 14px;\n          border-radius: 50%;\n          border: 1px solid rgba(255,255,255,0.3);\n        }\n        \n        .qmc-user-list {\n          position: fixed;\n          top: 20px;\n          right: 20px;\n          background: white;\n          border: 3px solid #000;\n          border-radius: 8px;\n          padding: 12px;\n          box-shadow: 6px 6px 0 rgba(0,0,0,1);\n          z-index: 9999;\n          min-width: 200px;\n          font-family: 'JetBrains Mono', monospace;\n        }\n        \n        .qmc-user-list-title {\n          font-weight: 700;\n          font-size: 13px;\n          margin-bottom: 8px;\n        }\n        \n        .qmc-user-item {\n          display: flex;\n          align-items: center;\n          gap: 8px;\n          padding: 4px 0;\n          font-size: 12px;\n        }\n        \n        .qmc-user-indicator {\n          width: 10px;\n          height: 10px;\n          border-radius: 50%;\n          border: 2px solid #000;\n          background: #10b981;\n          box-shadow: 2px 2px 0 rgba(0,0,0,1);\n        }\n      `),
      document.head.appendChild(s));
  }
  createUserList() {
    ((this.userListElement = document.createElement("div")),
      (this.userListElement.className = "qmc-user-list"),
      (this.userListElement.innerHTML =
        '\n        <div class="qmc-user-list-title">Online Users (0)</div>\n        <div class="qmc-user-list-content"></div>\n      '),
      document.body.appendChild(this.userListElement));
  }
  updateUserList() {
    if (!this.userListElement) return;
    const s = Array.from(this.room.users.values()),
      t = this.userListElement.querySelector(".qmc-user-list-title"),
      n = this.userListElement.querySelector(".qmc-user-list-content");
    ((t.textContent = `Online Users (${s.length})`),
      (n.innerHTML = s
        .map(
          (s) =>
            `\n          <div class="qmc-user-item">\n            <div class="qmc-user-indicator"></div>\n            <span>${s.name || s.email || "Anonymous"}${s.socketId === this.room.user?.socketId ? " (You)" : ""}</span>\n          </div>\n        `
        )
        .join("")));
  }
  setupEventHandlers() {
    (this.room.on("connect", () => {
      ((this.isConnected = !0),
        this.startPruneTimer(),
        this.showUserList && this.updateUserList());
    }),
      this.room.on("disconnect", () => {
        ((this.isConnected = !1),
          this.stopPruneTimer(),
          this.clearAllCursors(),
          this.showUserList && this.updateUserList());
      }),
      this.room.on("user:join", (s) => {
        this.showUserList && this.updateUserList();
      }),
      this.room.on("user:leave", (s) => {
        (this.removeCursor(s), this.showUserList && this.updateUserList());
      }),
      this.room.on("user:state", (s, t, n) => {
        this.updateRemoteCursor(n, t);
      }));
  }
  setupLocalCursorTracking() {
    let t = null,
      n = null;
    (window.addEventListener("mousemove", (s) => {
      ((this.lastMousePosition = {
        x: s.clientX,
        y: s.clientY,
      }),
        t ||
          (t = requestAnimationFrame(() => {
            ((t = null), this.updateCursorPosition());
          })));
    }),
      window.addEventListener(
        "scroll",
        () => {
          n ||
            (n = requestAnimationFrame(() => {
              ((n = null), this.updateCursorPosition());
            }));
        },
        {
          passive: !0,
        }
      ));
  }
  updateCursorPosition() {
    if (!this.isConnected) return;
    const s = this.container.getBoundingClientRect(),
      t = this.lastMousePosition.x - s.left,
      n = this.lastMousePosition.y - s.top,
      i = Math.max(0, Math.min(1, t / Math.max(1, s.width))),
      e = Math.max(0, Math.min(1, n / Math.max(1, s.height)));
    this.room.updateUserState({
      cursor: {
        fx: i,
        fy: e,
      },
    });
  }
  ensureCursorElement(s) {
    if (s.socketId === this.room.user?.socketId) return null;
    let t = this.cursorElements.get(s.socketId);
    if (!t) {
      ((t = document.createElement("div")), (t.className = "qmc-cursor"));
      const n = (s.name || s.email || "Anonymous").split("@")[0];
      (this.cursorImage
        ? (t.innerHTML = `\n            <img class="qmc-cursor-pointer" src="${this.cursorImage}" alt="" />\n            <span class="qmc-cursor-label">\n              ${s.slackImageUrl ? `<img src="${s.slackImageUrl}" alt="" />` : ""}\n              ${n}\n            </span>\n          `)
        : (t.innerHTML = `\n            <div class="qmc-cursor-dot"></div>\n            <span class="qmc-cursor-label">\n              ${s.slackImageUrl ? `<img src="${s.slackImageUrl}" alt="" />` : ""}\n              ${n}\n            </span>\n          `),
        this.overlayElement.appendChild(t),
        this.cursorElements.set(s.socketId, t),
        (t.style.display = "none"));
    }
    return t;
  }
  updateRemoteCursor(s, t) {
    const n = this.ensureCursorElement(s);
    if (!n) return;
    const i = t?.cursor?.fx,
      e = t?.cursor?.fy;
    if ("number" != typeof i || "number" != typeof e) return;
    this.lastCursorMoveAt.set(s.socketId, Date.now());
    const r = this.container.getBoundingClientRect(),
      o = r.left + i * r.width,
      h = r.top + e * r.height;
    ((n.style.display = "flex"),
      (n.style.left = o + "px"),
      (n.style.top = h + "px"));
  }
  removeCursor(s) {
    const t = this.cursorElements.get(s.socketId);
    (t && (t.remove(), this.cursorElements.delete(s.socketId)),
      this.lastCursorMoveAt.delete(s.socketId));
  }
  clearAllCursors() {
    (this.cursorElements.forEach((s) => s.remove()),
      this.cursorElements.clear(),
      this.lastCursorMoveAt.clear());
  }
  startPruneTimer() {
    this.pruneTimer ||
      (this.pruneTimer = setInterval(() => {
        const s = Date.now();
        this.cursorElements.forEach((t, n) => {
          const i = this.lastCursorMoveAt.get(n) || 0;
          s - i > this.inactivityTimeout
            ? (t.style.opacity = "0")
            : (t.style.opacity = "1");
        });
      }, 500));
  }
  stopPruneTimer() {
    this.pruneTimer &&
      (clearInterval(this.pruneTimer), (this.pruneTimer = null));
  }
  async destroy() {
    (window.removeEventListener("mousemove", this.handleMouseMove),
      window.removeEventListener("scroll", this.handleScroll),
      this.stopPruneTimer(),
      this.room && (await this.room.leave()),
      this.clearAllCursors(),
      this.overlayElement && this.overlayElement.remove(),
      this.userListElement && this.userListElement.remove());
  }
  handleMouseMove() {}
  handleScroll() {}
  pruneCursors() {}
}
