import React, { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectBoxProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** The text to display above the select box */
  label?: string;
  /** Array of options to render */
  options: SelectOption[];
  /** Error message to display below the input */
  error?: string;
  /** Optional placeholder text (renders as a disabled first option) */
  placeholder?: string;
}

export const SelectBox = React.forwardRef<HTMLSelectElement, SelectBoxProps>(
  (
    { label, options, error, placeholder, className = '', id, disabled, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className={`text-sm font-medium transition-colors ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full rounded-md border px-3 py-2 outline-none transition-colors
            text-base sm:text-sm 
            bg-white text-gray-900 dark:bg-gray-800 dark:text-white
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
            dark:disabled:bg-gray-900 dark:disabled:text-gray-600
            focus:ring-2
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <span className="text-xs text-red-500 dark:text-red-400">
            {error}
          </span>
        )}
      </div>
    );
  }
);

SelectBox.displayName = 'SelectBox';