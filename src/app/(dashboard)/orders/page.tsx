"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectBox } from "@/components/ui/SelectBox";
import { DynamicModal, ModalField } from "@/components/ui/Modal";
import { Plus, RefreshCw } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  _count: { items: number };
}

interface OrdersResponse {
  data: Order[];
  totalCount: number;
  page: number;
  totalPages: number;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

const orderStatusMap: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  Pending: "warning",
  Processing: "info",
  Shipped: "info",
  Delivered: "success",
  Cancelled: "error",
};

const paymentStatusMap: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  Pending: "warning",
  Success: "success",
  Failed: "error",
  Refunded: "info",
};

const createOrderFields: ModalField[] = [
  {
    name: "customerName",
    label: "Customer Name",
    type: "text",
    required: true,
    placeholder: "John Doe",
  },
  {
    name: "productId",
    label: "Product ID",
    type: "number",
    required: true,
    placeholder: "1",
  },
  {
    name: "warehouseId",
    label: "Warehouse ID",
    type: "number",
    required: true,
    placeholder: "1",
  },
  {
    name: "quantity",
    label: "Quantity",
    type: "number",
    required: true,
    placeholder: "5",
  },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data: OrdersResponse = await res.json();
        setOrders(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCreateOrder = async (formData: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          items: [
            {
              productId: parseInt(formData.productId),
              warehouseId: parseInt(formData.warehouseId),
              quantity: parseInt(formData.quantity),
            },
          ],
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      header: "Order #",
      accessor: "orderNumber",
      render: (item) => (
        <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
          {item.orderNumber.slice(0, 12)}...
        </span>
      ),
    },
    { header: "Customer", accessor: "customerName" },
    {
      header: "Amount",
      accessor: "totalAmount",
      render: (item) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹
          {Number(item.totalAmount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: "Items",
      accessor: "id",
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-300">
          {item._count.items}
        </span>
      ),
    },
    {
      header: "Order Status",
      accessor: "orderStatus",
      render: (item) => (
        <StatusBadge
          status={orderStatusMap[item.orderStatus] || "default"}
          size="sm"
        >
          {item.orderStatus}
        </StatusBadge>
      ),
    },
    {
      header: "Payment",
      accessor: "paymentStatus",
      render: (item) => (
        <StatusBadge
          status={paymentStatusMap[item.paymentStatus] || "default"}
          size="sm"
        >
          {item.paymentStatus}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all your orders
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus size={18} />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search orders by number or customer..."
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectBox
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by status"
          />
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-200 dark:bg-gray-800 rounded-lg"
            />
          ))}
        </div>
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          pagination={{
            currentPage: page,
            totalPage: totalPages,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Create Order Modal */}
      <DynamicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Order"
        fields={createOrderFields}
        onSubmit={handleCreateOrder}
        submitButtonText={submitting ? "Creating..." : "Create Order"}
      />
    </div>
  );
}
