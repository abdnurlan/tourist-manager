import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <Link to="/" className="mb-10" aria-label="m4st trip">
        <Logo height={48} />
      </Link>
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <a href="/" className="mb-10" aria-label="m4st trip">
        <Logo height={48} />
      </a>
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          This page didn't load
        </h1>
        <p className="mt-4 text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-foreground/20 bg-transparent px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// Hebrew-first SEO metadata for the inbound market (Israel → Azerbaijan).
const SEO = {
  url: "https://m4strip.com",
  image: "https://m4strip.com/og-image.jpg",
  title: "M4st Trip — טיולים מאורגנים לאזרבייג'ן | מדריכים דוברי עברית",
  description:
    "חברת תיירות פנימה לאזרבייג'ן: טיולים מאורגנים לבאקו, שקי, גבלה וחיינלק עם מדריכים דוברי עברית, קבוצות קטנות ומסלולים בהתאמה אישית. הזמינו עכשיו.",
  keywords:
    "טיולים לאזרבייג'ן, טיול מאורגן אזרבייג'ן, באקו, שקי, גבלה, מדריך דובר עברית, תיירות אזרבייג'ן, חבילות נופש",
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Hebrew-first (primary inbound market: Israel → Azerbaijan).
      { title: SEO.title },
      { name: "description", content: SEO.description },
      { name: "keywords", content: SEO.keywords },
      { name: "author", content: "M4st Trip" },
      { name: "robots", content: "index, follow" },
      // Brand Green tints the mobile browser chrome.
      { name: "theme-color", content: "#17281e" },
      // Open Graph (he_IL locale, with az/en/ru alternates).
      { property: "og:site_name", content: "M4st Trip" },
      { property: "og:title", content: SEO.title },
      { property: "og:description", content: SEO.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SEO.url },
      { property: "og:locale", content: "he_IL" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:locale:alternate", content: "az_AZ" },
      { property: "og:locale:alternate", content: "ru_RU" },
      { property: "og:image", content: SEO.image },
      { property: "og:image:alt", content: SEO.title },
      // Twitter / X.
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO.title },
      { name: "twitter:description", content: SEO.description },
      { name: "twitter:image", content: SEO.image },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SEO.url },
      // Favicons / app icons: the Electric Orange "4" mark on brand Green.
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      // hreflang alternates for the multilingual audience.
      { rel: "alternate", hrefLang: "he", href: SEO.url },
      { rel: "alternate", hrefLang: "en", href: SEO.url },
      { rel: "alternate", hrefLang: "az", href: SEO.url },
      { rel: "alternate", hrefLang: "ru", href: SEO.url },
      { rel: "alternate", hrefLang: "x-default", href: SEO.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap" },
    ],
    // schema.org TravelAgency structured data (rich results).
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: "M4st Trip",
          description: SEO.description,
          url: SEO.url,
          image: SEO.image,
          areaServed: { "@type": "Country", name: "Azerbaijan" },
          knowsLanguage: ["he", "en", "az", "ru"],
          telephone: "+994519600212",
          sameAs: ["https://www.instagram.com/m4strip/"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
