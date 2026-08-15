"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "../ui/DataTable";
import { useSearchParams } from "next/navigation";

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
interface ApiResponse{
  message:string;
  data:inventoryData[];
  totalCount:number;
}

export default function InventoryTable() {

  const [inventory, setInventory] = useState<inventoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useStates for Pagination 
  const [page,setPage ]= useState<number>(1)
  const[totalCount,setTotalCount] = useState<number>(0)
  const limit = 25 //for matching API default

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    // Get the status filter form URL 
    const statusFilter = searchParams.get("status") || "";

    // Reset to page 1 whenever the search query changes
    useEffect(() => {
      setPage(1);
    }, [searchQuery,statusFilter]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build dynamic API URL based on parameters
        let apiUrl = `/api/inventory?page=${page}&limit=${limit}`;
        if (searchQuery) {
          apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if(statusFilter){
          apiUrl+=`&status=${statusFilter}`
        }
        // We use relative path instead of localhost:3000 to work correctly on production
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();

        // Access the actual array inside the 'data' property
        if (result && Array.isArray(result.data)) {
          setInventory(result.data);
          setTotalCount(result.totalCount || 0); //Save the total count from API
        } else {
          throw new Error("API did not return an array in the 'data' field.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch inventory data",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [page,searchQuery,statusFilter]);// Added search and statusfilter to dependency array so it refetches when search changes

  
  // Define columns using both basic accessors and custom render functions for nested data
  const inventoryColumns: Column<inventoryData>[] = [
    {
      header: "No",
      accessor: "id",
      render:(item,index)=> (page-1)*limit + index+1
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
   
  ];

  if (isLoading && inventory.length===0)
    return <div className="p-4 text-gray-500">Loading inventory...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  // Calculate total pages based on count and limit
  const totalPages = Math.ceil(totalCount/limit);
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Inventory Overview</h2>
      {isLoading&& <span className="text-sm text-gray-500">Updating.....</span>}
      <DataTable data={inventory} columns={inventoryColumns} 
      pagination={{
        currentPage:page,
        totalPage:Math.max(1,totalPages), //Ensure at least 1 page
        onPageChange:(newPage) =>setPage(newPage)
        }}/>
    </div>
  );
}
