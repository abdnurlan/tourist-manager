import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  // Home page inherits the Hebrew-first SEO from the root route; no override.
  component: () => <LandingPage />,
});
