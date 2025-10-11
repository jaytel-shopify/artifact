# Quick Follow Feature

The Follow Feature allows users to follow each other's actions in real-time using Quick's WebSocket functionality. Users can become "leaders" who broadcast their actions, or "followers" who see and execute those actions in real-time.

## Features

- **Event Broadcasting**: Capture and broadcast user actions (scroll, click, input, hover, focus, resize)
- **Event Execution**: Receive and replay actions from followed users
- **Customizable**: Choose which events to capture and how to execute them
- **User Management**: See available users, current followers, and who you're following
- **Custom Events**: Broadcast and receive custom events for application-specific needs

## Architecture

The follow feature consists of three main components:

### 1. EventManager

Captures local user events and broadcasts them to the WebSocket room.

**Supported Event Types:**

- `SCROLL` - Window scroll position
- `CLICK` - Mouse clicks with element selectors
- `INPUT` - Text input changes
- `HOVER` - Mouse hover events
- `FOCUS` - Element focus events
- `RESIZE` - Window resize events
- `NAVIGATE` - Page navigation
- `CUSTOM` - Custom application events

### 2. EventExecutor

Receives events from the followed user and executes them locally.

**Features:**

- Smooth scrolling
- Click highlighting
- Smart element selection
- Input synchronization

### 3. QuickFollowManager

Coordinates the follow/lead functionality and manages WebSocket communication.

## Usage

### Basic Setup

1. **Add the Provider to your layout:**

```tsx
import QuickFollowProvider from "@/components/QuickFollowProvider";
import FollowControlPanel from "@/components/follow/FollowControlPanel";

export default function Layout({ children }) {
  return (
    <QuickFollowProvider roomName="my-app-follow">
      {children}
      <FollowControlPanel />
    </QuickFollowProvider>
  );
}
```

### Using the Hook

```tsx
import { useFollow } from "@/components/QuickFollowProvider";

function MyComponent() {
  const {
    isFollowing,
    isLeading,
    followedUser,
    followers,
    availableUsers,
    followUser,
    stopFollowing,
    startLeading,
    stopLeading,
    broadcastCustomEvent,
  } = useFollow();

  // Follow a user
  const handleFollow = async () => {
    await followUser(availableUsers[0].socketId);
  };

  // Start leading
  const handleLead = () => {
    startLeading();
  };

  // Broadcast custom event
  const handleCustomAction = () => {
    if (isLeading) {
      broadcastCustomEvent("custom-action", { data: "example" });
    }
  };

  return (
    <div>
      {isFollowing && <div>Following {followedUser.name}</div>}
      {isLeading && <div>{followers.length} followers</div>}
    </div>
  );
}
```

### Advanced: Direct Manager Usage

```tsx
import { QuickFollowManager, EventTypes } from "@/lib/followManager";

// Create manager
const manager = new QuickFollowManager({
  roomName: "custom-room",
  captureScroll: true,
  captureClick: true,
  captureInput: false,
  throttleDelay: 50,
  smoothScroll: true,
  highlightClicks: true,
});

// Initialize
await manager.init();

// Setup callbacks
manager.onFollowStart = (user) => {
  console.log("Started following:", user);
};

manager.onFollowerAdded = (user) => {
  console.log("New follower:", user);
};

// Follow a user
await manager.followUser(userId);

// Start leading
manager.startLeading();

// Custom events
manager.setupNavigateHandler((url) => {
  window.location.href = url;
});

// Broadcast navigation
manager.navigateTo("/new-page");

// Custom event
manager.broadcastCustomEvent("custom-event", { foo: "bar" });

// Listen for custom events
manager.onCustomEvent((eventName, data) => {
  console.log("Custom event:", eventName, data);
});

// Cleanup
await manager.destroy();
```

## Configuration Options

### Capture Options

```typescript
{
  captureScroll?: boolean;      // Default: true
  captureClick?: boolean;       // Default: true
  captureInput?: boolean;       // Default: true
  captureHover?: boolean;       // Default: false
  captureFocus?: boolean;       // Default: false
  captureResize?: boolean;      // Default: false
  throttleDelay?: number;       // Default: 50ms
}
```

### Execute Options

```typescript
{
  smoothScroll?: boolean;       // Default: true
  highlightClicks?: boolean;    // Default: true
  highlightDuration?: number;   // Default: 1000ms
}
```

## Event Flow

### Leading (Broadcasting)

1. User calls `startLeading()`
2. EventManager starts capturing local events
3. Events are throttled and broadcast via WebSocket
4. Followers receive events in real-time

```
User Action → EventManager → Socket.emit → Followers
```

### Following (Receiving)

1. User calls `followUser(userId)`
2. EventExecutor starts listening for events
3. Events from followed user are received
4. EventExecutor replays events locally

```
Leader Action → Socket → EventExecutor → Local Replay
```

## Custom Events

You can extend the system with custom events for application-specific needs:

```typescript
// On the leader side
manager.broadcastCustomEvent("annotation-added", {
  id: "123",
  x: 100,
  y: 200,
  text: "Important note",
});

// On the follower side
manager.onCustomEvent((eventName, data) => {
  if (eventName === "annotation-added") {
    addAnnotationToCanvas(data);
  }
});
```

## Navigation Handling

The follow feature includes special handling for page navigation:

```typescript
// Leader navigates (will broadcast to followers)
manager.navigateTo("/new-page");

// Followers automatically navigate
manager.setupNavigateHandler((url) => {
  // Custom navigation logic
  router.push(url);
});
```

## Security Considerations

- Events are isolated by Quick subdomain
- Only Shopify employees can access Quick sites
- Element selectors are sanitized
- Input values are synchronized (be mindful of sensitive data)
- Consider disabling input capture for sensitive forms

## Performance

- Events are throttled to prevent overwhelming the network (default: 50ms)
- Scroll events use passive listeners
- Element selectors are cached
- Animations use CSS transforms for smooth performance

## Troubleshooting

### Events not being captured

- Check if you called `startLeading()`
- Verify capture options are enabled
- Check browser console for errors

### Events not executing

- Ensure you're following the correct user
- Verify element selectors are valid
- Check if elements exist on the page

### Performance issues

- Increase throttle delay
- Disable hover/focus capture
- Reduce highlight duration

## Example Use Cases

1. **Onboarding**: Guide new users through your app
2. **Support**: Help users by showing them exactly what to do
3. **Presentations**: Present to remote audience with synchronized navigation
4. **Collaboration**: Work together on the same content
5. **Training**: Record and replay training sessions
6. **Demos**: Give live product demos with multiple viewers

## API Reference

### QuickFollowManager

#### Methods

- `init()` - Initialize the manager
- `followUser(userId)` - Start following a user
- `stopFollowing()` - Stop following current user
- `startLeading()` - Start broadcasting events
- `stopLeading()` - Stop broadcasting events
- `getAvailableUsers()` - Get list of users to follow
- `getFollowers()` - Get list of current followers
- `isFollowing()` - Check if following someone
- `isLeading()` - Check if broadcasting
- `broadcastCustomEvent(name, data)` - Broadcast custom event
- `navigateTo(url)` - Navigate with broadcast
- `destroy()` - Cleanup and disconnect

#### Callbacks

- `onFollowStart` - Called when starting to follow
- `onFollowStop` - Called when stopping follow
- `onLeadStart` - Called when starting to lead
- `onLeadStop` - Called when stopping lead
- `onFollowerAdded` - Called when gaining a follower
- `onFollowerRemoved` - Called when losing a follower

### useFollow Hook

Returns:

- `followManager` - Manager instance
- `isInitialized` - Whether manager is ready
- `isFollowing` - Currently following someone
- `isLeading` - Currently broadcasting
- `followedUser` - User being followed
- `followers` - List of followers
- `availableUsers` - List of users to follow
- `followUser(id)` - Follow a user
- `stopFollowing()` - Stop following
- `startLeading()` - Start leading
- `stopLeading()` - Stop leading
- `broadcastCustomEvent(name, data)` - Broadcast event
