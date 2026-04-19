"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useTranslations } from "next-intl";

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

  if (!stats) return <div className="h-16 bg-gray-50 rounded-xl animate-pulse mb-6 border border-gray-100" />;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <StatCard 
        label="Shorts" 
        color="blue" 
        completed={stats.shorts.completed} 
        total={stats.shorts.total} 
        percentage={stats.shorts.percentage} 
        t_progress={t("progress")}
        t_completed={t("completed")}
      />
      <StatCard 
        label="Masterclass" 
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

function StatCard({ label, completed, total, percentage, color, t_progress, t_completed }: any) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-bold ${color === "blue" ? "text-blue-600" : "text-emerald-600"}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-2 font-medium">
        {completed}/{total} {t_completed.toLowerCase()}
      </p>
    </div>
  );
}
