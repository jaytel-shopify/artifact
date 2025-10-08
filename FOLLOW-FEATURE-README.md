# Quick Follow Feature

A real-time follow/spectate feature built on Quick's WebSocket infrastructure. Allows users to follow each other's actions (scroll, click, input, etc.) in real-time.

## Quick Start

### 1. Add to your app layout

```tsx
import QuickFollowProvider from "@/components/QuickFollowProvider";
import FollowControlPanel from "@/components/follow/FollowControlPanel";

export default function Layout({ children }) {
  return (
    <QuickFollowProvider>
      {children}
      <FollowControlPanel />
    </QuickFollowProvider>
  );
}
```

### 2. Use the hook in components

```tsx
import { useFollow } from "@/components/QuickFollowProvider";

function MyComponent() {
  const { isFollowing, followedUser, availableUsers, followUser } = useFollow();

  return <div>{isFollowing && <p>Following {followedUser.name}</p>}</div>;
}
```

### 3. Try the demo

Visit `/follow-demo` to see it in action. Open in multiple tabs or share with colleagues.

## What's Included

### Files Created

- **`/lib/followManager.js`** - Core follow functionality
  - `QuickFollowManager` - Main manager class
  - `EventManager` - Captures and broadcasts events
  - `EventExecutor` - Receives and executes events
- **`/components/QuickFollowProvider.tsx`** - React provider and hook
  - Wraps the manager in React context
  - Provides `useFollow()` hook
- **`/components/follow/FollowControlPanel.tsx`** - UI control panel
  - Shows follow status
  - Lists available users
  - Follow/Lead controls
- **`/app/follow-demo/page.tsx`** - Interactive demo page
  - Demonstrates all features
  - Testing playground
- **`/docs/follow-feature.md`** - Full documentation
  - API reference
  - Configuration options
  - Examples and use cases

## Features

✅ **Event Broadcasting**

- Scroll, Click, Input, Hover, Focus, Resize
- Custom events for app-specific needs

✅ **Smart Execution**

- Smooth scrolling
- Click highlighting
- Element selector-based replay

✅ **User Management**

- See who's online
- Track followers
- Follow/unfollow controls

✅ **Performance**

- Event throttling
- Passive listeners
- Efficient selectors

✅ **Developer Experience**

- React hooks
- TypeScript support
- Configurable options

## Configuration

```tsx
<QuickFollowProvider
  roomName="my-app-follow"
  captureOptions={{
    captureScroll: true,
    captureClick: true,
    captureInput: true,
    captureHover: false,
    throttleDelay: 50,
  }}
  executeOptions={{
    smoothScroll: true,
    highlightClicks: true,
    highlightDuration: 1000,
  }}
>
  {children}
</QuickFollowProvider>
```

## Event Types

- **SCROLL** - Window scroll position
- **CLICK** - Mouse clicks with element targeting
- **INPUT** - Text input synchronization
- **HOVER** - Mouse hover events
- **FOCUS** - Element focus events
- **RESIZE** - Window resize events
- **NAVIGATE** - Page navigation (custom)
- **CUSTOM** - Your own events

## Use Cases

1. **Onboarding** - Guide new users through your app
2. **Support** - Show users exactly what to do
3. **Presentations** - Present to remote audience
4. **Collaboration** - Work together in real-time
5. **Training** - Record and replay sessions
6. **Demos** - Live product demonstrations

## API Quick Reference

### useFollow Hook

```tsx
const {
  followManager, // Manager instance
  isInitialized, // Ready to use
  isFollowing, // Currently following
  isLeading, // Currently broadcasting
  followedUser, // Who you're following
  followers, // Who's following you
  availableUsers, // Users you can follow
  followUser, // Follow a user
  stopFollowing, // Stop following
  startLeading, // Start broadcasting
  stopLeading, // Stop broadcasting
  broadcastCustomEvent, // Send custom event
} = useFollow();
```

### Manager Methods

```tsx
const manager = new QuickFollowManager({ roomName: "follow" });

await manager.init();
await manager.followUser(userId);
manager.stopFollowing();
manager.startLeading();
manager.stopLeading();
manager.broadcastCustomEvent("event-name", data);
manager.navigateTo(url);
await manager.destroy();
```

### Callbacks

```tsx
manager.onFollowStart = (user) => {};
manager.onFollowStop = (user) => {};
manager.onLeadStart = () => {};
manager.onLeadStop = () => {};
manager.onFollowerAdded = (user) => {};
manager.onFollowerRemoved = (user) => {};
```

## Custom Events Example

```tsx
// Leader broadcasts
broadcastCustomEvent("annotation-added", {
  x: 100,
  y: 200,
  text: "Important!",
});

// Follower receives
manager.onCustomEvent((eventName, data) => {
  if (eventName === "annotation-added") {
    addAnnotation(data);
  }
});
```

## Testing

1. Open `/follow-demo` in your browser
2. Open another tab with the same URL
3. In tab 1: Click "Start Leading"
4. In tab 2: Click "Follow User" and select the leader
5. Interact in tab 1 and watch tab 2 follow!

## Architecture

```
User Action
    ↓
EventManager (captures event)
    ↓
Throttle & Format
    ↓
WebSocket (quick.socket.emit)
    ↓
Followers receive event
    ↓
EventExecutor (replays event)
    ↓
DOM update
```

## Notes

- Works across tabs, devices, and users
- Isolated by Quick subdomain
- Only Shopify employees can access
- Events are ephemeral (not persisted)
- Element selectors are auto-generated
- Input values are synchronized (be careful with sensitive data)

## Next Steps

- Check out `/docs/follow-feature.md` for full documentation
- Try the demo at `/follow-demo`
- Customize capture/execute options
- Add your own custom events
- Integrate into your app's layout

## Support

Built on Quick's WebSocket infrastructure (`quick.socket`). See the Quick documentation in the repo rules for more details on the underlying WebSocket API.
