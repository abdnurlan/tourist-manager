import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";
import { SEO } from "./__root";

export const Route = createFileRoute("/")({
  // Home page inherits the Hebrew-first SEO from the root route; only the
  // canonical is per-route (see the note in __root.tsx).
  head: () => ({ links: [{ rel: "canonical", href: SEO.url }] }),
  component: () => <LandingPage />,
});
