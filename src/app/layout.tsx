import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/NextAuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import SessionTimeout from "@/components/SessionTimeout";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Reconnoitering - Discover Art Exhibitions Worldwide",
  description: "Explore curated art exhibitions across Europe. Find exhibitions by location, date, artist, and style. Plan your cultural journey with personalized recommendations.",
  keywords: "art exhibitions, museums, galleries, contemporary art, modern art, European art, exhibition calendar, art events, cultural travel",
  authors: [{ name: "Reconnoitering" }],
  creator: "Reconnoitering",
  publisher: "Reconnoitering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://reconnoitering.com'),
  openGraph: {
    title: "Reconnoitering - Discover Art Exhibitions Worldwide",
    description: "Explore curated art exhibitions across Europe. Plan your cultural journey with personalized recommendations.",
    url: '/',
    siteName: 'Reconnoitering',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Reconnoitering - Art Exhibitions Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reconnoitering - Discover Art Exhibitions',
    description: 'Explore curated art exhibitions across Europe.',
    images: ['/twitter-image.png'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NextAuthProvider>
          <AnalyticsProvider>
            <ErrorBoundary>
              <SessionTimeout timeoutInMinutes={30} warningInMinutes={5} />
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </ErrorBoundary>
          </AnalyticsProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}