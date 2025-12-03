import { useState, useEffect } from "react";

/**
 * Track whether a key is currently held down
 */
export function useKeyHeld(keyCode: string): boolean {
  const [isHeld, setIsHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== keyCode || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      e.preventDefault();
      setIsHeld(true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === keyCode) setIsHeld(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keyCode]);

  return isHeld;
}
