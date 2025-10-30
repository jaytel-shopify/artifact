import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AdminPanelWrapper } from "@/components/admin/AdminPanelWrapper";
import LocalDevWarning from "@/components/LocalDevWarning";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Projects | Artifact",
  description: "Collaborative presentation tool for design artifacts",
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
        {/* Quick Platform SDK - only works on deployed Quick sites */}
        <script src="/client/quick.js" async />
        {/* Quicklytics Analytics - only works on deployed Quick sites */}
        <script
          src="https://quicklytics.quick.shopify.io/quicklytics.min.js"
          async
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Show warning when running on localhost */}
        <LocalDevWarning />

        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <AdminPanelWrapper />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
