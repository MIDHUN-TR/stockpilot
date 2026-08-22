"use client";

import { useState} from "react";
import { DataTable, Column } from "../ui/DataTable";
import { useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { StockHistoryDrawer } from "./StockHistoryDrawer";
import { DynamicModal,ModalField } from "../ui/Modal";

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

  // States for Stock Update Modal
  const [isStockModalOpen , setIsStockModalOpen] = useState(false)
  const [selectedItemForStock,setSelectedItemForStock] = useState<inventoryData | null>(null)

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
        <div className="flex gap-4"> <button 
          onClick={() => handleOpenHistory(item.product.id, item.product.name)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-all"
        >
          History
        </button>
        <button 
            onClick={() => handleOpenStockModal(item)}
            className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline transition-all"
          >
            Update Stock
          </button>
        </div>
       
        
      ),
    },
  ];

  if (isLoading && inventory.length === 0)
    return <div className="p-4 text-gray-500">Loading inventory...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  // Calculate total pages based on count and limit
  const totalPages = Math.ceil(totalCount / limit);
  // Open Modal Function
  const handleOpenStockModal = (item:inventoryData) =>{
    setSelectedItemForStock(item)
    setIsStockModalOpen(true)
  }
  // Handle Submit logic for stock API
  const handleStockSubmit = async (formData:Record<string,string>)=>{
    if(!selectedItemForStock) return;

    try{
      const payload = {
        productId: selectedItemForStock.product.id,
        warehouseId: selectedItemForStock.warehouse.id,
        quantity: parseInt(formData.quantity, 10),
        movementType: formData.movementType,
        referenceType: formData.referenceType,
        note: formData.note,
        createdById: 1 // Hardcoded for now. Replace with actual user ID from Auth session
      };
      const res = await fetch("/api/stock-movements",{
        method:"POST",
        headers:{"Content-Type" : "application/json"},
        body : JSON.stringify(payload)
      })
      if(!res.ok){
        const errorData = await res.json()
        throw new Error(errorData.error ||"Failed to update stock");

       
      }
       // Close modal on success
        setIsStockModalOpen(false);
      setSelectedItemForStock(null);

      // Revalidate both table data and stats cards to reflect the new stock instantly
      mutate(apiUrl)
      mutate('/api/inventory/stats');

      alert("Stock updated successfully");

    }catch(error){

      // const errorMessage = error?.response?.data?.message || error?.message || "An unexpected error occurred while updating the stock.";
     console.error("Actual Error:", error);
    // console.log(errorMessage);
}
    }
  
  // Define fields for the DyanmicModal

  const stockModalFields: ModalField[] = [
    {
      name: "movementType",
      label: "Movement Type",
      type: "select",
      required: true,
      options: [
        { label: "Stock In (Add)", value: "IN" },
        { label: "Stock Out (Remove)", value: "OUT" },
        { label: "Adjustment", value: "ADJUSTMENT" }
      ]
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      required: true,
      placeholder: "Enter quantity"
    },
    {
      name: "referenceType",
      label: "Reference Type",
      type: "select",
      required: true,
      options: [
        { label: "Retail Bill", value: "RETAIL_BILL" },
        { label: "E-Commerce Order", value: "ECOMMERCE_ORDER" },
        { label: "Manual Adjustment", value: "MANUAL_ADJUSTMENT" },
        { label: "Internal Transfer", value: "INTERNAL_TRANSFER" },
        { label: "Purchase Order", value: "PURCHASE_ORDER" }
      ]
    },
    {
      name: "note",
      label: "Notes / Reason",
      type: "textarea",
      required: false,
      placeholder: "Enter reason for this stock update..."
    }
  ];
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

      <StockHistoryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        productId={selectedProductId}
        productName={selectedProductName}
      />
      <DynamicModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedItemForStock(null);
        }}
        title={`Update Stock: ${selectedItemForStock?.product.name || ''}`}
        fields={stockModalFields}
        onSubmit={handleStockSubmit}
        submitButtonText="Save Stock"
      />
    </div>
  );
}
