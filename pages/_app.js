import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Head from "next/head";
import "@/styles/globals.css";
import "@/components/presentation/sortable-carousel/sortable-carousel.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Projects | Artifact</title>
        <meta
          name="description"
          content="Collaborative presentation tool for design artifacts"
        />
        <link rel="icon" href="/favicons/icon-32.png" />
        <link rel="shortcut icon" href="/favicons/icon-32.png" />
        <link rel="apple-touch-icon" href="/favicons/icon-180.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicons/icon-16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicons/icon-32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="64x64"
          href="/favicons/icon-64.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="128x128"
          href="/favicons/icon-128.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="256x256"
          href="/favicons/icon-256.png"
        />
        <script src="/client/quick.js" async />
        <script
          src="https://quicklytics.quick.shopify.io/quicklytics.min.js"
          async
        />
      </Head>
      <div className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Component {...pageProps} />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </div>
    </>
  );
}
