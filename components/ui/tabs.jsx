"use client";

import * as React from "react";
import { cn } from "./cn";

export function Tabs({ defaultValue, children, className }) {
  const [active, setActive] = React.useState(defaultValue);

  return (
    <div className={cn("w-full", className)}>
      {/* Pass `active` and `setActive` to all children */}
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { active, setActive })
      )}
    </div>
  );
}

export function TabsList({ children, active, setActive }) {
  return (
    <div className="flex border-b mb-4">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { active, setActive })
      )}
    </div>
  );
}

export function TabsTrigger({ value, children, active, setActive }) {
  const isActive = active === value;
  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
        isActive
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, active, children }) {
  return active === value ? <div className="mt-2">{children}</div> : null;
}
