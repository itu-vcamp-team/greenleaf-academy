"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Zap, PlayCircle, Trophy } from "lucide-react";

interface Stats {
  shorts: { completed: number; total: number; percentage: number };
  masterclass: { completed: number; total: number; percentage: number };
}

export default function MyProgressStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const t = useTranslations("academy");

  useEffect(() => {
    apiClient.get("/progress/my-stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Stats fetch error:", err));
  }, []);

  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {[1, 2].map(i => (
        <div key={i} className="h-32 glass animate-pulse rounded-[2rem] border border-foreground/5 shadow-sm" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <StatCard 
        label="Momentum Shorts" 
        icon={<Zap className="w-5 h-5" />}
        color="blue" 
        completed={stats.shorts.completed} 
        total={stats.shorts.total} 
        percentage={stats.shorts.percentage} 
        t_progress={t("progress")}
        t_completed={t("completed")}
      />
      <StatCard 
        label="Masterclass Series" 
        icon={<PlayCircle className="w-5 h-5" />}
        color="emerald" 
        completed={stats.masterclass.completed} 
        total={stats.masterclass.total} 
        percentage={stats.masterclass.percentage} 
        t_progress={t("progress")}
        t_completed={t("completed")}
      />
    </div>
  );
}

function StatCard({ label, icon, completed, total, percentage, color, t_progress, t_completed }: any) {
  const colors: any = {
    blue: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/10",
      text: "text-blue-500",
      bar: "bg-blue-500",
      iconBg: "bg-blue-500/10"
    },
    emerald: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/10",
      text: "text-emerald-500",
      bar: "bg-emerald-500",
      iconBg: "bg-emerald-500/10"
    }
  };

  const c = colors[color];
  const isCompleted = percentage >= 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group overflow-hidden bg-surface border border-foreground/5 rounded-[2rem] p-6 shadow-sm hover:border-primary/20 transition-all duration-500`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${c.iconBg} ${c.text} group-hover:scale-110 transition-transform duration-500`}>
            {isCompleted ? <Trophy className="w-5 h-5" /> : icon}
          </div>
          <div>
            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1 block">{label}</span>
            <div className="flex items-center gap-2">
               {total > 0 ? (
                 <>
                   <h4 className="text-xl font-black text-foreground leading-none">
                     {completed}<span className="text-foreground/20 mx-1">/</span>{total}
                   </h4>
                   <span className="text-[10px] font-bold text-foreground/30 mt-1">{t_completed}</span>
                 </>
               ) : (
                 <h4 className="text-sm font-bold text-foreground/40 leading-none italic">
                   Henüz İçerik Yok
                 </h4>
               )}
            </div>
          </div>
        </div>
        <div className={`text-sm font-black italic ${c.text} px-3 py-1 rounded-full border border-foreground/5 bg-foreground/5 shadow-sm min-w-[3rem] text-center`}>
          %{total > 0 ? Math.round(percentage) : 0}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/30">
           <span>{t_progress}</span>
           <span>{isCompleted ? "Zirve" : "Devam Ediyor"}</span>
        </div>
        <div className="h-3 bg-foreground/5 rounded-full overflow-hidden p-0.5 border border-foreground/5 relative">
          {total > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full ${c.bar} shadow-lg shadow-current/20 relative overflow-hidden`}
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          )}
          {total === 0 && (
            <div className="absolute inset-0 bg-foreground/5 flex items-center justify-center">
              <div className="w-1/2 h-0.5 bg-foreground/10 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${c.bg} rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000`} />
    </motion.div>
  );
}
