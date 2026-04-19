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
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-white to-gray-50">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{childName}</h2>
              <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">{t("academy")} {t("progress")}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100">
             <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-gray-300" />
                <input 
                  type="text" 
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
             </div>
          </div>

          {/* Progress List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {filteredProgress.length === 0 ? (
              <div className="text-center py-12 opacity-30 italic font-medium">Sonuç bulunamadı</div>
            ) : (
              filteredProgress.map((item) => (
                <div 
                  key={item.content_id}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.01] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl border ${
                      item.type === "SHORT" 
                        ? "bg-blue-50 text-blue-500 border-blue-100" 
                        : "bg-emerald-50 text-emerald-500 border-emerald-100"
                    }`}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-0.5">{item.type}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                    <div className="flex items-center gap-2">
                       {item.status === "completed" ? (
                         <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">TAMAMLANDI</span>
                       ) : item.status === "in_progress" ? (
                         <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">İZLENİYOR</span>
                       ) : (
                         <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">BAŞLAMADI</span>
                       )}
                       <span className="text-xs font-black text-gray-900">{Math.round(item.percentage)}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
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
          <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
              Greenleaf Akademi • Gerçek Zamanlı Takip Sistemi
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
