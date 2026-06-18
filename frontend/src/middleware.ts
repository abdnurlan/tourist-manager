import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard middleware (CONTRACT §8, §12).
 *
 * The JWT lives in localStorage (per contract), which the Edge runtime cannot
 * read — so authoritative protection is enforced client-side in the (app)
 * route-group layout. As a defense-in-depth fallback we also honour an
 * optional `tp_token` cookie if a deployment chooses to mirror the token
 * there; when present-and-empty on a protected path we bounce to /login.
 *
 * This keeps the matcher wired and the redirect contract intact without
 * breaking the localStorage-first design.
 */

const PUBLIC_PATHS = ["/login"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only the cookie mirror is observable at the edge; if a deployment opts
  // into cookie mirroring we can short-circuit obviously-unauthed requests.
  const cookieToken = req.cookies.get("tp_token")?.value;

  if (!isPublic(pathname) && cookieToken === "") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on app routes, skip static assets / Next internals / api.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
