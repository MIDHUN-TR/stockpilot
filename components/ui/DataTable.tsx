"use client";
import React, { ReactNode } from "react";

// Defines the structure and behavior of a single table column
export interface Column<T> {
  header: string;
  accessor: keyof T;
  // Optional custom render function for complex data (e.g., formatting dates, status badges, or action buttons)
  render?: (item: T, index: number) => ReactNode;
}

// Defines the required data and optional configurations for the DataTable component
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  // Optional pagination configuration. If omitted, the table will render without pagination controls at the bottom.
  pagination?: {
    currentPage: number;
    totalPage: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({ data, columns, pagination }: DataTableProps<T>) {
  // Fallback UI: Display an empty state message if there is no data to render
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    // Main table wrapper with horizontal scroll support for smaller screens
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table Header: Iterates through the columns array to render column titles */}
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/50"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  // Fixed: Changed from dark:divide-gray-700 to dark:text-gray-200 for proper text color
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                >
                  {/* Render custom cell content if a 'render' function exists; otherwise, display the raw accessor value */}
                  {col.render
                    ? col.render(row, rowIndex)
                    : (row[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer: Only renders if the 'pagination' prop is passed to the component */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {pagination.currentPage}{" "}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {pagination.totalPage}
            </span>
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage === 1}
              // Fixed: Added missing border class and dark mode variants
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              disabled={pagination.currentPage === pagination.totalPage}
              // Fixed: Added dark mode variants
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
