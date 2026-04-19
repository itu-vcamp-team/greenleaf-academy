"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Users, CheckCircle, Clock, Phone, 
  MessageCircle, Mail, UserPlus, Loader2,
  MoreHorizontal, CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

interface WaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  supervisor_name: string;
  message: string;
  created_at: string;
  is_processed: boolean;
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/waitlist/admin");
      setEntries(res.data);
    } catch (err) {
      console.error("Fetch waitlist error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProcessed = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/waitlist/${id}/process`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Process error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-purple-500 mb-2">
              <UserPlus className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Talep Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Bekleme <span className="text-purple-500 italic">Listesi</span></h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
         {loading ? (
             <div className="py-20 flex justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin opacity-20" />
             </div>
         ) : entries.length === 0 ? (
             <GlassCard className="p-20 text-center border-gray-100 italic text-gray-400 font-medium">
                Yeni bekleme listesi başvurusu bulunmuyor.
             </GlassCard>
         ) : (
           <AnimatePresence mode="popLayout">
             {entries.map((entry) => (
               <motion.div
                 key={entry.id}
                 layout
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, x: -50 }}
               >
                 <GlassCard className="p-8 border-gray-100 hover:border-purple-200 transition-all shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 font-black text-xl border border-purple-100">
                       {entry.full_name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                       <h3 className="text-xl font-black text-gray-900 leading-none">{entry.full_name}</h3>
                       <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-400">
                          <span className="flex items-center gap-1.5"><Mail size={14} className="text-gray-300"/> {entry.email}</span>
                          <span className="flex items-center gap-1.5"><Phone size={14} className="text-gray-300"/> {entry.phone || "N/A"}</span>
                          <span className="flex items-center gap-1.5 font-bold text-purple-400/80"><Users size={14} /> Üst Kol: {entry.supervisor_name || "Belirtilmedi"}</span>
                       </div>
                       
                       {entry.message && (
                         <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 italic leading-relaxed">
                            "{entry.message}"
                         </div>
                       )}
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                       <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={12} /> {new Date(entry.created_at).toLocaleString()}
                       </div>
                       <Button 
                         onClick={() => handleMarkProcessed(entry.id)}
                         disabled={processingId === entry.id}
                         className="rounded-2xl px-8 py-4 bg-white border-2 border-purple-500/20 text-purple-600 hover:bg-purple-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/5 group"
                       >
                         {processingId === entry.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} className="group-hover:scale-110 transition-transform" />}
                         {processingId === entry.id ? "İŞLENİYOR..." : "İŞLENDİ OLARAK İŞARETLE"}
                       </Button>
                    </div>
                 </GlassCard>
               </motion.div>
             ))}
           </AnimatePresence>
         )}
      </div>
    </div>
  );
}
