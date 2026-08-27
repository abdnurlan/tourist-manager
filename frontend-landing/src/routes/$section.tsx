import { createFileRoute, notFound } from "@tanstack/react-router";
import { LandingPage, isSectionId, type SectionId } from "@/components/LandingPage";
import { SEO } from "./__root";

// Real URLs for the landing page's blocks — /tours, /reviews, /how, /contact —
// instead of "#" fragments, so a link to a section is a normal shareable URL.
//
// All four are ONE dynamic route rather than four separate route files on
// purpose: moving between them keeps the same component mounted, so the page
// only scrolls instead of tearing down and rebuilding the whole landing page.
//
// This is the last route to be matched, so it never shadows a real path:
// /tours/$tourId has more segments and wins for tour detail pages.
export const Route = createFileRoute("/$section")({
  // Anything that is not one of the four blocks is a genuine 404 — without this
  // the route would happily render the landing page for /typo.
  beforeLoad: ({ params }) => {
    if (!isSectionId(params.section)) throw notFound();
  },
  // Same document as "/", so it points at the home page rather than competing
  // with it in search results. The root route's Hebrew-first title/description
  // still apply.
  head: () => ({ links: [{ rel: "canonical", href: SEO.url }] }),
  component: SectionRoute,
});

function SectionRoute() {
  const { section } = Route.useParams();
  return <LandingPage section={section as SectionId} />;
}
