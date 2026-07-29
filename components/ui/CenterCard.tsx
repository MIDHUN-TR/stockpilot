"use client";

import React from "react";
import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export default function Card({ children }: Props) {
  return React.createElement(
    "div",
    { className: "min-h-screen flex items-center justify-center bg-black-100" },
    React.createElement(
      "div",
      { className: "bg-black p-6 rounded-lg shadow-md w-full max-w-sm" },
      children
    )
  );
}
