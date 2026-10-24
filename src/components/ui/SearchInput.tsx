// Tells Next.js App Router that this component uses client-side interactivity (hooks, event listeners)
"use client";

import React, { useState, useEffect, useRef, forwardRef } from 'react';
// Importing lightweight SVG icons for the UI
import { Search, X } from 'lucide-react';

// 1. We extend standard HTML input props (React.InputHTMLAttributes) so users can pass things 
// like 'maxLength', 'onBlur', or 'onFocus' natively. 
// 2. We use Omit<..., 'onChange'> because the native onChange returns an Event, 
// but we want our custom onChange to return just the debounced string.
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string; // The controlled value passed down from the parent
  onChange: (value: string) => void; // Custom callback returning the debounced string
  delay?: number; // How long to wait (in ms) after the user stops typing
  showIcon?: boolean; // Toggle the magnifying glass icon
  allowClear?: boolean; // Toggle the 'X' button to quickly clear the input
}

// We use forwardRef so the parent component can attach a ref to this input 
// to programmatically control it (e.g., calling ref.current.focus() on a "Cmd+K" shortcut)
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  delay = 300, // 300ms is the industry standard sweet spot: fast enough to feel responsive, slow enough to save API calls
  placeholder = "Search...",
  className = "", // Extracted so we can merge parent styles with our base wrapper styles
  showIcon = true,
  allowClear = true,
  disabled = false,
  ...props // Captures all other native HTML attributes
}, forwardedRef) => {
  // localValue: What the user actually sees in the UI right now. It updates instantly on every keystroke.
  const [localValue, setLocalValue] = useState<string>(value);
  
  // prevValue: Tracks the last value passed from the parent. We need this to detect if the parent 
  // forced a change from the outside (like resetting the form).
  const [prevValue, setPrevValue] = useState<string>(value);
  
  // We store the onChange callback in a ref. 
  // WHY? If the parent recreates the onChange function on every render, putting it in the useEffect 
  // dependency array below would cause the debounce timer to reset on every render, breaking the component.
  const onChangeRef = useRef(onChange);
  
  // Tracks if the component has painted yet to prevent the debounce from firing immediately on page load
  const isMounted = useRef(false);
  
  // We need our own internal ref to focus the input when the user clicks the 'X' button.
  const internalRef = useRef<HTMLInputElement>(null);

  // useImperativeHandle merges our internalRef with the parent's forwardedRef.
  // This allows BOTH this component and the parent component to call .focus() on the input.
  React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLInputElement);

  // Keeps the onChange ref perfectly synced with the latest function passed from the parent
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // RENDER-PHASE SYNC: 
  // WHY? If the parent changes the value (e.g., clears the search state), we need to update our local state.
  // We do this during the render phase (not in useEffect) to prevent React from rendering twice (cascading renders).
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }

  // DEBOUNCE LOGIC
  useEffect(() => {
    // Skip the very first render so we don't accidentally call onChange(value) on page load
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // Set a timer to call the parent's onChange after the delay finishes
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, delay);

    // CLEANUP: If the user types another letter before the delay is up, 
    // React runs this cleanup function, canceling the previous timer and starting a new one.
    return () => clearTimeout(timer);
  }, [localValue, delay]);

  // UX ENHANCEMENT: Bypass the debounce when clearing the input manually
  const handleClear = () => {
    if (disabled) return;
    setLocalValue(''); 
    setPrevValue(''); // Update prevValue so the render-phase sync doesn't get confused
    onChangeRef.current(''); // Fire parent onChange immediately (don't make them wait 300ms for a clear)
    internalRef.current?.focus(); // Instantly pop the user's cursor back into the input so they can type again
  };

  return (
    // Wrapper div needs relative positioning so the absolute positioned icon/clear button sit inside it
    <div className={`relative w-full ${className}`}>
      
      {/* Decorative Search Icon */}
      {showIcon && (
        // pointer-events-none ensures that if the user clicks the icon, the click passes through to the input beneath it
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search 
            size={18} 
            // We dim the icon specifically when the input is disabled
            className={`transition-colors ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`} 
            aria-hidden="true" // Hides the icon from screen readers (it's purely decorative)
          />
        </div>
      )}

      <input
        ref={internalRef}
        // WHY type="text"? If we use type="search", Safari/Chrome inject their own ugly, un-styleable native 'X' buttons 
        // that overlap with our custom Lucide clear button.
        type="text" 
        value={localValue}
        // Update local state instantly on keystroke so the UI feels perfectly responsive
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full py-2 rounded-lg border outline-none transition-all duration-200 shadow-sm text-sm
          /* DYNAMIC PADDING: If icons/buttons are enabled, we add heavy padding to prevent text from typing underneath them */
          ${showIcon ? 'pl-10' : 'pl-4'}
          ${allowClear ? 'pr-10' : 'pr-4'}
          
          /* LIGHT MODE: White background, subtle border, blue focus ring */
          bg-white border-gray-200 text-gray-900 placeholder-gray-400 
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
          
          /* DARK MODE: Charcoal background, inverse text, lighter blue focus ring for contrast */
          dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 
          dark:focus:border-blue-400 dark:focus:ring-blue-400/20
          
          /* DISABLED: Drops opacity, changes cursor, and subtly grays out the background */
          disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900
        `}
        {...props} // Spreads native HTML attributes (like autoFocus, maxLength, name, etc.)
      />

      {/* Clear Button */}
      {/* Only render if allowClear is true AND there is actually text to clear */}
      {allowClear && localValue.length > 0 && (
        <button
          type="button" // CRITICAL: If omitted, clicking this inside a <form> will submit the form and refresh the page
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear search" // A11y requirement since the button only contains an icon without text
          className={`
            absolute inset-y-0 right-0 pr-3 flex items-center
            text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
            transition-colors focus:outline-none
            /* If disabled, hide the button visually but keep it mounted, remove pointer cursor */
            ${disabled ? 'cursor-not-allowed opacity-0' : 'cursor-pointer'}
          `}
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

// React DevTools and ESLint require this when using forwardRef, 
// otherwise the component shows up as "Anonymous" in debugging tools.
SearchInput.displayName = 'SearchInput';