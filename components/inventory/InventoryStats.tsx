"use client";
import React from "react";
// importing nextjs hooks for URL manipulation
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Package, AlertTriangle, XCircle, IndianRupeeIcon } from "lucide-react";
import { StatCard } from "../ui/StatCard";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Server responded with status code ${res.status}`);
    return res.json();
  });

export default function InventoryStats() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get the current Status filter from the URL search parameters
  const currentStatus = searchParams.get("status");

  // Using SWR instead of useEffect.
  // It handles loading state, data fetching, and caching automatically.
  const {data:response,error,isLoading}=useSWR('/api/inventory/stats',fetcher,{
    revalidateOnFocus:false,//Prevents re-fetching when clicking away and back to the tab
    dedupingInterval:60000, //Deduplicates requests withing 60 seconds 
  });
  // Extract stats from response or provide default fallbacks 
  const stats = response || {
    totalProducts:0,
    lowStock:0,
    outOfStock:0,
    totalValuation:0
  };
  // console.log(stats)

  // Function to handle card clicks and update URL
  const handleCardClick = (statusFilter: string) => {
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
  };
if(error) return <div className="text-red-500 mb-4 ">Failed to load statistics.</div>
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
          onClick={() => handleCardClick("LOW_STOCK")}
        />
        {/*  Out of Stock Card*/}
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={<XCircle className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
          isClickable={true}
          isActive={currentStatus === "OUT_OF_STOCK"}
          onClick={() => handleCardClick("OUT_OF_STOCK")}
        />
        <StatCard
          title="Total Value"
          value={`₹${stats.totalValuation?.toLocaleString('en-IN') ?? 0}`}
          icon={<IndianRupeeIcon className="w-6 h-6 text-blue-500" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
