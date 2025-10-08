/**
 * Example: How to integrate the Follow Feature into your app
 *
 * This shows three common integration patterns:
 * 1. Basic integration with the control panel
 * 2. Custom UI integration
 * 3. Programmatic control without UI
 */

// ============================================
// Pattern 1: Basic Integration with UI Panel
// ============================================

import QuickFollowProvider from "@/components/QuickFollowProvider";
import FollowControlPanel from "@/components/follow/FollowControlPanel";
import { ReactNode, useEffect, useRef } from "react";

export function AppWithFollowPanel({ children }: { children: ReactNode }) {
  return (
    <QuickFollowProvider roomName="my-app">
      {children}
      <FollowControlPanel />
    </QuickFollowProvider>
  );
}

// ============================================
// Pattern 2: Custom UI Integration
// ============================================

import { useFollow } from "@/components/QuickFollowProvider";
import { Button } from "@/components/ui/button";

function CustomFollowUI() {
  const {
    isInitialized,
    isFollowing,
    isLeading,
    followedUser,
    followers,
    availableUsers,
    followUser,
    stopFollowing,
    startLeading,
    stopLeading,
  } = useFollow();

  if (!isInitialized) {
    return <div>Connecting...</div>;
  }

  return (
    <div className="follow-controls">
      {/* Status Display */}
      {isFollowing && (
        <div className="status">
          Following: {followedUser?.name}
          <Button onClick={stopFollowing} size="sm">
            Stop
          </Button>
        </div>
      )}

      {isLeading && (
        <div className="status">
          Leading ({followers.length} followers)
          <Button onClick={stopLeading} size="sm">
            Stop
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      {!isFollowing && !isLeading && (
        <div className="actions">
          <select onChange={(e) => followUser(e.target.value)}>
            <option value="">Follow someone...</option>
            {availableUsers.map((user) => (
              <option key={user.socketId} value={user.socketId}>
                {user.name || user.email}
              </option>
            ))}
          </select>

          <Button onClick={startLeading}>Start Leading</Button>
        </div>
      )}
    </div>
  );
}

export function AppWithCustomUI({ children }: { children: ReactNode }) {
  return (
    <QuickFollowProvider roomName="my-app">
      <CustomFollowUI />
      {children}
    </QuickFollowProvider>
  );
}

// ============================================
// Pattern 3: Programmatic Control (No UI)
// ============================================

import { QuickFollowManager } from "@/lib/followManager";

function useFollowManager(roomName = "app") {
  const managerRef = useRef<QuickFollowManager | null>(null);

  useEffect(() => {
    const manager = new QuickFollowManager({
      roomName,
      captureScroll: true,
      captureClick: true,
      captureInput: false, // Disable input capture for privacy
    });

    // Setup callbacks
    manager.onFollowStart = (user) => {
      console.log("Started following:", user.name);
      // Show notification, update UI, etc.
    };

    manager.onFollowerAdded = (follower) => {
      console.log("New follower:", follower.name);
      // Track analytics, update UI, etc.
    };

    manager.init().then(() => {
      managerRef.current = manager;
    });

    return () => {
      manager.destroy();
    };
  }, [roomName]);

  return managerRef.current;
}

export function ProgrammaticFollowExample() {
  const followManager = useFollowManager("presentation");

  const startPresentation = () => {
    followManager?.startLeading();
    // Now your actions will be broadcast
  };

  const endPresentation = () => {
    followManager?.stopLeading();
  };

  return (
    <div>
      <Button onClick={startPresentation}>Start Presentation</Button>
      <Button onClick={endPresentation}>End Presentation</Button>
    </div>
  );
}

// ============================================
// Pattern 4: Custom Events Integration
// ============================================

function AnnotationApp() {
  const { followManager, isLeading, broadcastCustomEvent } = useFollow();

  // Setup custom event handler
  useEffect(() => {
    if (!followManager) return;

    followManager.onCustomEvent((eventName: string, data: any) => {
      switch (eventName) {
        case "annotation-added":
          addAnnotationToCanvas(data);
          break;
        case "annotation-deleted":
          removeAnnotationFromCanvas(data.id);
          break;
        case "canvas-cleared":
          clearCanvas();
          break;
      }
    });
  }, [followManager]);

  const addAnnotation = (annotation: any) => {
    // Add locally
    addAnnotationToCanvas(annotation);

    // Broadcast if leading
    if (isLeading) {
      broadcastCustomEvent("annotation-added", annotation);
    }
  };

  const clearAllAnnotations = () => {
    clearCanvas();
    if (isLeading) {
      broadcastCustomEvent("canvas-cleared", {});
    }
  };

  return <Canvas onAddAnnotation={addAnnotation} />;
}

// ============================================
// Pattern 5: Navigation Synchronization
// ============================================

import { useRouter } from "next/navigation";

function NavigationSyncApp() {
  const router = useRouter();
  const { followManager, isLeading } = useFollow();

  useEffect(() => {
    if (!followManager) return;

    // Setup navigation handler for followers
    followManager.setupNavigateHandler((url: string) => {
      router.push(url);
    });
  }, [followManager, router]);

  const navigateToPage = (path: string) => {
    // Navigate locally
    router.push(path);

    // Broadcast if leading
    if (isLeading) {
      followManager?.navigateTo(path);
    }
  };

  return (
    <nav>
      <Button onClick={() => navigateToPage("/dashboard")}>Dashboard</Button>
      <Button onClick={() => navigateToPage("/projects")}>Projects</Button>
      <Button onClick={() => navigateToPage("/settings")}>Settings</Button>
    </nav>
  );
}

// ============================================
// Pattern 6: Conditional Event Capture
// ============================================

function AdvancedFollowExample() {
  return (
    <QuickFollowProvider
      roomName="advanced-app"
      captureOptions={{
        // Enable what you need
        captureScroll: true,
        captureClick: true,
        captureInput: false, // Disable for privacy
        captureHover: false, // Disable for performance
        captureFocus: true,
        captureResize: false,
        throttleDelay: 100, // Adjust for your needs
      }}
      executeOptions={{
        smoothScroll: true, // Smooth following experience
        highlightClicks: true, // Visual feedback
        highlightDuration: 800,
      }}
    >
      <YourApp />
    </QuickFollowProvider>
  );
}

// ============================================
// Pattern 7: Multiple Rooms
// ============================================

// You can have multiple follow instances for different purposes
function MultiRoomExample({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Global follow room */}
      <QuickFollowProvider roomName="global-follow">
        {/* Presentation-specific follow room */}
        <QuickFollowProvider roomName="presentation-mode">
          {children}
        </QuickFollowProvider>
      </QuickFollowProvider>
    </>
  );
}

// ============================================
// Helper: Mock implementations for examples
// ============================================

function addAnnotationToCanvas(annotation: any) {
  console.log("Adding annotation:", annotation);
}

function removeAnnotationFromCanvas(id: string) {
  console.log("Removing annotation:", id);
}

function clearCanvas() {
  console.log("Clearing canvas");
}

function Canvas({ onAddAnnotation }: any) {
  return <div>Canvas component</div>;
}

function YourApp() {
  return <div>Your app</div>;
}
