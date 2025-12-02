"use client";

import { useEffect, useState, createContext, useContext, useRef, useMemo, useCallback } from "react";
import { QuickFollowManager } from "@/lib/followManager";

interface User {
  socketId: string;
  name: string;
  email: string;
  slackImageUrl?: string;
  slackHandle?: string;
  title?: string;
  state?: any;
}

interface FollowContextType {
  followManager: QuickFollowManager | null;
  isInitialized: boolean;
  isFollowing: boolean;
  isLeading: boolean;
  followedUser: User | null;
  followers: User[];
  availableUsers: User[];
  followUser: (userId: string) => Promise<boolean>;
  stopFollowing: () => void;
  startLeading: () => boolean;
  stopLeading: () => void;
  broadcastCustomEvent: (eventName: string, data: any) => void;
}

const FollowContext = createContext<FollowContextType | null>(null);

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within QuickFollowProvider");
  }
  return context;
}

interface QuickFollowProviderProps {
  roomName?: string;
  room?: any; // Existing socket room to reuse (optional)
  autoInit?: boolean;
  onBroadcastInitialState?: () => void; // Callback to broadcast current state when someone starts following
  children: React.ReactNode;
}

export default function QuickFollowProvider({
  roomName = "follow",
  room = null,
  autoInit = true,
  onBroadcastInitialState,
  children,
}: QuickFollowProviderProps) {
  const [followManager, setFollowManager] = useState<QuickFollowManager | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLeading, setIsLeading] = useState(false);
  const [followedUser, setFollowedUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Keep latest callback in a ref to avoid re-initializing manager when callback changes
  const broadcastInitialStateRef = useRef(onBroadcastInitialState);
  useEffect(() => {
    broadcastInitialStateRef.current = onBroadcastInitialState;
    
    // Also update the manager's callback if it's already initialized
    if (followManager) {
      followManager.onBroadcastInitialState = () => {
        broadcastInitialStateRef.current?.();
      };
    }
  }, [onBroadcastInitialState, followManager]);

  useEffect(() => {
    let manager: QuickFollowManager | null = null;
    let updateInterval: NodeJS.Timeout | null = null;
    const cleanupFunctions: (() => void)[] = [];

    async function initialize() {
      manager = new QuickFollowManager({
        roomName,
        room, // Pass existing room if provided
      });

      // Setup callbacks
      manager.onFollowStart = (user) => {
        setIsFollowing(true);
        setFollowedUser(user);
      };

      manager.onFollowStop = (user) => {
        setIsFollowing(false);
        setFollowedUser(null);
      };

      manager.onLeadStart = () => {
        setIsLeading(true);
      };

      manager.onLeadStop = () => {
        setIsLeading(false);
      };

      manager.onFollowerAdded = (user) => {
        updateFollowersList();
      };

      manager.onFollowerRemoved = (user) => {
        updateFollowersList();
      };

      manager.onBroadcastInitialState = () => {
        broadcastInitialStateRef.current?.();
      };

      const success = await manager.init();
      if (success) {
        setFollowManager(manager);
        setIsInitialized(true);

        // Initial update
        updateAvailableUsers();
        updateFollowersList();

        // Listen for user changes via WebSocket events (not polling!)
        const handleUserChange = () => {
          updateAvailableUsers();
          updateFollowersList();
        };
        
        window.addEventListener('followUserChange', handleUserChange);
        cleanupFunctions.push(() => {
          window.removeEventListener('followUserChange', handleUserChange);
        });
      }
    }

    function updateAvailableUsers() {
      if (manager) {
        setAvailableUsers(manager.getAvailableUsers());
      }
    }

    function updateFollowersList() {
      if (manager) {
        const followersList = manager
          .getFollowers()
          .filter((f) => f !== undefined) as User[];
        setFollowers(followersList);
      }
    }

    if (autoInit) {
      initialize().catch((error) => {
        console.error("Failed to initialize QuickFollowManager:", error);
      });
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      cleanupFunctions.forEach(fn => fn());
      if (manager) {
        manager.destroy();
      }
    };
  }, [roomName, room, autoInit]);

  const followUserCallback = useCallback(async (userId: string) => {
    if (!followManager) return false;
    const result = await followManager.followUser(userId);
    return result;
  }, [followManager]);

  const stopFollowingCallback = useCallback(() => {
    followManager?.stopFollowing();
  }, [followManager]);

  const startLeadingCallback = useCallback(() => {
    if (!followManager) return false;
    return followManager.startLeading();
  }, [followManager]);

  const stopLeadingCallback = useCallback(() => {
    followManager?.stopLeading();
  }, [followManager]);

  const broadcastCustomEventCallback = useCallback((eventName: string, data: any) => {
    followManager?.broadcastCustomEvent(eventName, data);
  }, [followManager]);

  const contextValue: FollowContextType = useMemo(() => ({
    followManager,
    isInitialized,
    isFollowing,
    isLeading,
    followedUser,
    followers,
    availableUsers,
    followUser: followUserCallback,
    stopFollowing: stopFollowingCallback,
    startLeading: startLeadingCallback,
    stopLeading: stopLeadingCallback,
    broadcastCustomEvent: broadcastCustomEventCallback,
  }), [
    followManager,
    isInitialized,
    isFollowing,
    isLeading,
    followedUser,
    followers,
    availableUsers,
    followUserCallback,
    stopFollowingCallback,
    startLeadingCallback,
    stopLeadingCallback,
    broadcastCustomEventCallback,
  ]);

  return (
    <FollowContext.Provider value={contextValue}>
      {children}
    </FollowContext.Provider>
  );
}
