import React, { ReactNode } from 'react';

// ടേബിളിലെ കോളമുകൾ ഡിസൈൻ ചെയ്യാനുള്ള ടൈപ്പ്
export interface Column<T> {
  header: string;
  accessor: keyof T;
  // കസ്റ്റം ഡിസൈൻ വേണമെങ്കിൽ (ഉദാഹരണത്തിന്: ബട്ടൺ, സ്റ്റാറ്റസ് ബാഡ്ജ്)
  render?: (item: T) => ReactNode; 
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">ഡാറ്റ ലഭ്യമല്ല (No data available)</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {col.render ? col.render(row) : (row[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}