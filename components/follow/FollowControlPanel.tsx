"use client";

import { useState } from "react";
import { useFollow } from "../QuickFollowProvider";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Card } from "../ui/card";

export default function FollowControlPanel() {
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

  const [isOpen, setIsOpen] = useState(false);

  if (!isInitialized) {
    return null;
  }

  const handleFollowUser = async (userId: string) => {
    await followUser(userId);
    setIsOpen(false);
  };

  const handleStopFollowing = () => {
    stopFollowing();
  };

  const handleToggleLead = () => {
    if (isLeading) {
      stopLeading();
    } else {
      startLeading();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <Card className="p-4 shadow-lg border-2 border-black bg-white min-w-[280px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Follow Mode</h3>
            <div className="flex gap-2">
              {followers.length > 0 && (
                <span className="text-xs bg-chart-2/20 text-chart-2 px-2 py-1 rounded-full font-medium">
                  {followers.length} follower{followers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Current status */}
          {isFollowing && followedUser && (
            <div className="bg-primary/10 border-2 border-primary/20 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                {followedUser.slackImageUrl && (
                  <img
                    src={followedUser.slackImageUrl}
                    alt=""
                    className="w-6 h-6 rounded-full border border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    Following {followedUser.name || followedUser.email}
                  </div>
                  {followedUser.title && (
                    <div className="text-xs text-muted-foreground truncate">
                      {followedUser.title}
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleStopFollowing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Stop Following
              </Button>
            </div>
          )}

          {/* Show if you have followers (auto-leading) */}
          {!isFollowing && followers.length > 0 && (
            <div className="bg-chart-2/10 border-2 border-chart-2/20 rounded p-3">
              <div className="font-medium text-sm mb-1">
                🎯 Broadcasting to {followers.length} follower
                {followers.length !== 1 ? "s" : ""}
              </div>
              <p className="text-xs text-muted-foreground">
                Your actions are automatically broadcast when you have followers
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isFollowing && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    disabled={availableUsers.length === 0}
                  >
                    {availableUsers.length === 0
                      ? "No Users Online"
                      : "Follow Someone"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Follow a User</DialogTitle>
                    <DialogDescription>
                      Select a user to follow their actions in real-time.
                      They'll automatically become a leader.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 mt-4">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users available to follow
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <button
                          key={user.socketId}
                          onClick={() => handleFollowUser(user.socketId)}
                          className="w-full p-3 border-2 border-border rounded hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {user.slackImageUrl && (
                              <img
                                src={user.slackImageUrl}
                                alt=""
                                className="w-10 h-10 rounded-full border-2 border-border"
                              />
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium truncate">
                                {user.name || user.email}
                              </div>
                              {user.title && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {user.title}
                                </div>
                              )}
                              {user.slackHandle && (
                                <div className="text-xs text-muted-foreground">
                                  @{user.slackHandle}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Show current followers */}
          {!isFollowing && followers.length > 0 && (
            <div className="pt-2 border-t-2 border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Current Followers:
              </div>
              <div className="space-y-1">
                {followers.map((follower) => (
                  <div
                    key={follower.socketId}
                    className="flex items-center gap-2 text-xs"
                  >
                    {follower.slackImageUrl && (
                      <img
                        src={follower.slackImageUrl}
                        alt=""
                        className="w-5 h-5 rounded-full border border-border"
                      />
                    )}
                    <span className="truncate">
                      {follower.name || follower.email}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
