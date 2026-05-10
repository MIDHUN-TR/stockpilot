"use client";
import React, { useState, InputHTMLAttributes } from 'react';
import styles from './AuthInput.module.css';

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
}

export default function AuthInput({
    label, 
    type ,
    icon, 
    error,
    className,
    onFocus,
    onBlur,
    ...props
}: AuthInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''} ${error ? styles.error : ''}`}>
                {icon && (
                    <div className={styles.iconWrapper}>
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={`${styles.input} ${icon ? styles.hasIcon : ''}`}
                    placeholder=" "
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                <label className={`${styles.label} ${icon ? styles.hasIcon : ''}`}>
                    {label}
                </label>
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
}