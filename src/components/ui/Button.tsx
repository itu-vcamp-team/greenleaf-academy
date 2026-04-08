"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-light shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      secondary: "bg-white/10 text-white hover:bg-white/20",
      outline: "border border-white/10 text-white hover:bg-white/5",
      ghost: "text-white/60 hover:text-white hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-8 py-4 text-base",
    };

    // Separating motion props from standard button props to avoid type conflicts
    const { whileHover, whileTap, transition, ...rest } = props as any;

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && children}
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </motion.button>
    );
  }
);

Button.displayName = "Button";
