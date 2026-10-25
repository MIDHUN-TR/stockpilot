"use client";

import { Suspense } from "react";
import InventoryFilter from "@/src/components/inventory/InventoryFillter";
import InventoryStats from "@/src/components/inventory/InventoryStats";
import InventoryTable from "@/src/components/inventory/InventoryTable";

export default function Inventory() {
  return (
    <Suspense fallback={<div>Loading inventory...</div>}>
      <div className="flex flex-col sm:flex-row gap-4 my-4 justify-center items-center">
        <InventoryFilter />
      </div>
      <InventoryStats />
      <InventoryTable />
    </Suspense>
  );
}
