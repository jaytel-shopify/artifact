"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAppShellConfig } from "@/components/layout/AppShellProvider";

export default function SettingsPage() {
  const router = useRouter();

  useAppShellConfig(
    () => ({
      mode: "homepage",
      navigation: {
        onBackToHome: () => router.back(),
      },
    }),
    [router]
  );

  return (
    <main className="min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Account settings will be implemented here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your workspace and default project settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Workspace preferences will be implemented here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>
                Application information and version details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Version: 0.1.0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
