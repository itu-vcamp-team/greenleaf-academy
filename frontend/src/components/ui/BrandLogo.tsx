"use client";

import { Leaf } from "lucide-react";
import { motion } from "framer-motion";

export function BrandLogo() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 group cursor-pointer"
    >
      <div className="relative">
        <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/40 transition duration-500"></div>
        <div className="relative bg-foreground/5 p-2 rounded-xl border border-foreground/5 group-hover:border-primary/50 transition duration-500">
          <Leaf className="w-6 h-6 text-primary" fill="currentColor" fillOpacity={0.2} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition duration-500">
          Greenleaf<span className="text-primary-light">.</span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
          Akademi
        </span>
      </div>
    </motion.div>
  );
}
