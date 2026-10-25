"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { DynamicModal, ModalField } from "@/components/ui/Modal";
import { Plus, Building2, User, RefreshCw } from "lucide-react";

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string | null;
  createdAt: string;
}

const warehouseFields: ModalField[] = [
  {
    name: "code",
    label: "Warehouse Code",
    type: "text",
    required: true,
    placeholder: "WH-001",
  },
  {
    name: "name",
    label: "Warehouse Name",
    type: "text",
    required: true,
    placeholder: "Main Warehouse",
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "Mumbai, India",
  },
];

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warehouse");
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleCreateWarehouse = async (formData: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          location: formData.location || undefined,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create warehouse");
      }
    } catch (error) {
      console.error("Create warehouse error:", error);
      alert("Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const warehouseColumns: Column<Warehouse>[] = [
    {
      header: "Code",
      accessor: "code",
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
          {item.code}
        </span>
      ),
    },
    { header: "Name", accessor: "name" },
    {
      header: "Location",
      accessor: "location",
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.location || "—"}
        </span>
      ),
    },
    {
      header: "Created",
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <User size={22} className="text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              App Name
            </label>
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm">
              StockPilot
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Version
            </label>
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm">
              0.1.0
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Environment
            </label>
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm">
              Development
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Database
            </label>
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm">
              PostgreSQL
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Management */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Building2 size={22} className="text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Warehouses
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your warehouse locations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWarehouses}
              disabled={loading}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus size={16} />
              Add Warehouse
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        ) : (
          <DataTable data={warehouses} columns={warehouseColumns} />
        )}
      </div>

      {/* Create Warehouse Modal */}
      <DynamicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Warehouse"
        fields={warehouseFields}
        onSubmit={handleCreateWarehouse}
        submitButtonText={submitting ? "Creating..." : "Add Warehouse"}
      />
    </div>
  );
}
