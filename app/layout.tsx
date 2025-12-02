import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { HeaderProvider } from "@/components/layout/HeaderContext";
import GlobalLayout from "@/components/layout/GlobalLayout";
import { SWRProvider } from "@/components/SWRProvider";
// import { SchemaMigrationDialog } from "@/components/migration/SchemaMigrationDialog";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
  manifest: "/manifest.json",
  // viewport: {
  //   width: "device-width",
  //   initialScale: 1,
  //   maximumScale: 1,
  //   userScalable: false,
  //   viewportFit: "cover",
  // },
  icons: {
    icon: "/favicons/icon-32.png", // This overrides the default favicon.ico
    shortcut: "/favicons/icon-32.png",
    apple: "/favicons/icon-180.png",
    other: [
      { url: "/favicons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicons/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicons/icon-256.png", sizes: "256x256", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Artifact" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Artifact" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        {/* Quick Platform SDK - only works on deployed Quick sites */}
        <script src="/client/quick.js" async />
        {/* Quicklytics Analytics - only works on deployed Quick sites */}
        <script
          src="https://quicklytics.quick.shopify.io/quicklytics.min.js"
          async
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <SWRProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <HeaderProvider>
                <GlobalLayout>{children}</GlobalLayout>
              </HeaderProvider>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
