"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Users, UserCheck, Clock, FileText, 
  ArrowUpRight, ArrowDownRight, Zap, Target
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";

interface Stats {
  total_partners: number;
  pending_approvals: number;
  waitlist_count: number;
  total_contents: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/stats/")
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Stats fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <div className="flex items-center gap-3 text-primary mb-4">
            <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Genel Bakış</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Akademi <span className="text-primary italic">Metrikleri</span></h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<Users size={24} />} 
          label="Toplam Partner" 
          value={loading ? "..." : stats?.total_partners.toString() || "0"} 
          details="Aktif İş Ortakları"
          color="blue"
        />
        <StatCard 
          icon={<UserCheck size={24} />} 
          label="Bekleyen Onay" 
          value={loading ? "..." : stats?.pending_approvals.toString() || "0"} 
          details="Partnerlik Başvuruları"
          color="emerald"
          highlight={stats && stats.pending_approvals > 0}
        />
        <StatCard 
          icon={<Clock size={24} />} 
          label="Waitlist" 
          value={loading ? "..." : stats?.waitlist_count.toString() || "0"} 
          details="Sıradaki Adaylar"
          color="orange"
        />
        <StatCard 
          icon={<FileText size={24} />} 
          label="İçerik" 
          value={loading ? "..." : stats?.total_contents.toString() || "0"} 
          details="Yayınlanmış Ders"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <GlassCard className="p-10 border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
               <Target className="text-primary" /> Sistem Sağlığı
            </h3>
            <div className="space-y-6">
                {[
                  { label: "API Latency", value: "42ms", status: "optimal" },
                  { label: "Postgres Pool", value: "8/20", status: "optimal" },
                  { label: "CDN Cache Hit", value: "98.2%", status: "optimal" }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-sm font-black text-gray-900">{item.value}</span>
                       <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                  </div>
                ))}
            </div>
         </GlassCard>

         <GlassCard className="p-10 border-gray-100 shadow-sm bg-gray-900 text-white">
            <h3 className="text-xl font-black mb-6 italic">Hızlı Eylemler</h3>
            <div className="grid grid-cols-2 gap-4">
                <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Yeni</p>
                  <p className="text-sm font-bold">Duyuru Ekle</p>
                </button>
                <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Yönet</p>
                  <p className="text-sm font-bold">Kaynaklar</p>
                </button>
                <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Gözden Geçir</p>
                  <p className="text-sm font-bold">Aday Başvuruları</p>
                </button>
                <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left text-primary">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Sistem</p>
                  <p className="text-sm font-bold">Ayarlar</p>
                </button>
            </div>
         </GlassCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, details, color, highlight = false }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
  };

  return (
    <GlassCard className={`p-8 border-gray-100 hover:border-primary/20 transition-all group relative overflow-hidden ${highlight ? 'ring-2 ring-primary/20 ring-offset-2' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl border ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg italic">
           <ArrowUpRight size={14} /> 12%
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 mb-2">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter opacity-70 italic">{details}</p>
      </div>
      
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gray-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
    </GlassCard>
  );
}
