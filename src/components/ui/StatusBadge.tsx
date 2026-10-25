import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Circle } from 'lucide-react';

export type BadgeStatus = 'success' | 'error' | 'warning' | 'info' | 'default';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  /** The semantic status of the badge */
  status?: BadgeStatus;
  /** The text content to display */
  children?: React.ReactNode;
  /** Whether to show the default status icon, or a custom icon element */
  icon?: boolean | React.ReactNode;
  /** Size of the badge */
  size?: BadgeSize;
  /** Optional extra classes for overrides */
  className?: string;
}

export function StatusBadge({
  status = 'default',
  children,
  icon = true,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  // Edge case: If there's no content, don't render an empty blob
  if (!children && typeof icon === 'boolean' && !icon) {
    return null;
  }

  // 1. Style Dictionaries
  const statusStyles: Record<BadgeStatus, string> = {
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800/50',
    error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800/50',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800/50',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/50',
    default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes: Record<BadgeSize, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  // 2. Icon Resolution
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon; // Render custom icon if passed

    const sizePx = iconSizes[size];
    const iconProps = { size: sizePx, className: 'shrink-0' };

    switch (status) {
      case 'success': return <CheckCircle2 {...iconProps} />;
      case 'error': return <AlertCircle {...iconProps} />;
      case 'warning': return <AlertTriangle {...iconProps} />;
      case 'info': return <Info {...iconProps} />;
      default: return <Circle {...iconProps} />;
    }
  };

  // 3. Render
  return (
    <span
      // role="status" is crucial for screen readers to announce state changes
      role="status"
      className={`
        inline-flex items-center justify-center font-medium border rounded-full whitespace-nowrap
        ${statusStyles[status]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {renderIcon()}
      {children && <span>{children}</span>}
    </span>
  );
}