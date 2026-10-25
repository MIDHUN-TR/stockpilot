"use client";
import React, { useState } from 'react';
import styles from './PasswordBox.module.css';

type Props = {
  label: string;
  name: string;
};

export default function PasswordValidator({ label, name }: Props) {
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength
  let score = 0;
  if (password.length > 0) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const strength = Math.min(score, 4);

  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ff4d4f', '#ff4d4f', '#faad14', '#52c41a', '#52c41a']; // Red, Red, Yellow, Green, Green

  return React.createElement(
    "div",
    { className: styles.container },
    React.createElement(
      "div",
      { className: `${styles.inputWrapper} ${isFocused ? styles.focused : ''}` },
      React.createElement("input", {
        type: showPassword ? "text" : "password",
        className: styles.input,
        value: password,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        placeholder: name,
        name: name,
      }),
      React.createElement("label", { className: styles.label }, label),
      React.createElement(
        "button",
        {
          type: "button",
          className: styles.toggleBtn,
          onClick: () => setShowPassword(!showPassword),
          "aria-label": showPassword ? "Hide password" : "Show password",
        },
        showPassword
          ? React.createElement(
              "svg",
              {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              React.createElement("path", {
                d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24",
              }),
              React.createElement("line", { x1: 1, y1: 1, x2: 23, y2: 23 })
            )
          : React.createElement(
              "svg",
              {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              React.createElement("path", {
                d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
              }),
              React.createElement("circle", { cx: 12, cy: 12, r: 3 })
            )
      )
    ),
    React.createElement(
      "div",
      { className: `${styles.strengthContainer} ${password.length > 0 ? styles.visible : ''}` },
      React.createElement(
        "div",
        { className: styles.strengthBars },
        [...Array(4)].map((_, index) =>
          React.createElement("div", {
            key: index,
            className: `${styles.strengthBar} ${index < strength ? styles.filled : ''}`,
            style: {
              backgroundColor: index < strength ? strengthColors[strength] : 'rgba(150, 150, 150, 0.2)',
              boxShadow: index < strength ? `0 0 8px ${strengthColors[strength]}40` : 'none',
            },
          })
        )
      ),
      React.createElement(
        "span",
        {
          className: styles.strengthLabel,
          style: { color: strengthColors[strength] || '#888' },
        },
        password.length > 0 ? strengthLabels[strength] : ''
      )
    )
  );
}