"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest pl-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-300 focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10",
              error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10",
              className
            )}
            {...props}
          />
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        </div>
        {error && <span className="text-[10px] text-red-400 pl-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
