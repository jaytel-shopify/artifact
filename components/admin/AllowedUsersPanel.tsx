"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
  seedAllowedUsers,
  type AllowedUser,
} from "@/lib/allowed-users-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AllowedUsersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllowedUsersPanel({ isOpen, onClose }: AllowedUsersPanelProps) {
  const { user, isAdmin: userIsAdmin } = useAuth();
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);

  // Load allowed users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const users = await getAllowedUsers();
      setAllowedUsers(users);
      
      // Show migration helper if no users exist
      if (users.length === 0) {
        setShowMigration(true);
      }
    } catch (err) {
      console.error("Failed to load allowed users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userIsAdmin) {
      loadUsers();
    }
  }, [isOpen, userIsAdmin]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = newUserEmail.trim().toLowerCase();
    
    // Validation
    if (!email) {
      setError("Email is required");
      return;
    }
    
    if (!email.endsWith("@shopify.com")) {
      setError("Email must be @shopify.com");
      return;
    }
    
    setIsAdding(true);
    setError(null);
    
    try {
      const result = await addAllowedUser(email, user?.email || "admin");
      
      if (result) {
        setNewUserEmail("");
        await loadUsers();
      } else {
        setError("Failed to add user");
      }
    } catch (err) {
      console.error("Failed to add user:", err);
      setError("Failed to add user");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!confirm(`Remove ${email} from allowed users?`)) {
      return;
    }
    
    try {
      const success = await removeAllowedUser(email);
      
      if (success) {
        await loadUsers();
      } else {
        setError("Failed to remove user");
      }
    } catch (err) {
      console.error("Failed to remove user:", err);
      setError("Failed to remove user");
    }
  };

  const handleMigrate = async () => {
    // Migrate users from the old JSON file list
    const oldUsers = [
      "mclane.teitel@shopify.com",
      "yael.bienenstock@shopify.com",
      "carl.rivera@shopify.com",
      "tobi@shopify.com",
      "jesper.vos@shopify.com",
      "johnny.slack@shopify.com",
      "melike.turgut@shopify.com",
      "katarina.batina@shopify.com",
      "jaytel.provence@shopify.com",
      "marvin.schwaibold@shopify.com",
    ];
    
    setIsAdding(true);
    try {
      const count = await seedAllowedUsers(oldUsers, user?.email || "admin");
      setShowMigration(false);
      await loadUsers();
      alert(`Successfully migrated ${count} users!`);
    } catch (err) {
      console.error("Failed to migrate users:", err);
      setError("Failed to migrate users");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen || !userIsAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold">Allowed Users Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {allowedUsers.length} user{allowedUsers.length !== 1 ? "s" : ""} allowed
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <span className="text-xl">×</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Migration Helper */}
          {showMigration && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Migration Helper</h3>
              <p className="text-sm text-muted-foreground mb-3">
                No users found in database. Would you like to migrate users from the old JSON file?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleMigrate}
                  disabled={isAdding}
                >
                  Migrate Users
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMigration(false)}
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Add User Form */}
          <div className="space-y-2">
            <h3 className="font-semibold">Add User</h3>
            <form onSubmit={handleAddUser} className="flex gap-2">
              <Input
                type="email"
                placeholder="user@shopify.com"
                value={newUserEmail}
                onChange={(e) => {
                  setNewUserEmail(e.target.value);
                  setError(null);
                }}
                disabled={isAdding}
                className="flex-1"
              />
              <Button type="submit" disabled={isAdding}>
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </form>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Users List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Allowed Users</h3>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : allowedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users added yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allowedUsers.map((allowedUser) => (
                  <div
                    key={allowedUser.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm">
                        {allowedUser.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Added by {allowedUser.added_by}
                        {allowedUser.added_at && (
                          <> • {new Date(allowedUser.added_at).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveUser(allowedUser.email)}
                      className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> to toggle
            </div>
            <div>
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd> to close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

