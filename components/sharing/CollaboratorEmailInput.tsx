"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CollaboratorEmailInputProps {
  onAdd: (email: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * CollaboratorEmailInput
 * 
 * Input for adding collaborators by typing their Shopify username.
 * Auto-appends @shopify.com to the username.
 * Press Enter to add, input clears for next person.
 */
export default function CollaboratorEmailInput({ onAdd, disabled }: CollaboratorEmailInputProps) {
  const [username, setUsername] = useState("");
  const [adding, setAdding] = useState(false);

  const fullEmail = username ? `${username}@shopify.com` : "";

  function isValidUsername(value: string): boolean {
    // Allow letters, dots, hyphens, numbers
    return /^[a-z0-9.-]+$/.test(value) && value.length > 0;
  }

  async function handleAdd() {
    if (!username.trim() || !isValidUsername(username)) {
      return;
    }

    setAdding(true);
    try {
      await onAdd(fullEmail);
      setUsername(""); // Clear for next person
    } catch (error) {
      // Error handled by parent
    } finally {
      setAdding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setUsername("");
    }
  }

  return (
    <div className="space-y-2">
      {/* Input with @shopify.com suffix */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <Input
            placeholder="firstname.lastname"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
            onKeyDown={handleKeyDown}
            disabled={disabled || adding}
            className="border-0 focus-visible:ring-0 shadow-none"
            autoComplete="off"
          />
          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l select-none">
            @shopify.com
          </div>
        </div>
        <Button 
          onClick={handleAdd} 
          disabled={!username.trim() || !isValidUsername(username) || disabled || adding}
          size="sm"
        >
          {adding ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* Live preview */}
      {username && isValidUsername(username) && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Enter</kbd> to add:
          </span>
          <span className="font-medium">{fullEmail}</span>
        </div>
      )}

      {/* Validation error */}
      {username && !isValidUsername(username) && (
        <div className="text-xs text-red-600">
          Only lowercase letters, numbers, dots, and hyphens allowed
        </div>
      )}
    </div>
  );
}

