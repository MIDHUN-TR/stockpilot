"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectBox } from "@/components/ui/SelectBox";
import { DynamicModal, ModalField } from "@/components/ui/Modal";
import { Plus, RefreshCw } from "lucide-react";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  price: string;
  costPrice: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

const productStatusMap: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  Active: "success",
  Draft: "warning",
  Discontinued: "error",
  Archived: "default",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.Categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleCreateProduct = async (formData: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: formData.sku,
          name: formData.name,
          description: formData.description || undefined,
          categoryId: parseInt(formData.categoryId),
          price: formData.price,
          costPrice: formData.costPrice,
          isActive: true,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Create product error:", error);
      alert("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products client-side
  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !categoryFilter || p.categoryId === parseInt(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const createProductFields: ModalField[] = [
    { name: "sku", label: "SKU", type: "text", required: true, placeholder: "PRD-001" },
    { name: "name", label: "Product Name", type: "text", required: true, placeholder: "Widget Pro" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Product description..." },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      required: true,
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    },
    { name: "price", label: "Selling Price", type: "number", required: true, placeholder: "99.99" },
    { name: "costPrice", label: "Cost Price", type: "number", required: true, placeholder: "49.99" },
  ];

  const columns: Column<Product>[] = [
    {
      header: "Product",
      accessor: "name",
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.sku}</p>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      render: (item) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Cost",
      accessor: "costPrice",
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-400">
          ₹{Number(item.costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <StatusBadge status={productStatusMap[item.status] || "default"} size="sm">
          {item.status}
        </StatusBadge>
      ),
    },
    {
      header: "Active",
      accessor: "isActive",
      render: (item) => (
        <StatusBadge status={item.isActive ? "success" : "default"} size="sm" icon={false}>
          {item.isActive ? "Yes" : "No"}
        </StatusBadge>
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

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your product catalog ({filtered.length} products)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or SKU..."
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectBox
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter by category"
          />
        </div>
        <button
          onClick={fetchProducts}
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
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}

      {/* Create Product Modal */}
      <DynamicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Product"
        fields={createProductFields}
        onSubmit={handleCreateProduct}
        submitButtonText={submitting ? "Creating..." : "Create Product"}
      />
    </div>
  );
}
