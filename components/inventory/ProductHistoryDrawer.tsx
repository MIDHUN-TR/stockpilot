"use client"

import React ,{useEffect,useState} from "react"
import { X,Clock,PackagePlus,PackageMinus,Tag } from "lucide-react"


// Create a interface for perfectly matching payload and API response
export interface InventoryHistory {
    id:number;
    productId:number;
    warehouseId:number;
    quantity:number;
    referenceType: "RETAIL_BILL" | "ECOMMERCE_ORDER" | "PURCHASE_ORDER" | "OPENING_STOCK" | "MANUAL_ADJUSTMENT" | "INTERNAL_TRANSFER" | "WHOLESALE_BILL";
    referenceId?: number;
    note?:string;
    movementType:"IN" | "OUT"  | "ADJUSTMENT" ;
    createdAt:string;
    creator?:{name:string;email:string;};
    warehouse?:{name:string};
}

// Create a interface for ProductHistoryDrawerProps

interface ProductHistoryDrawerProps{
    isOpen:boolean;
    onClose:()=>void ; 
    productId:number |null;
    productName:string;
}

export function ProductHistoryDrawer({isOpen,onClose,productId,productName}:ProductHistoryDrawerProps){
    const [history,setHistory] = useState<InventoryHistory[]>([]);
    const [isLoading,setIsLoading] =useState(false);

    useEffect(()=>{
        if(isOpen && productId){
            const fetchHistory = async() =>{
                setIsLoading(true);
                try{
                    const response =  await fetch(`/api/stock-movements?productId=${productId}`);
                    const result = await response.json();
                    if(response.ok){
                        setHistory(result.data || []);
                    }
                    
                }catch(error){
                        console.error("Failed to fetch history",error);
                    }finally{
                            setIsLoading(false)
                    }
            }
            fetchHistory()
        }
        
    },[isOpen,productId])

    // Helper function to format reference type for UI (e.g., "RETAIL_BILL" -> "Retail Bill")
  const formatReferenceType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{productName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-gray-500 animate-pulse">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <Clock size={40} className="opacity-20" />
              <p>No history found for this product.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                {history.map((record) => (
                  <div key={record.id} className="mb-6 ml-6">
                    {/* Status Icon */}
                    <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white dark:ring-gray-900 
                      ${record.movementType === 'IN' ? 'bg-green-100 text-green-600' : 
                        record.movementType === 'OUT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {record.movementType === 'IN' ? <PackagePlus size={16} /> : 
                       record.movementType === 'OUT' ? <PackageMinus size={16} /> : <Clock size={16} />}
                    </span>
                    
                    {/* Record Details Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          {record.movementType === 'IN' ? 'Stock Added' : 
                           record.movementType === 'OUT' ? 'Stock Removed' : 'Stock Adjusted'}
                          
                          {/* Quantity Badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                            ${record.movementType === 'IN' ? 'text-green-700 bg-green-100' : 
                              record.movementType === 'OUT' ? 'text-red-700 bg-red-100' : 'text-blue-700 bg-blue-100'}`}>
                            {record.movementType === 'IN' ? '+' : record.movementType === 'OUT' ? '-' : ''}{record.quantity}
                          </span>
                        </h3>
                        <time className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      
                      {/* Note / Reason */}
                      {record.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {record.note}
                        </p>
                      )}

                      {/* Reference Type & Creator Info */}
                      <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Tag size={12} />
                          <span>{formatReferenceType(record.referenceType)}</span>
                          {record.referenceId && <span>(#{record.referenceId})</span>}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Updated by: <span className="font-medium">{record.creator?.name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}