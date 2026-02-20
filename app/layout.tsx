import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/constants";
import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} - Math Graphing Calculator`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "graphing calculator",
    "equation solver",
    "3D graphing",
    "LaTeX math",
    "math calculator",
    "calculus",
    "differential equations",
    "trigonometry",
    "parametric equations",
    "polar graphs",
    "matrix calculator",
    "vector calculator",
  ],
  openGraph: {
    title: `${APP_NAME} - Math Graphing Calculator`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Interactive graphing calculator`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Math Graphing Calculator`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/icon-192.png",
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
        {/* JSON-LD structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: APP_NAME,
              description: APP_DESCRIPTION,
              url: APP_URL,
              applicationCategory: "EducationApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip-to-content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only fixed left-2 top-2 z-[100] rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white focus:outline-none"
        >
          Skip to content
        </a>
        <ThemeProvider>
          {children}
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
