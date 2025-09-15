import * as React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-2xl border bg-white shadow p-4", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h2 className={cn("text-xl font-bold text-gray-900", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn("mt-4 flex justify-end space-x-2", className)} {...props} />
  );
}
