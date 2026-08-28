"use client";

import InventoryFilter from "@/components/inventory/InventoryFillter";
import InventoryStats from "@/components/inventory/InventoryStats";
import InventoryTable from "@/components/inventory/InventoryTable";

export default function Inventory() {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 my-4 justify-center items-center">
        <InventoryFilter />
      </div>
      <InventoryStats />
      <InventoryTable />
    </>
  );
}
