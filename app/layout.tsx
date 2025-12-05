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
      src: `${SITE_URL}/icons/web-app-manifest-192x192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `${SITE_URL}/icons/web-app-manifest-512x512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `${SITE_URL}/favicon.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: `${SITE_URL}/favicon.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
  categories: ["productivity", "design", "collaboration"],
  shortcuts: [
    {
      name: "Projects",
      short_name: "Projects",
      description: "View all projects",
      url: `${SITE_URL}/projects`,
      icons: [
        {
          src: `${SITE_URL}/favicon.svg`,
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
  ],
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
            </ThemeProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
