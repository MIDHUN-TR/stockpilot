"use client";
import * as React from "react";
import styles from "./InputBox.module.css";

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  name: string;
}

export default function AuthInput({
  label,
  type,
  icon,
  name,
  error,
  className,
  onFocus,
  onBlur,
  ...props
}: AuthInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div
        className={`${styles.inputWrapper} ${isFocused ? styles.focused : ""} ${error ? styles.error : ""}`}
      >
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <input
          name={name}
          type={type}
          className={`${styles.input} ${icon ? styles.hasIcon : ""}`}
          placeholder=" "
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label className={`${styles.label} ${icon ? styles.hasIcon : ""}`}>
          {label}
        </label>
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
