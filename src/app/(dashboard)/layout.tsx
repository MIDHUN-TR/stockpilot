import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { hasPermission, Permission } from "@/lib/auth/permissions";
import { DashboardShell, NavItem } from "@/components/DashboardShell";
import { Role } from "@prisma/client";
import prisma from "@/lib/db/db";
import type { PermissionKey } from "@/lib/auth/permissions";

/** All possible nav items with their required permissions. */
const ALL_NAV_ITEMS: (NavItem & { permission: PermissionKey })[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    iconName: "LayoutDashboard",
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    href: "/orders",
    label: "Orders",
    iconName: "ShoppingCart",
    permission: Permission.ORDER_VIEW,
  },
  {
    href: "/products",
    label: "Products",
    iconName: "Package",
    permission: Permission.PRODUCT_VIEW,
  },
  {
    href: "/inventory",
    label: "Inventory",
    iconName: "Warehouse",
    permission: Permission.INVENTORY_VIEW,
  },
  {
    href: "/analytics",
    label: "Analytics",
    iconName: "BarChart3",
    permission: Permission.ANALYTICS_VIEW,
  },
  {
    href: "/settings",
    label: "Settings",
    iconName: "Settings",
    permission: Permission.SETTINGS_VIEW,
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read session from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userId: number;
  let email: string;
  let role: Role;

  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
    email = payload.email;
    role = payload.role;
  } catch {
    redirect("/login");
  }

  // Fetch user name from database for the shell avatar
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, status: true },
  });

  // If user not found or suspended, redirect to login
  if (!dbUser || dbUser.status !== "Active") {
    redirect("/login");
  }

  // Filter nav items by the user's role permissions
  const visibleNavItems: NavItem[] = ALL_NAV_ITEMS.filter((item) =>
    hasPermission(role, item.permission),
  ).map(({ href, label, iconName }) => ({ href, label, iconName }));

  return (
    <DashboardShell
      navItems={visibleNavItems}
      user={{
        name: dbUser.name,
        email,
        role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
