"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  totalOrders: number;
  lowStockCount: number;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface LowStockItem {
  id: number;
  quantityOnHand: number;
  reorderLevel: number;
  product: { id: number; name: string; sku: string };
  warehouse: { id: number; name: string; code: string };
}

const orderStatusMap: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  Pending: "warning",
  Processing: "info",
  Shipped: "info",
  Delivered: "success",
  Cancelled: "error",
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const orderColumns: Column<RecentOrder>[] = [
    { header: "Order #", accessor: "orderNumber" },
    { header: "Customer", accessor: "customerName" },
    {
      header: "Amount",
      accessor: "totalAmount",
      render: (item) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹{Number(item.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "orderStatus",
      render: (item) => (
        <StatusBadge status={orderStatusMap[item.orderStatus] || "default"} size="sm">
          {item.orderStatus}
        </StatusBadge>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (item) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const lowStockColumns: Column<LowStockItem>[] = [
    {
      header: "Product",
      accessor: "id",
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.product.sku}</p>
        </div>
      ),
    },
    { header: "Warehouse", accessor: "id", render: (item) => item.warehouse.name },
    {
      header: "Stock",
      accessor: "quantityOnHand",
      render: (item) => (
        <StatusBadge
          status={item.quantityOnHand === 0 ? "error" : "warning"}
          size="sm"
        >
          {item.quantityOnHand} units
        </StatusBadge>
      ),
    },
    { header: "Reorder At", accessor: "reorderLevel" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening with your inventory today
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={
            loading
              ? "..."
              : `₹${Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}`
          }
          icon={<DollarSign size={20} />}
          isLoading={loading}
        />
        <StatCard
          title="Orders Today"
          value={loading ? "..." : stats?.ordersToday ?? 0}
          icon={<ShoppingCart size={20} />}
          isLoading={loading}
          trend={{
            value: `${stats?.totalOrders ?? 0} total`,
            type: "neutral",
            label: "all time",
          }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={loading ? "..." : stats?.lowStockCount ?? 0}
          icon={<AlertTriangle size={20} />}
          isLoading={loading}
          trend={
            (stats?.lowStockCount ?? 0) > 0
              ? { value: "Needs attention", type: "down" }
              : { value: "All good", type: "up" }
          }
        />
        <StatCard
          title="Total Orders"
          value={loading ? "..." : stats?.totalOrders ?? 0}
          icon={<Package size={20} />}
          isLoading={loading}
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Orders
            </h3>
            <a
              href="/orders"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all →
            </a>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <DataTable data={stats?.recentOrders || []} columns={orderColumns} />
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alerts
            </h3>
            <a
              href="/inventory"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View inventory →
            </a>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <DataTable data={stats?.lowStockItems || []} columns={lowStockColumns} />
          )}
        </div>
      </div>
    </div>
  );
}