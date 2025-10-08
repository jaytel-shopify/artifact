"use client";

import { useEffect, useState, createContext, useContext } from "react";
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
  autoInit?: boolean;
  captureOptions?: {
    captureScroll?: boolean;
    captureClick?: boolean;
    captureInput?: boolean;
    captureHover?: boolean;
    captureFocus?: boolean;
    captureResize?: boolean;
    throttleDelay?: number;
  };
  executeOptions?: {
    smoothScroll?: boolean;
    highlightClicks?: boolean;
    highlightDuration?: number;
  };
  children: React.ReactNode;
}

export default function QuickFollowProvider({
  roomName = "follow",
  autoInit = true,
  captureOptions = {},
  executeOptions = {},
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

  useEffect(() => {
    let manager: QuickFollowManager | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    async function initialize() {
      manager = new QuickFollowManager({
        roomName,
        ...captureOptions,
        ...executeOptions,
      });

      // Setup callbacks
      manager.onFollowStart = (user) => {
        setIsFollowing(true);
        setFollowedUser(user);
        console.log("Started following:", user.name || user.email);
      };

      manager.onFollowStop = (user) => {
        setIsFollowing(false);
        setFollowedUser(null);
        console.log("Stopped following:", user?.name || user?.email);
      };

      manager.onLeadStart = () => {
        setIsLeading(true);
        console.log("Started leading");
      };

      manager.onLeadStop = () => {
        setIsLeading(false);
        console.log("Stopped leading");
      };

      manager.onFollowerAdded = (user) => {
        console.log("New follower:", user.name || user.email);
        updateFollowersList();
      };

      manager.onFollowerRemoved = (user) => {
        console.log("Follower left:", user.name || user.email);
        updateFollowersList();
      };

      const success = await manager.init();
      if (success) {
        setFollowManager(manager);
        setIsInitialized(true);

        // Update available users periodically
        updateInterval = setInterval(() => {
          updateAvailableUsers();
          updateFollowersList();
        }, 2000);
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
      if (manager) {
        manager.destroy();
      }
    };
  }, [roomName, autoInit]);

  const contextValue: FollowContextType = {
    followManager,
    isInitialized,
    isFollowing,
    isLeading,
    followedUser,
    followers,
    availableUsers,
    followUser: async (userId: string) => {
      if (!followManager) return false;
      const result = await followManager.followUser(userId);
      return result;
    },
    stopFollowing: () => {
      followManager?.stopFollowing();
    },
    startLeading: () => {
      if (!followManager) return false;
      return followManager.startLeading();
    },
    stopLeading: () => {
      followManager?.stopLeading();
    },
    broadcastCustomEvent: (eventName: string, data: any) => {
      followManager?.broadcastCustomEvent(eventName, data);
    },
  };

  return (
    <FollowContext.Provider value={contextValue}>
      {children}
    </FollowContext.Provider>
  );
}
