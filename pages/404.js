import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Custom 404 page for SPA routing on static hosting.
 * When a user directly accesses a deep link (e.g., /p/123),
 * static hosting serves this 404 page. We then use client-side
 * routing to handle the actual route.
 */
export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // Get the current path from the browser
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Only redirect if we're not already on the 404 page
    if (path !== "/404" && path !== "/404/") {
      // Use client-side routing to navigate to the intended path
      router.replace(path + search + hash);
    }
  }, [router]);

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
