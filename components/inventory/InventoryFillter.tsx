// creating a filter component for inventory page using reusable components and hooks
"use client";

// importing reusable components
import { SearchInput } from "../ui/SearchInput";
import React from "react";

// importing Next.js navigation hooks for updating URL parameters
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export default function InventoryFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get the initial search value from the URL if it exists
  const initialSearch = searchParams.get("search")?.toString() || "";

  // creating a state for search input value
  const [searchValue, setSearchValue] = React.useState(initialSearch);
  //Creating a function to handle the search input value change and update the state

  const handleSearchChange = async (value: string) => {
    // Updating the state with the new search value
    setSearchValue(value);

    // Create a new URLSearchParams object using current parameters
    const params = new URLSearchParams(searchParams);

    if (value) {
      // Set the search query in the URL
      params.set("search", value);
    } else {
      // Remove the search query if the input is empty
      params.delete("search");
    }

    // Reset pagination to page 1 when a new search is performed
    params.set("page", "1");

    // Replace the current URL without adding a new entry to the browser history
    router.replace(`${pathname}?${params.toString()}`);
  };
  return (
    <>
      {/* input box at center */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center items-center">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search by product name or SKU..."
          delay={300} // Adjust the debounce delay as needed
        />
      </div>
    </>
  );
}
