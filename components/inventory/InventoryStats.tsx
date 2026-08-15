"use client";
import React, { useState, useEffect } from "react";
// importing nextjs hooks for URL manipulation
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Package, AlertTriangle, XCircle, IndianRupeeIcon } from "lucide-react";
import { StatCard } from "../ui/StatCard";


export default function InventoryStats() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get the current Status filter from the URL search parameters
  const currentStatus = searchParams.get("status");
  // state store api counts
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real counts using your existing API endpoint when the component mounts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        // Run API calls in parallel using Promise.all to save time
        // Simulate an API call - replace this with your actual API endpoint
        const [totalRes, lowStockRes, outOfStockRes] = await Promise.all([
          fetch("/api/inventory?limit=1"),
          fetch("/api/inventory?status=LOW_STOCK&limit=1"),
          fetch("/api/inventory?status=OUT_OF_STOCK&limit=1"),
        ]);


        const totalData = await totalRes.json();
        const lowStockData = await lowStockRes.json();
        const outOfStockData = await outOfStockRes.json();

        // Update the state with the fetched data
        setStats({
          totalProducts: totalData.totalCount || 0,
          lowStock: lowStockData.totalCount || 0,
          outOfStock: outOfStockData.totalCount || 0,
         // Note: Total value requires aggregating all inventory prices * quantity.
          // Since the current API doesn't return this, we use a placeholder or calculate it in backend later.
          totalValue: 845000
        });
       
      } catch (error) {
        console.error("Error fetching inventory counts:", error);
      }
      finally{
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []); 
   console.log(stats)

  // Function to handle card clicks and update URL
  const handleCardClick = (statusFilter:string) =>{
    const params = new URLSearchParams(searchParams.toString());
    // Toggle logic : If the clicked card is already active , remove the filter
    if (currentStatus === statusFilter) {
      params.delete("status");
    } else {
      params.set("status", statusFilter);
    }

    // Reset to page 1
    params.set("page", "1");
    // Update the URL 
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Inventory Overview
      </h2>

      

      {/* 4-Column Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1 Total products card  */}
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
        />
        {/* Low Stock Item Card */}
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={<AlertTriangle className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
          isClickable={true}
          isActive={currentStatus === "LOW_STOCK"}
          onClick={()=>handleCardClick("LOW_STOCK")}
        />
        {/*  Out of Stock Card*/}
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={<XCircle className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
          isClickable={true}
          isActive={currentStatus === "OUT_OF_STOCK"}
          onClick={()=>handleCardClick("OUT_OF_STOCK")}
        />
        <StatCard
          title="Total Value"
          value={`₹${stats.totalValue.toLocaleString('en-IN')}`}
          icon={<IndianRupeeIcon className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
