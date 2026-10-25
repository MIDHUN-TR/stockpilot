import { cookies } from "next/headers";
import { verifyToken, UserTokenPayload } from "@/lib/auth/jwt";
import { NextResponse } from "next/server";
import { hasPermission, PermissionKey } from "@/lib/auth/permissions";

/**
 * Verifies the auth_token cookie and returns the user payload.
 * Returns a tuple: [payload, null] on success, [null, Response] on failure.
 */
export async function authenticateRequest(): Promise<
  [UserTokenPayload, null] | [null, NextResponse]
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return [null, NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })];
  }

  try {
    const payload = await verifyToken(token);
    return [payload, null];
  } catch {
    return [
      null,
      NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 }),
    ];
  }
}

/**
 * Authenticates the request AND checks that the user holds all required permissions.
 * Returns a tuple: [payload, null] on success, [null, Response] on failure.
 */
export async function authorizeRequest(
  ...requiredPermissions: PermissionKey[]
): Promise<[UserTokenPayload, null] | [null, NextResponse]> {
  const [user, errorResponse] = await authenticateRequest();
  if (!user) return [null, errorResponse];

  for (const perm of requiredPermissions) {
    if (!hasPermission(user.role, perm)) {
      return [
        null,
        NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        ),
      ];
    }
  }

  return [user, null];
}

