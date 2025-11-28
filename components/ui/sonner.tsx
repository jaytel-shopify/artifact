"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--c-primary)",
          "--normal-text": "var(--c-text-primary)",
          "--normal-border": "var(--c-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
