import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface TrendProps {
  value: string | number;
  type: 'up' | 'down' | 'neutral';
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: TrendProps;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  isLoading = false,
}) => {
  // 1. Handle Skeleton Loading State
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm animate-pulse flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  // 2. Map Trend Styling Dynamically
  // Increased brightness of the neutral text and badge opacity for dark mode
  const trendConfig = {
    up: { 
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15', 
      icon: ArrowUpRight 
    },
    down: { 
      color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15', 
      icon: ArrowDownRight 
    },
    neutral: { 
      color: 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600/30', 
      icon: Minus 
    },
  };

  const TrendIcon = trend ? trendConfig[trend.type].icon : null;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      {/* Top Row: Title and Icon */}
      <div className="flex items-center justify-between gap-4 mb-2">
        {/* Brightened title in dark mode to gray-300 */}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
          {title}
        </span>
        {icon && (
          // Brightened icon in dark mode to gray-200
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-200 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Middle Row: Main Metric Value */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {value}
        </h3>
      </div>

      {/* Bottom Row: Contextual Trend */}
      {trend && (
        <div className="flex items-center gap-2 mt-4 text-xs font-medium">
          <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${trendConfig[trend.type].color}`}>
            {TrendIcon && <TrendIcon size={14} strokeWidth={2.5} />}
            {trend.value}
          </span>
          {trend.label && (
            // Brightened trend label in dark mode to gray-400 (was gray-500)
            <span className="text-gray-500 dark:text-gray-400 truncate">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};