"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { searchShopifyUsers, type ShopifyUser } from "@/lib/access-control";
import { UserAvatar } from "@/components/auth/UserAvatar";

interface UserSearchAutocompleteProps {
  onSelect: (user: ShopifyUser | null) => void;
  placeholder?: string;
  excludeEmails?: string[];
}

/**
 * UserSearchAutocomplete
 *
 * Searches Shopify users from Quick's users.json endpoint
 * Shows autocomplete dropdown with avatars and names
 */
export function UserSearchAutocomplete({
  onSelect,
  placeholder = "Search name",
  excludeEmails = [],
}: UserSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShopifyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search users as query changes
  useEffect(() => {
    const search = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const users = await searchShopifyUsers(query);

        // Filter out excluded emails
        const filtered = users.filter(
          (user) => !excludeEmails.includes(user.email.toLowerCase())
        );

        setResults(filtered);
        setIsOpen(filtered.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, excludeEmails]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + results.length) % results.length
        );
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (user: ShopifyUser) => {
    onSelect(user);
    setQuery(user.fullName);
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        className="w-full"
        autoComplete="off"
      />

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
        >
          {results.map((user, index) => (
            <button
              key={user.email}
              onClick={() => handleSelect(user)}
              className={`
                w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors
                ${index === selectedIndex ? "bg-accent" : ""}
              `}
            >
              {/* Avatar */}
              <UserAvatar
                email={user.email}
                name={user.fullName}
                imageUrl={user.slackImageUrl}
                size="sm"
              />

              {/* User Name */}
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.fullName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-border border-t-foreground rounded-full" />
        </div>
      )}
    </div>
  );
}
