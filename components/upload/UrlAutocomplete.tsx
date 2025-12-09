"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMockQuickSites } from "@/lib/quick-mock";

interface QuickSite {
  site_name: string;
  site_url: string;
  last_modified_by: string;
  last_updated: string;
  site_summary?: string;
}

interface UrlAutocompleteProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Whether to show the Quick Sites dropdown button */
  showQuickSites?: boolean;
}

/**
 * UrlAutocomplete
 *
 * Autocompletes Quick site URLs from directory.json
 * Filters by sites where last_modified_by matches user's slack_handle
 */
export function UrlAutocomplete({
  value,
  onChange,
  placeholder = "https://example.com",
  disabled = false,
  autoFocus = false,
  showQuickSites = false,
}: UrlAutocompleteProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState(value);
  const [allSites, setAllSites] = useState<QuickSite[]>([]);
  const [results, setResults] = useState<QuickSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch user's Quick sites on mount
  useEffect(() => {
    if (!user?.slack_handle) return;

    const fetchSites = async () => {
      setLoading(true);
      try {
        // Check if we're on localhost
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname.startsWith("192.168."));

        if (isLocal) {
          // Use mock data for local dev
          const mockSites = getMockQuickSites();
          const sites: QuickSite[] = mockSites.map((site) => ({
            site_name: site.subdomain,
            site_url: site.url,
            last_modified_by: user.slack_handle || "",
            last_updated: site.lastModified,
            site_summary: site.description,
          }));
          setAllSites(sites);
        } else {
          // Fetch from directory.json
          const response = await fetch("/directory.json");
          if (!response.ok) {
            console.error("Failed to fetch directory:", response.status);
            return;
          }

          const text = await response.text();
          const sites: QuickSite[] = text
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line))
            .filter((site: QuickSite) => {
              // Match by slack_handle (handle can be with or without @shopify.com)
              const siteOwner = site.last_modified_by?.includes("@")
                ? site.last_modified_by.split("@")[0]
                : site.last_modified_by;
              return (
                siteOwner === user.slack_handle &&
                site.site_url &&
                site.site_name
              );
            });

          setAllSites(sites);
        }
      } catch (error) {
        console.error("Failed to fetch Quick sites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [user?.slack_handle]);

  // Filter sites based on query
  useEffect(() => {
    if (query.trim().length === 0) {
      // Show all user's sites when input is empty/focused
      setResults(allSites.slice(0, 10));
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = allSites
      .filter(
        (site) =>
          site.site_url.toLowerCase().includes(searchTerm) ||
          site.site_name.toLowerCase().includes(searchTerm) ||
          site.site_summary?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10);

    setResults(filtered);
    setSelectedIndex(0);
  }, [query, allSites]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
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

  const handleSelect = (site: QuickSite) => {
    setQuery(site.site_url);
    onChange(site.site_url);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (allSites.length > 0) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full"
          autoComplete="off"
        />
        {/* Quick Sites Button */}
        {showQuickSites && allSites.length > 0 && !loading && (
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleDropdown}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 h-10 rounded-button border border-border bg-background hover:bg-secondary/10 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
            title="Browse Quick sites"
          >
            <img src="/quick.svg" alt="Quick Sites" width={36} height={36} />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center w-10 h-10">
            <div className="animate-spin h-4 w-4 border-2 border-border border-t-foreground rounded-full" />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-primary border border-border rounded-button shadow-lg max-h-[300px] overflow-y-auto"
        >
          {results.map((site, index) => (
            <button
              key={site.site_url}
              onClick={() => handleSelect(site)}
              className={`
                w-full px-3 py-2 flex flex-col items-start hover:bg-background transition-colors text-left
                ${index === selectedIndex ? "bg-background" : ""}
              `}
            >
              <div className="text-small truncate w-full">{site.site_url}</div>
              {site.site_summary && (
                <div className="text-small text-text-secondary truncate w-full">
                  {site.site_summary}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
