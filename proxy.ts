// creating a middleware root for protect the api routes and pages with jwt token verification and role based access control
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// importing jwt token verification and role types from lib/auth/jwt.ts
import { verifyToken } from "@/lib/auth/jwt"


/**
 * RBAC Route Configuration:
 * Maps specific route path prefixes to allowed roles.
 */
interface RbacRule {
  path: string;
  allowedRoles: string[];
}

const RBAC_RULES: RbacRule[] = [
  // Admin-only routes
  { path: "/settings", allowedRoles: ["Admin"] },
  { path: "/api/warehouse", allowedRoles: ["Admin"] },

  // Admin & Manager routes
  { path: "/inventory", allowedRoles: ["Admin", "Manager"] },
  { path: "/analytics", allowedRoles: ["Admin", "Manager"] },
  { path: "/api/inventory", allowedRoles: ["Admin", "Manager"] },
  { path: "/api/analytics", allowedRoles: ["Admin", "Manager"] },

  // Authenticated routes accessible to Admin, Manager, and Staff
  { path: "/dashboard", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/orders", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/products", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/api/categories", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/api/products", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/api/stock-movements", allowedRoles: ["Admin", "Manager", "Staff"] },
  { path: "/api/orders", allowedRoles: ["Admin", "Manager", "Staff"] },
];

/** Public paths exempted from proxy authentication */
const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);
const PUBLIC_PREFIXES = ["/api/auth/", "/_next", "/favicon"];

/**
 * Next.js 16 Network Proxy interceptor (replaces legacy middleware.ts)
 * Runs on Node.js runtime natively before requests hit Server Components or Route Handlers.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public paths and asset routes
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  const isApi = pathname.startsWith("/api/");

  // 2. Unauthenticated check
  if (!token) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verify JWT token
    const payload = await verifyToken(token);
    const userRole = payload.role as string;

    if (!userRole) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: "Invalid token payload" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 4. RBAC Check: Match rule by path prefix
    const matchedRule = RBAC_RULES.find((rule) => pathname.startsWith(rule.path));
    if (matchedRule && !matchedRule.allowedRoles.includes(userRole)) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // 5. Forward verified user identity to downstream Server Components & Route Handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.userId));
    requestHeaders.set("x-user-role", userRole);
    requestHeaders.set("x-user-email", payload.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Token verification failed in proxy:", error);

    if (isApi) {
      const response = NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
      response.cookies.delete("auth_token");
      return response;
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/settings/:path*",
    "/api/categories/:path*",
    "/api/inventory/:path*",
    "/api/products/:path*",
    "/api/stock-movements/:path*",
    "/api/warehouse/:path*",
    "/api/orders/:path*",
    "/api/dashboard/:path*",
  ],
};

