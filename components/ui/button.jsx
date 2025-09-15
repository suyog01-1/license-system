import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition",
        className
      )}
      {...props}
    />
  );
}
