"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      router.push("/projects");
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Artifact</CardTitle>
            <CardDescription>Authenticating with Quick...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Artifact</CardTitle>
          <CardDescription>
            Quick platform handles authentication automatically for Shopify
            employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-text-secondary">
            <p>
              If you&apos;re not automatically authenticated, please ensure:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You&apos;re accessing this site from a Shopify network</li>
              <li>You&apos;re logged into your Shopify Google account</li>
              <li>The Quick SDK is properly loaded</li>
            </ul>
          </div>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
