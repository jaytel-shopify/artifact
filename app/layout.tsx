import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { HeaderProvider } from "@/components/layout/HeaderContext";
import GlobalLayout from "@/components/layout/GlobalLayout";
import { SWRProvider } from "@/components/SWRProvider";
import ViewTransitionHandler from "@/components/ViewTransitionHandler";
import "./globals.css";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { SharedFilesHandler } from "@/components/SharedFilesHandler";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Inline manifest to bypass IAP CORS issues with manifest.json fetch
// Must use absolute URLs since data URIs have no base URL context
const SITE_URL = "https://artifact.quick.shopify.io";

const manifestData = {
  name: "Artifact",
  short_name: "Artifact",
  description: "Collaborative presentation tool for design artifacts",
  start_url: `${SITE_URL}/`,
  display: "standalone",
  background_color: "#06090a",
  theme_color: "#06090a",
  orientation: "portrait-primary",
  scope: `${SITE_URL}/`,
  icons: [
    {
      src: `${SITE_URL}/favicons/web-app-manifest-192x192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `${SITE_URL}/favicons/web-app-manifest-512x512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
  ],
  categories: ["productivity", "design", "collaboration"],
  shortcuts: [
    {
      name: "Add Media",
      url: `${SITE_URL}/?new=media`,
    },
    {
      name: "Add URL",
      url: `${SITE_URL}/?new=url`,
    },
  ],
  file_handlers: [
    {
      action: `${SITE_URL}/?new=media`,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
        "image/gif": [".gif"],
        "image/avif": [".avif"],
        "video/mp4": [".mp4"],
        "video/mov": [".mov"],
        "video/quicktime": [".mov"],
        "video/webm": [".webm"],
        "video/ogg": [".ogg"],
      },
    },
  ],
  share_target: {
    action: `${SITE_URL}/share-file-handler`,
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      files: [
        {
          name: "images",
          accept: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
          ],
        },
        {
          name: "videos",
          accept: ["video/mp4", "video/mov", "video/quicktime"],
        },
      ],
    },
  },
};

const manifestDataUri = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifestData))}`;

export const metadata: Metadata = {
  title: "Projects | Artifact",
  description: "Collaborative presentation tool for design artifacts",
  applicationName: "Artifact",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Artifact",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ backgroundColor: "var(--c-background, #010b0f)" }}
    >
      <head>
        {/* PWA Manifest - inlined as data URI to bypass IAP CORS issues */}
        <link rel="manifest" href={manifestDataUri} />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Artifact" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Artifact" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#06090a" />

        {/* Service Worker Registration */}
        <Script src="/register-sw.js" strategy="afterInteractive" />

        {/* Quick Platform SDK - only works on deployed Quick sites */}
        <Script src="/client/quick.js" async fetchPriority="high" />
        {/* Quicklytics Analytics - only works on deployed Quick sites */}
        <Script
          src="https://quicklytics.quick.shopify.io/quicklytics.min.js"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        style={{ backgroundColor: "var(--c-background, #010b0f)" }}
      >
        <SWRProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ViewTransitionHandler>
                <HeaderProvider>
                  <GlobalLayout>{children}</GlobalLayout>
                </HeaderProvider>
                <Toaster />
              </ViewTransitionHandler>
              <PWAInstallPrompt />
              <SharedFilesHandler />
            </ThemeProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
