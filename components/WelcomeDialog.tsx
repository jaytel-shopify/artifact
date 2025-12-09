"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const WELCOME_COOKIE_NAME = "artifact-welcome-dismissed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    // Check if user has already dismissed the dialog
    const dismissed = getCookie(WELCOME_COOKIE_NAME);
    if (!dismissed) {
      setIsOpen(true);
      // Load the animation data
      fetch("/lottie/onboarding.json")
        .then((res) => res.json())
        .then((data) => setAnimationData(data))
        .catch(console.error);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    setCookie(WELCOME_COOKIE_NAME, "true", COOKIE_MAX_AGE);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent
        className="max-w-md overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Lottie Animation */}
        <div className="flex items-center justify-center bg-gradient-to-b from-[#1a2a32] to-[#0f1315] px-8 pt-8">
          <div className="aspect-square w-48">
            {animationData && (
              <Lottie
                animationData={animationData}
                loop={false}
                className="lottie-light"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6 pt-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xlarge text-center">
              Welcome to Artifact
            </DialogTitle>
            <DialogDescription className="text-center text-text-secondary">
              A collaborative presentation tool for sharing design artifacts.
              Create projects, upload media, and present your work beautifully.
            </DialogDescription>
          </DialogHeader>

          {/* Feature highlights */}
          <div className="space-y-3 rounded-card-inner bg-background/50 p-4">
            <Feature
              icon="📁"
              title="Organize in Projects"
              description="Group related artifacts together"
            />
            <Feature
              icon="🖼️"
              title="Share Media"
              description="Images, videos, and URLs"
            />
            <Feature
              icon="🎨"
              title="Present Beautifully"
              description="Full-screen presentation mode"
            />
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleDismiss}
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-small text-text-primary">{title}</p>
        <p className="text-small text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
