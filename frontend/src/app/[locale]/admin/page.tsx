"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Users, UserCheck, Clock, FileText, 
  ArrowUpRight, Zap, Target, MessageSquare,
  Link2, Calendar, UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";

interface Stats {
  total_partners: number;
  pending_approvals: number;
  total_contents: number;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function AdminDashboardPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get("/admin/stats/"),
      apiClient.get("/announcements"),
    ]).then(([statsRes, annRes]) => {
      setStats(statsRes.data);
      setAnnouncements(annRes.data?.slice(0, 3) ?? []);
    }).catch(err => {
      console.error("Admin stats fetch error:", err);
    }).finally(() => {
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
        <h1 className="text-4xl font-black text-foreground tracking-tight">Akademi <span className="text-primary italic">Metrikleri</span></h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          icon={<Users size={24} />} 
          label="Toplam Partner" 
          value={loading ? "..." : stats?.total_partners.toString() || "0"} 
          details="Aktif İş Ortakları"
          color="blue"
          href={`/${locale}/admin/users`}
        />
        <StatCard 
          icon={<UserCheck size={24} />} 
          label="Bekleyen Onay" 
          value={loading ? "..." : stats?.pending_approvals.toString() || "0"} 
          details="Partnerlik Başvuruları"
          color="emerald"
          highlight={stats && stats.pending_approvals > 0}
          href={`/${locale}/admin/users`}
        />
        <StatCard 
          icon={<FileText size={24} />} 
          label="İçerik" 
          value={loading ? "..." : stats?.total_contents.toString() || "0"} 
          details="Yayınlanmış Ders"
          color="indigo"
          href={`/${locale}/admin/content`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Son Duyurular */}
        <GlassCard className="p-10 border-border shadow-sm relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <MessageSquare className="text-primary" size={20} /> Son Duyurular
          </h3>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-surface rounded-xl animate-pulse" />
              ))
            ) : announcements.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">Henüz duyuru yok.</p>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{ann.title}</p>
                    <p className="text-[10px] text-foreground/40 mt-0.5">
                      {new Date(ann.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href={`/${locale}/admin/content`}
            className="mt-6 flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
          >
            Tümünü Yönet <ArrowUpRight size={14} />
          </Link>
        </GlassCard>

        {/* Hızlı Eylemler */}
        <GlassCard className="p-10 border-border shadow-sm bg-surface">
          <h3 className="text-xl font-black mb-6 italic text-foreground">Hızlı Eylemler</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/${locale}/admin/content`} className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group">
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <MessageSquare size={10} /> Yeni
              </p>
              <p className="text-sm font-bold text-foreground">Duyuru Ekle</p>
            </Link>
            <Link href={`/${locale}/admin/content`} className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group">
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Link2 size={10} /> Yönet
              </p>
              <p className="text-sm font-bold text-foreground">Kaynaklar</p>
            </Link>
            <Link href={`/${locale}/admin/users?action=create`} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left group">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <UserPlus size={10} /> Yeni
              </p>
              <p className="text-sm font-bold text-emerald-900">Kullanıcı Oluştur</p>
            </Link>
            <Link href={`/${locale}/admin/users`} className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group">
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Users size={10} /> Yönet
              </p>
              <p className="text-sm font-bold text-foreground">Kullanıcı Yönetimi</p>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, details, color, highlight = false, href }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
  };

  return (
    <Link href={href || "#"}>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <GlassCard className={`p-8 border-border hover:border-primary/20 transition-all group relative overflow-hidden cursor-pointer ${highlight ? 'ring-2 ring-primary/20 ring-offset-2' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className={`p-3 rounded-2xl border ${colors[color]}`}>
              {icon}
            </div>
            <ArrowUpRight size={16} className="text-foreground/10 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-foreground mb-2">{value}</p>
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter opacity-70 italic">{details}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-surface rounded-full opacity-50 group-hover:scale-110 transition-transform" />
        </GlassCard>
      </motion.div>
    </Link>
  );
}

