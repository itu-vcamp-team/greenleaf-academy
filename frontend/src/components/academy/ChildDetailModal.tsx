"use client";

import { useState } from "react";
import { Zap, CheckCircle, Clock, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressDetail {
  content_id: string;
  title: string;
  type: "SHORT" | "MASTERCLASS";
  status: "not_started" | "in_progress" | "completed";
  percentage: number;
}

interface ChildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  progress: ProgressDetail[];
}

export default function ChildDetailModal({ 
  isOpen, 
  onClose, 
  childName, 
  progress 
}: ChildDetailModalProps) {
  const t = useTranslations("academy");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProgress = progress.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-background rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-foreground/10"
        >
          {/* Header */}
          <div className="p-8 border-b border-foreground/10 flex justify-between items-start bg-gradient-to-br from-background to-surface">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">{childName}</h2>
              <p className="text-foreground/40 text-sm font-medium mt-1 uppercase tracking-widest">{t("academy_progress")}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/40 hover:text-foreground"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-8 py-4 bg-surface/50 border-b border-foreground/10">
             <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-foreground/30" />
                <input 
                  type="text" 
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-foreground/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm text-foreground placeholder-foreground/30"
                />
             </div>
          </div>

          {/* Progress List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {filteredProgress.length === 0 ? (
              <div className="text-center py-12 text-foreground/30 italic font-medium">{t("no_results")}</div>
            ) : (
              filteredProgress.map((item) => (
                <div 
                  key={item.content_id}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-foreground/10 hover:border-primary/20 hover:bg-primary/[0.02] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl border ${
                      item.type === "SHORT" 
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-foreground/40 mt-0.5">{item.type}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                    <div className="flex items-center gap-2">
                       {item.status === "completed" ? (
                         <span className="text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20 uppercase">{t("status_completed")}</span>
                       ) : item.status === "in_progress" ? (
                         <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 uppercase">{t("status_in_progress")}</span>
                       ) : (
                         <span className="text-[10px] font-black text-foreground/40 bg-foreground/5 px-2 py-1 rounded-lg border border-foreground/10 uppercase">{t("status_not_started")}</span>
                       )}
                       <span className="text-xs font-black text-foreground">{Math.round(item.percentage)}%</span>
                    </div>
                    <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                       <div 
                        className={`h-full transition-all duration-1000 ${
                          item.status === "completed" ? "bg-green-500" : "bg-primary"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                       />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 bg-surface/80 border-t border-foreground/10 flex justify-center">
            <p className="text-[10px] text-foreground/30 font-medium uppercase tracking-[0.2em]">
              Greenleaf Akademi • Gerçek Zamanlı Takip Sistemi
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
