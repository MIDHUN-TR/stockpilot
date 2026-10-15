import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 * Clears the auth_token cookie to log the user out.
 */
export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Immediately expire the cookie
  });

  return response;
}
