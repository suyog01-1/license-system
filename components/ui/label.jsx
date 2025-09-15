import * as React from "react";
import { cn } from "./cn";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("block text-sm font-medium text-gray-700", className)}
      {...props}
    />
  );
}
