"use client";

import { Role } from "@prisma/client";
import { hasPermission, PermissionKey } from "@/lib/auth/permissions";

interface CanProps {
    role: Role;
    perform: PermissionKey;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Client-side permission wrapper.
 * Renders children only if the user's role has the required permission.
 * Important: This is a UI convenience — always enforce permissions on the server too.
 */
export function Can({ role, perform, children, fallback = null }: CanProps) {
    if (!hasPermission(role, perform)) return <>{fallback}</>;
    return <>{children}</>;
}
