import { type NextRequest, NextResponse } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const payload = JSON.parse(raw);
    const exp = payload.exp;
    if (typeof exp !== "number") return true;

    return Date.now() >= exp * 1000;
  } catch (_e) {
    return true;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const path = req.nextUrl.pathname;

  const isProtectedPath = path.startsWith("/dashboard") || path.startsWith("/chat") || path.startsWith("/mail");
  const isAuthPath = path.startsWith("/auth");

  if (isProtectedPath) {
    if (!token || isTokenExpired(token)) {
      const response = NextResponse.redirect(new URL("/auth/v1/login", req.url));
      response.cookies.delete("session_token");
      response.cookies.delete("user");
      return response;
    }

    // Restrict /dashboard/users and /dashboard/roles to super_admin and admin
    const isUserAccessRoute = path.startsWith("/dashboard/users") || path.startsWith("/dashboard/roles");
    if (isUserAccessRoute) {
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(base64));
          const role = payload.role;
          if (role !== "super_admin" && role !== "admin") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
        } else {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      } catch (_e) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Restrict /dashboard/app-config to super_admin
    const isConfigRoute = path.startsWith("/dashboard/app-config");
    if (isConfigRoute) {
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(base64));
          const role = payload.role;
          const email = payload.email;
          if (role !== "super_admin" && email !== "superadmin@indexaeli.com") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
        } else {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      } catch (_e) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  if (isAuthPath && token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL("/dashboard/default", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - media (CMS media uploads folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|media).*)",
  ],
};
