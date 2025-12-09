"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const handleToggleTheme = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(theme === "dark" ? "light" : "dark");
      });
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handleToggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
