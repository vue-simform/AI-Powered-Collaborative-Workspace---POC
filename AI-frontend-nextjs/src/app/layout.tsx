import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Load the Geist fonts from Google via next/font (self-hosted at build time) and expose them as CSS variables.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Page title and description used by the browser tab and search engines.
export const metadata: Metadata = {
  title: "AI-Powered Collaborative Workspace",
  description: "AI-powered collaborative workspace POC",
};

// The root layout wraps EVERY page in the app. It must render the <html> and <body> tags.
// Providers adds the data cache; Suspense shows a fallback while a child is still loading.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>
          <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Loading...</p>}>{children}</Suspense>
        </Providers></body>
    </html>
  );
}
