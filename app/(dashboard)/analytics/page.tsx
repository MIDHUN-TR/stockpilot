"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, Column } from "@/components/ui/DataTable";
import {
  TrendingUp,
  BarChart3,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";

interface RevenueDay {
  date: string;
  revenue: number;
  count: number;
}

interface TopProduct {
  product: { id: number; name: string; sku: string } | null;
  totalQuantity: number;
  totalRevenue: string;
  orderCount: number;
}

interface OrderByStatus {
  status: string;
  count: number;
}

interface AnalyticsData {
  revenueByDay: RevenueDay[];
  topProducts: TopProduct[];
  ordersByStatus: OrderByStatus[];
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500",
  Processing: "bg-blue-500",
  Shipped: "bg-indigo-500",
  Delivered: "bg-green-500",
  Cancelled: "bg-red-500",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalRevenue = data?.revenueByDay.reduce((sum, d) => sum + Number(d.revenue), 0) ?? 0;
  const totalOrders = data?.revenueByDay.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const maxDayRevenue = data?.revenueByDay.reduce(
    (max, d) => (Number(d.revenue) > max ? Number(d.revenue) : max),
    0
  ) ?? 1;

  const topProductColumns: Column<TopProduct>[] = [
    {
      header: "Product",
      accessor: "orderCount",
      render: (item) =>
        item.product ? (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.product.sku}</p>
          </div>
        ) : (
          <span className="text-gray-400">Unknown</span>
        ),
    },
    {
      header: "Orders",
      accessor: "orderCount",
      render: (item) => (
        <span className="font-semibold text-gray-900 dark:text-white">{item.orderCount}</span>
      ),
    },
    {
      header: "Qty Sold",
      accessor: "totalQuantity",
      render: (item) => (
        <span className="text-gray-700 dark:text-gray-300">{item.totalQuantity}</span>
      ),
    },
    {
      header: "Revenue",
      accessor: "totalRevenue",
      render: (item) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹{Number(item.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last 30 days performance overview
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="30-Day Revenue"
          value={loading ? "..." : `₹${totalRevenue.toLocaleString("en-IN")}`}
          icon={<TrendingUp size={20} />}
          isLoading={loading}
        />
        <StatCard
          title="Total Orders"
          value={loading ? "..." : totalOrders}
          icon={<ShoppingCart size={20} />}
          isLoading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={loading ? "..." : `₹${avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          icon={<BarChart3 size={20} />}
          isLoading={loading}
        />
      </div>

      {/* Revenue Chart (CSS bar chart) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Revenue (Last 30 Days)
        </h3>
        {loading ? (
          <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ) : data?.revenueByDay.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No data available</p>
        ) : (
          <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
            {data?.revenueByDay.map((day) => {
              const height = maxDayRevenue > 0 ? (Number(day.revenue) / maxDayRevenue) * 100 : 0;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 min-w-[24px] flex-1 group">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-300 relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ₹${Number(day.revenue).toLocaleString("en-IN")} (${day.count} orders)`}
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 rotate-[-45deg] origin-top-left whitespace-nowrap hidden sm:block">
                    {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Products
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <DataTable data={data?.topProducts || []} columns={topProductColumns} />
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders by Status
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.ordersByStatus.map((s) => {
                const total = data.ordersByStatus.reduce((sum, st) => sum + st.count, 0);
                const pct = total > 0 ? (s.count / total) * 100 : 0;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {s.status}
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          statusColors[s.status] || "bg-gray-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {s.count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
