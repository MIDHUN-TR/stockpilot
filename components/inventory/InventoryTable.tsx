"use client";

import { useState} from "react";
import { DataTable, Column } from "../ui/DataTable";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ProductHistoryDrawer } from "./ProductHistoryDrawer";

export interface product {
  id: number;
  sku: string;
  name: string;
  description: string;
  categoryId: number;
  price: string;
  costPrice: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface inventoryData {
  id: number;
  warehouseId: number;
  productId: number;
  quantityOnHand: number;
  reservedQuantity: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
  product: product;
  warehouse: Warehouse;
}
interface ApiResponse {
  message: string;
  data: inventoryData[];
  totalCount: number;
}

// SWR fetcher function
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok)
      throw new Error(`Server responded with status code ${res.status}`);
    return res.json();
  });
export default function InventoryTable() {
  // useStates for Pagination
  const [page, setPage] = useState<number>(1);
  // const[totalCount,setTotalCount] = useState<number>(0)
  const limit = 25; //for matching API default

  // Add states for controlling the History Drawer 
  const [isDrawerOpen,setIsDrawerOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  // Get the status filter form URL
  const statusFilter = searchParams.get("status") || "";

  // Reset to page 1 whenever search query or status filter changes
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);

  if (searchQuery !== prevSearchQuery || statusFilter !== prevStatusFilter) {
    setPage(1);
    setPrevSearchQuery(searchQuery);
    setPrevStatusFilter(statusFilter);
  }

  // Build the dynaminc API URL for SWR
  let apiUrl = `/api/inventory?page=${page}&limit=${limit}`;
  if (searchQuery) apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
  if (statusFilter) apiUrl += `&status=${statusFilter}`;

  // SWR handles fetching automatically whenever apiUrl changes
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse>(apiUrl, fetcher, {
    keepPreviousData: true, //Keeps showing old data while fetching new data
  });

  const handleOpenHistory = (productId: number, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setIsDrawerOpen(true);
  };
  // Extract data safely
  const inventory = response?.data || [];
  const totalCount = response?.totalCount || 0;
  // Define columns using both basic accessors and custom render functions for nested data
  const inventoryColumns: Column<inventoryData>[] = [
    {
      header: "No",
      accessor: "id",
      render: (item, index) => (page - 1) * limit + index + 1,
    },
    {
      header: "SKU",
      accessor: "product",
      render: (item) => item.product.sku,
    },
    {
      header: "Product Name",
      accessor: "product",
      render: (item) => item.product.name,
    },
    {
      header: "Warehouse",
      accessor: "warehouse",
      render: (item) => item.warehouse.name,
    },
    {
      header: "Quantity on Hand",
      accessor: "quantityOnHand",
    },
    {
      header: "Reserved",
      accessor: "reservedQuantity",
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => (
        <button 
          onClick={() => handleOpenHistory(item.product.id, item.product.name)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-all"
        >
          History
        </button>
      ),
    },
  ];

  if (isLoading && inventory.length === 0)
    return <div className="p-4 text-gray-500">Loading inventory...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  // Calculate total pages based on count and limit
  const totalPages = Math.ceil(totalCount / limit);
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Inventory Overview</h2>
      {isLoading && (
        <span className="text-sm text-gray-500">Updating.....</span>
      )}
      <DataTable
        data={inventory}
        columns={inventoryColumns}
        pagination={{
          currentPage: page,
          totalPage: Math.max(1, totalPages), //Ensure at least 1 page
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      <ProductHistoryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        productId={selectedProductId}
        productName={selectedProductName}
      />
    </div>
  );
}
