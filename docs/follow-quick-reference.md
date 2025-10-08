# Follow Feature - Quick Reference Card

## 🚀 Quick Start (3 Steps)

```tsx
// 1. Add provider to layout
import QuickFollowProvider from "@/components/QuickFollowProvider";
import FollowControlPanel from "@/components/follow/FollowControlPanel";

<QuickFollowProvider>
  {children}
  <FollowControlPanel />
</QuickFollowProvider>;

// 2. Use the hook
import { useFollow } from "@/components/QuickFollowProvider";
const { followUser, startLeading, isFollowing } = useFollow();

// 3. Test at /follow-demo
```

## 📋 useFollow() Hook API

```tsx
const {
  // State
  isInitialized, // boolean - Ready to use
  isFollowing, // boolean - Currently following
  isLeading, // boolean - Currently broadcasting
  followedUser, // User | null - Who you're following
  followers, // User[] - Who's following you
  availableUsers, // User[] - Users you can follow

  // Actions
  followUser, // (userId: string) => Promise<boolean>
  stopFollowing, // () => void
  startLeading, // () => boolean
  stopLeading, // () => void
  broadcastCustomEvent, // (name: string, data: any) => void

  // Instance
  followManager, // QuickFollowManager | null
} = useFollow();
```

## 🎯 Common Patterns

### Follow a User

```tsx
const { availableUsers, followUser } = useFollow();
await followUser(availableUsers[0].socketId);
```

### Start Leading

```tsx
const { startLeading } = useFollow();
startLeading(); // Your actions now broadcast
```

### Custom Events

```tsx
// Leader broadcasts
broadcastCustomEvent("action-name", { foo: "bar" });

// Follower receives
followManager?.onCustomEvent((name, data) => {
  if (name === "action-name") {
    handleAction(data);
  }
});
```

### Navigation

```tsx
// Setup handler
followManager?.setupNavigateHandler((url) => {
  router.push(url);
});

// Navigate (broadcasts if leading)
followManager?.navigateTo("/new-page");
```

## ⚙️ Configuration

```tsx
<QuickFollowProvider
  roomName="my-room" // Default: "follow"
  autoInit={true} // Default: true
  captureOptions={{
    captureScroll: true, // Default: true
    captureClick: true, // Default: true
    captureInput: true, // Default: true
    captureHover: false, // Default: false
    captureFocus: false, // Default: false
    captureResize: false, // Default: false
    throttleDelay: 50, // Default: 50ms
  }}
  executeOptions={{
    smoothScroll: true, // Default: true
    highlightClicks: true, // Default: true
    highlightDuration: 1000, // Default: 1000ms
  }}
>
  {children}
</QuickFollowProvider>
```

## 🎭 Event Types

| Type       | Description   | Default |
| ---------- | ------------- | ------- |
| `SCROLL`   | Window scroll | ✅ On   |
| `CLICK`    | Mouse clicks  | ✅ On   |
| `INPUT`    | Text input    | ✅ On   |
| `HOVER`    | Mouse hover   | ❌ Off  |
| `FOCUS`    | Element focus | ❌ Off  |
| `RESIZE`   | Window resize | ❌ Off  |
| `NAVIGATE` | Page nav      | Custom  |
| `CUSTOM`   | Your events   | Custom  |

## 💡 Direct Manager Usage

```tsx
import { QuickFollowManager } from "@/lib/followManager";

const manager = new QuickFollowManager({ roomName: "room" });

// Callbacks
manager.onFollowStart = (user) => console.log("Following", user);
manager.onFollowerAdded = (user) => console.log("New follower", user);

// Initialize
await manager.init();

// Follow
await manager.followUser(userId);
manager.stopFollowing();

// Lead
manager.startLeading();
manager.stopLeading();

// Custom events
manager.broadcastCustomEvent("event", data);
manager.onCustomEvent((name, data) => {
  /* handle */
});

// Cleanup
await manager.destroy();
```

## 🎨 UI Customization

```tsx
// Hide default panel, build your own
<QuickFollowProvider>
  {children}
  {/* <FollowControlPanel /> - Don't render */}
  <CustomFollowUI />
</QuickFollowProvider>;

function CustomFollowUI() {
  const { isFollowing, followedUser, stopFollowing } = useFollow();
  return isFollowing ? (
    <div>
      Following {followedUser.name}
      <button onClick={stopFollowing}>Stop</button>
    </div>
  ) : null;
}
```

## 📊 User Object

```tsx
interface User {
  socketId: string; // Unique ID for this session
  name: string; // Display name
  email: string; // Email address
  slackImageUrl?: string; // Avatar
  slackHandle?: string; // Slack username
  slackId?: string; // Slack ID
  title?: string; // Job title
}
```

## 🐛 Debugging

```tsx
// Check status
console.log("Initialized:", isInitialized);
console.log("Following:", isFollowing);
console.log("Leading:", isLeading);
console.log("Followers:", followers);
console.log("Available:", availableUsers);

// Listen to all events
followManager?.room?.on("follow:event", (event, user) => {
  console.log("Event from", user.name, ":", event);
});
```

## ⚠️ Common Pitfalls

❌ **Don't capture sensitive input**

```tsx
captureOptions={{ captureInput: false }} // For sensitive forms
```

❌ **Don't enable hover without need**

```tsx
captureOptions={{ captureHover: false }} // Performance impact
```

❌ **Don't forget to cleanup**

```tsx
useEffect(() => {
  return () => manager?.destroy();
}, []);
```

✅ **Do use throttling**

```tsx
captureOptions={{ throttleDelay: 100 }} // Adjust for performance
```

## 🎯 Use Cases Checklist

- [ ] Onboarding walkthrough
- [ ] Support/help mode
- [ ] Remote presentations
- [ ] Collaborative editing
- [ ] Training sessions
- [ ] Product demos
- [ ] Screen sharing alternative

## 📁 File Locations

```
lib/
  followManager.js              - Core functionality

components/
  QuickFollowProvider.tsx       - React provider
  follow/
    FollowControlPanel.tsx      - UI component

app/
  follow-demo/
    page.tsx                    - Interactive demo

docs/
  follow-feature.md             - Full documentation
  follow-quick-reference.md     - This file

examples/
  follow-integration.tsx        - Integration patterns

FOLLOW-FEATURE-README.md        - Quick start guide
FOLLOW-FEATURE-SUMMARY.md       - Implementation summary
```

## 🔗 Links

- Demo: `/follow-demo`
- Quick Start: `FOLLOW-FEATURE-README.md`
- Full Docs: `docs/follow-feature.md`
- Examples: `examples/follow-integration.tsx`

## 🚦 Status Check

```tsx
// Quick health check
function FollowStatus() {
  const { isInitialized, isFollowing, isLeading, followers } = useFollow();

  return (
    <div>
      Status: {isInitialized ? "✅ Ready" : "⏳ Loading"}
      {isFollowing && " | 👁️ Following"}
      {isLeading && ` | 📡 Leading (${followers.length})`}
    </div>
  );
}
```

---

**Need more details?** Check the full documentation in `docs/follow-feature.md`
