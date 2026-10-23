import { Role } from "@prisma/client";

/**
 * Granular permission constants.
 * Each key maps to a "resource:action" string for readability and auditability.
 */
export const Permission = {
    // Dashboard
    DASHBOARD_VIEW: "dashboard:view",
    DASHBOARD_VIEW_REVENUE: "dashboard:view:revenue",

    // Products
    PRODUCT_VIEW: "product:view",
    PRODUCT_VIEW_COST: "product:view:cost",
    PRODUCT_CREATE: "product:create",
    PRODUCT_EDIT: "product:edit",
    PRODUCT_ARCHIVE: "product:archive",

    // Inventory
    INVENTORY_VIEW: "inventory:view",
    INVENTORY_ADJUST: "inventory:adjust",
    INVENTORY_TRANSFER: "inventory:transfer",

    // Orders
    ORDER_VIEW: "order:view",
    ORDER_CREATE: "order:create",
    ORDER_CANCEL: "order:cancel",
    ORDER_REFUND: "order:refund",

    // Analytics
    ANALYTICS_VIEW: "analytics:view",

    // Settings & Users
    SETTINGS_VIEW: "settings:view",
    USER_MANAGE: "user:manage",
    AUDIT_LOG_VIEW: "audit:view",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

/**
 * Declarative role → permission mapping.
 * Admin inherits everything. Manager and Staff get explicit subsets.
 */
const ROLE_PERMISSIONS: Record<Role, ReadonlySet<PermissionKey>> = {
    Admin: new Set(Object.values(Permission)),

    Manager: new Set([
        Permission.DASHBOARD_VIEW,
        Permission.DASHBOARD_VIEW_REVENUE,
        Permission.PRODUCT_VIEW,
        Permission.PRODUCT_VIEW_COST,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_EDIT,
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_ADJUST,
        Permission.INVENTORY_TRANSFER,
        Permission.ORDER_VIEW,
        Permission.ORDER_CREATE,
        Permission.ORDER_CANCEL,
        Permission.ANALYTICS_VIEW,
    ]),

    Staff: new Set([
        Permission.DASHBOARD_VIEW,
        Permission.PRODUCT_VIEW,
        Permission.INVENTORY_VIEW,
        Permission.ORDER_VIEW,
        Permission.ORDER_CREATE,
    ]),
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: PermissionKey): boolean {
    return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Get the full set of permissions for a role.
 */
export function getPermissions(role: Role): ReadonlySet<PermissionKey> {
    return ROLE_PERMISSIONS[role] ?? new Set();
}
