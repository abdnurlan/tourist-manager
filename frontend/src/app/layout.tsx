import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { az } from "@/lib/i18n/az";
import "./globals.css";

/* Type system: Plus Jakarta Sans across the whole app.
   Exposed as --font-sans; --font-display aliases it in globals.css so headings
   use the same family at heavier weights (700/800) for hierarchy. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: az.app.name,
    template: `%s · ${az.app.name}`,
  },
  description: az.app.tagline,
  applicationName: az.app.name,
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E7" },
    { media: "(prefers-color-scheme: dark)", color: "#15120C" },
  ],
  width: "device-width",
  initialScale: 1,
  // Let the on-screen keyboard shrink the layout viewport so fixed/sticky
  // elements (sheet footers, chat composer, bottom-nav) reflow above it
  // instead of being covered.
  interactiveWidget: "resizes-content",
  // NB: no maximumScale — pinch-zoom stays enabled (a11y / WCAG 1.4.4).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
