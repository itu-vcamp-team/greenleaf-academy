"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users, UserCheck, Clock, FileText,
  ArrowUpRight, Zap, Target, MessageSquare,
  Link2, Calendar, UserPlus, TrendingUp, UserX,
  BarChart3, Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankDistribution {
  PARTNER: number;
  UZMAN: number;
  MENTOR: number;
  LIDER: number;
  MASTER: number;
  MIMAR: number;
}

interface DayStat {
  date: string;   // "YYYY-MM-DD"
  count: number;
}

interface Stats {
  total_partners: number;
  total_guests: number;
  pending_approvals: number;
  new_partners_this_month: number;
  total_contents: number;
  avg_completion_pct: number;
  rank_distribution: RankDistribution;
  registrations_last_7_days: DayStat[];
}

interface Announcement {
  id: string;
  title: string;
  created_at: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  details: string;
  color: "blue" | "emerald" | "orange" | "indigo" | "rose" | "violet";
  highlight?: boolean | null;
  href?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ── Rank metadata (mirrors backend rank_utils) ────────────────────────────────
const RANK_META: Record<string, { label: string; emoji: string; color: string }> = {
  PARTNER: { label: "Partner", emoji: "👤", color: "bg-gray-400" },
  UZMAN:   { label: "Uzman",   emoji: "⭐", color: "bg-blue-500" },
  MENTOR:  { label: "Mentor",  emoji: "💼", color: "bg-purple-500" },
  LIDER:   { label: "Lider",   emoji: "💎", color: "bg-cyan-500" },
  MASTER:  { label: "Master",  emoji: "🔥", color: "bg-orange-500" },
  MIMAR:   { label: "Mimar",   emoji: "💠", color: "bg-teal-500" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
}

// ── Page Component ────────────────────────────────────────────────────────────
export default function AdminDashboardPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get("/admin/stats/"),
      apiClient.get("/announcements"),
    ])
      .then(([statsRes, annRes]) => {
        setStats(statsRes.data);
        setAnnouncements(annRes.data?.slice(0, 3) ?? []);
      })
      .catch((err) => {
        console.error("Admin stats fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const rankDist = stats?.rank_distribution;
  const totalRanked = rankDist
    ? Object.values(rankDist).reduce((a, b) => a + b, 0)
    : 0;

  const reg7 = stats?.registrations_last_7_days ?? [];
  const maxReg = reg7.length > 0 ? Math.max(...reg7.map((d) => d.count), 1) : 1;
  const totalReg7 = reg7.reduce((a, d) => a + d.count, 0);

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-3 text-primary mb-4">
          <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">Genel Bakış</span>
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Akademi <span className="text-primary italic">Metrikleri</span>
        </h1>
      </header>

      {/* ── Row 1: Core stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={22} />}
          label="Aktif Partner"
          value={loading ? "…" : (stats?.total_partners ?? 0).toString()}
          details="Onaylı iş ortağı"
          color="blue"
          href={`/${locale}/admin/users`}
        />
        <StatCard
          icon={<UserCheck size={22} />}
          label="Bekleyen Onay"
          value={loading ? "…" : (stats?.pending_approvals ?? 0).toString()}
          details="Aktivasyon bekliyor"
          color="emerald"
          highlight={stats && stats.pending_approvals > 0}
          href={`/${locale}/admin/users`}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Bu Ay Yeni"
          value={loading ? "…" : (stats?.new_partners_this_month ?? 0).toString()}
          details="Bu ay katılan partner"
          color="indigo"
        />
        <StatCard
          icon={<UserX size={22} />}
          label="Etkinlik Misafiri"
          value={loading ? "…" : (stats?.total_guests ?? 0).toString()}
          details="Kayıtsız etkinlik ziyaretçisi"
          color="orange"
          href={`/${locale}/admin/users`}
        />
      </div>

      {/* ── Row 2: Completion avg + Content count ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-8 border-border shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-violet-500/10 text-violet-500 rounded-2xl border border-violet-500/20">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Ortalama Tamamlanma</p>
              <p className="text-3xl font-black text-foreground">
                {loading ? "…" : `${stats?.avg_completion_pct ?? 0}%`}
              </p>
            </div>
          </div>
          <div className="h-2 bg-foreground/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: loading ? "0%" : `${stats?.avg_completion_pct ?? 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mt-2 italic">
            Tüm aktif partnerlerin ortalama eğitim ilerleme oranı
          </p>
        </GlassCard>

        <StatCard
          icon={<FileText size={22} />}
          label="Yayınlanan İçerik"
          value={loading ? "…" : (stats?.total_contents ?? 0).toString()}
          details="Yayınlanmış ders"
          color="rose"
          href={`/${locale}/admin/content`}
        />
      </div>

      {/* ── Row 3: Rank Distribution + 7-day registrations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Rank Distribution */}
        <GlassCard className="p-8 border-border shadow-sm relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <BarChart3 className="text-primary" size={20} /> Partner Rütbe Dağılımı
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 bg-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : totalRanked === 0 ? (
            <p className="text-foreground/40 text-sm italic">Henüz aktif partner yok.</p>
          ) : (
            <div className="space-y-3">
              {(Object.entries(RANK_META) as [string, { label: string; emoji: string; color: string }][]).map(
                ([rank, meta]) => {
                  const count = rankDist?.[rank as keyof RankDistribution] ?? 0;
                  const pct = totalRanked > 0 ? Math.round((count / totalRanked) * 100) : 0;
                  return (
                    <div key={rank} className="flex items-center gap-3">
                      <span className="text-base w-5 text-center">{meta.emoji}</span>
                      <span className="text-xs font-black text-foreground/60 w-14 shrink-0">{meta.label}</span>
                      <div className="flex-1 h-2.5 bg-foreground/8 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${meta.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
                        />
                      </div>
                      <span className="text-xs font-black text-foreground/40 w-8 text-right">{count}</span>
                    </div>
                  );
                }
              )}
            </div>
          )}
          <Link
            href={`/${locale}/admin/users`}
            className="mt-6 flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
          >
            Kullanıcı Yönetimi <ArrowUpRight size={14} />
          </Link>
        </GlassCard>

        {/* 7-day Registrations */}
        <GlassCard className="p-8 border-border shadow-sm relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <h3 className="text-xl font-black mb-2 flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={20} /> Son 7 Gün Kayıt
          </h3>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mb-6 italic">
            Toplam {totalReg7} yeni kayıt
          </p>
          {loading ? (
            <div className="h-32 bg-surface rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-2 h-32">
              {reg7.map((day, idx) => {
                const heightPct = maxReg > 0 ? Math.max((day.count / maxReg) * 100, 4) : 4;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-black text-foreground/40">{day.count || ""}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                      <motion.div
                        className={`w-full rounded-t-lg ${day.count > 0 ? "bg-emerald-500/70" : "bg-foreground/8"}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.05 }}
                        style={{ minHeight: "4px" }}
                      />
                    </div>
                    <span className="text-[8px] font-black text-foreground/30 text-center leading-tight">
                      {shortDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Row 4: Announcements + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Son Duyurular */}
        <GlassCard className="p-10 border-border shadow-sm relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <MessageSquare className="text-primary" size={20} /> Son Duyurular
          </h3>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-surface rounded-xl animate-pulse" />
              ))
            ) : announcements.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">Henüz duyuru yok.</p>
            ) : (
              announcements.map((ann) => (
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
            <Link
              href={`/${locale}/admin/content`}
              className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group"
            >
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <MessageSquare size={10} /> Yeni
              </p>
              <p className="text-sm font-bold text-foreground">Duyuru Ekle</p>
            </Link>
            <Link
              href={`/${locale}/admin/content`}
              className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group"
            >
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Link2 size={10} /> Yönet
              </p>
              <p className="text-sm font-bold text-foreground">Kaynaklar</p>
            </Link>
            <Link
              href={`/${locale}/admin/users?action=create`}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left group"
            >
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <UserPlus size={10} /> Yeni
              </p>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Kullanıcı Oluştur</p>
            </Link>
            <Link
              href={`/${locale}/admin/users`}
              className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group"
            >
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Users size={10} /> Yönet
              </p>
              <p className="text-sm font-bold text-foreground">Kullanıcı Yönetimi</p>
            </Link>
            <Link
              href={`/${locale}/admin/content`}
              className="p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all text-left group col-span-2"
            >
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Calendar size={10} /> Etkinlik
              </p>
              <p className="text-sm font-bold text-foreground">Takvim Yönetimi</p>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── StatCard Component ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, details, color, highlight = false, href }: StatCardProps) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-50   text-blue-600   border-blue-100   dark:bg-blue-950/30   dark:text-blue-400   dark:border-blue-900/40",
    emerald:"bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
    orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40",
    rose:   "bg-rose-50   text-rose-600   border-rose-100   dark:bg-rose-950/30   dark:text-rose-400   dark:border-rose-900/40",
    violet: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/40",
  };

  const card = (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <GlassCard
        className={`p-8 border-border hover:border-primary/20 transition-all group relative overflow-hidden h-full ${
          href ? "cursor-pointer" : ""
        } ${highlight ? "ring-2 ring-primary/20 ring-offset-2" : ""}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-2xl border ${colors[color]}`}>{icon}</div>
          {href && (
            <ArrowUpRight size={16} className="text-foreground/10 group-hover:text-primary transition-colors" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-foreground mb-2">{value}</p>
          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter opacity-70 italic">{details}</p>
        </div>
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-surface rounded-full opacity-50 group-hover:scale-110 transition-transform" />
      </GlassCard>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{card}</Link>;
  }
  return card;
}
