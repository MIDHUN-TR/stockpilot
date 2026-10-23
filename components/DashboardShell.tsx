"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronLeft,
    Warehouse,
    type LucideIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

/** Icon name → component map for serialization across the server/client boundary. */
const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    Warehouse,
};

export interface NavItem {
    href: string;
    label: string;
    iconName: string;
}

interface DashboardShellProps {
    children: React.ReactNode;
    navItems: NavItem[];
    user: {
        name: string;
        email: string;
        role: Role;
    };
}

export function DashboardShell({ children, navItems, user }: DashboardShellProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    /** Derive the user's initials for the avatar */
    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : user.email[0].toUpperCase();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col
                    bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                    transition-all duration-300 ease-in-out
                    ${collapsed ? "w-[72px]" : "w-64"}
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 lg:static lg:z-auto
                `}
            >
                {/* Logo area */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Package size={18} className="text-white" />
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                StockPilot
                            </span>
                        </Link>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
                            <Package size={18} className="text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = ICON_MAP[item.iconName] ?? Package;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                title={collapsed ? item.label : undefined}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                    transition-all duration-200 group
                                    ${
                                        isActive
                                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                    }
                                `}
                            >
                                <Icon
                                    size={20}
                                    className={`shrink-0 ${
                                        isActive
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                    }`}
                                />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1 shrink-0">
                    {/* Role badge */}
                    {!collapsed && (
                        <div className="px-3 py-2 mb-2">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {user.role}
                            </p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {user.email}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronLeft
                            size={20}
                            className={`shrink-0 transition-transform duration-300 ${
                                collapsed ? "rotate-180" : ""
                            }`}
                        />
                        {!collapsed && <span>Collapse</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${
                            collapsed ? "justify-center" : ""
                        }`}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {navItems.find((item) => item.href === pathname)?.label ??
                                "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
