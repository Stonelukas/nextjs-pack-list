import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ConvexProvider } from "@/providers/convex-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { MobileNav } from "@/components/mobile/mobile-nav";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { SkipNav } from "@/components/accessibility/skip-nav";
import { DevelopmentProvider } from "@/providers/development-provider";
import { Header } from "@/components/navigation/header";
import { NavigationLayout } from "@/components/navigation/navigation-layout";
import { WebVitalsReporter } from "./web-vitals";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { VercelDebug } from '@/components/debug/vercel-debug';
import PlausibleProvider from "next-plausible";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Pack List - Smart Packing List Tracker",
    template: "%s | Pack List"
  },
  description: "Organize and track your packing lists for any trip or event. Create custom lists, use templates, and never forget anything again.",
  keywords: ["packing list", "travel planner", "trip organizer", "vacation checklist", "packing app", "travel checklist"],
  authors: [{ name: "Pack List Team" }],
  creator: "Pack List",
  publisher: "Pack List",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://packlist.app'),
  openGraph: {
    title: "Pack List - Smart Packing List Tracker",
    description: "Never forget anything again. Create smart packing lists for every trip.",
    url: '/',
    siteName: "Pack List",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pack List - Smart Packing List Tracker",
    description: "Never forget anything again. Create smart packing lists for every trip.",
    creator: "@packlist",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <PlausibleProvider domain="packlistapp.com">
              <ConvexProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <DevelopmentProvider>
                    <AuthProvider>
                      <QueryProvider>
                        <SkipNav />
                        <WebVitalsReporter />
                        <SpeedInsights debug={process.env.NODE_ENV === 'development'} />
                        <Analytics debug={process.env.NODE_ENV === 'development'} />
                        <VercelDebug />
                        <ErrorBoundary>
                          <Header />
                          <NavigationLayout>
                            {children}
                          </NavigationLayout>
                        </ErrorBoundary>
                        <MobileNav />
                        <Toaster />
                      </QueryProvider>
                    </AuthProvider>
                  </DevelopmentProvider>
                </ThemeProvider>
              </ConvexProvider>
          </PlausibleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
