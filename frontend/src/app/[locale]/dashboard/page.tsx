"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Target, Award, ArrowUpRight,
  Shield, Zap, Lock, ChevronRight, UserPlus, Info, Bell, Megaphone,
} from "lucide-react";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import MyProgressStats from "@/components/academy/MyProgressStats";
import ReferenceCodeGenerator from "@/components/academy/ReferenceCodeGenerator";
import ChildDetailModal from "@/components/academy/ChildDetailModal";
import { RankBadge, type RankKey } from "@/components/ui/RankBadge";
import apiClient from "@/lib/api-client";
import { useUserRole } from "@/context/UserRoleContext";
import { NextMeetingCounter } from "@/components/dashboard/NextMeetingCounter";

interface ProgressDetail {
  content_id: string;
  title: string;
  type: "SHORT" | "MASTERCLASS";
  status: "not_started" | "in_progress" | "completed";
  percentage: number;
}

interface ChildUser {
  id: string;
  full_name: string;
  partner_id: string;
  role: string;
  shorts_percentage: number;
  masterclass_percentage: number;
  is_active: boolean;
  rank: RankKey;
  rank_label: string;
  rank_emoji: string;
  rank_color: string;
  earned_points: number;
  max_points: number;
  rank_percentage: number;
}

interface RankData {
  rank: RankKey;
  rank_label: string;
  rank_emoji: string;
  rank_color: string;
  earned_points: number;
  max_points: number;
  rank_percentage: number;
}

interface Announcement {
  id: string;
  title: string;
  body?: string;
  pinned?: boolean;
  created_at: string;
  /** Computed in useEffect to avoid impure Date.now() during render */
  isNew?: boolean;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Sort: pinned first → newest first. isNew is set to false here; overridden in useEffect. */
function sortAnnouncements(data: Announcement[]): Announcement[] {
  return [...data]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map((ann) => ({ ...ann, isNew: false }));
}

export default function DashboardPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations("academy");
  const { role } = useUserRole();
  const isGuest = role === "GUEST";

  const [children, setChildren] = useState<ChildUser[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(!isGuest);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);
  const [childProgress, setChildProgress] = useState<ProgressDetail[]>([]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<{ id: string; title: string; url: string }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [rankData, setRankData] = useState<RankData | null>(null);

  useEffect(() => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime(); // captured once in effect, not during render

    const withIsNew = (data: Announcement[]) =>
      sortAnnouncements(data).map((ann) => ({
        ...ann,
        isNew: now - new Date(ann.created_at).getTime() < SEVEN_DAYS_MS,
      }));

    if (!isGuest) {
      Promise.all([
        apiClient.get("/admin/users/my-children"),
        apiClient.get("/announcements"),
        apiClient.get("/resource-links"),
        apiClient.get("/progress/my-rank"),
      ])
        .then(([childrenRes, annRes, resourcesRes, rankRes]) => {
          setChildren(childrenRes.data);
          setAnnouncements(withIsNew(annRes.data));
          setResources(resourcesRes.data);
          setRankData(rankRes.data);
        })
        .catch((err) => console.error("Dashboard data fetch error:", err))
        .finally(() => {
          setLoadingChildren(false);
          setLoadingStats(false);
        });
    } else {
      apiClient
        .get("/announcements")
        .then((res) => setAnnouncements(withIsNew(res.data)))
        .catch(() => {})
        .finally(() => {
          setLoadingChildren(false);
          setLoadingStats(false);
        });
    }
  }, [isGuest]);

  const handleChildClick = async (childId: string, childName: string) => {
    setSelectedChild({ id: childId, name: childName });
    try {
      const res = await apiClient.get(`/admin/users/child/${childId}/progress`);
      setChildProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch child progress:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-[1600px] mx-auto pt-32 px-6">
        {/* Next Meeting Countdown */}
        <NextMeetingCounter />

        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3 text-primary mb-2">
              <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Dashboard</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Momentum <span className="text-primary italic">Vision</span>
            </h1>
          </motion.div>

          {isGuest && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Link href="/auth/register">
                <Button className="rounded-2xl px-8 py-6 gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-black group transition-all">
                  Partnerliğe Geçiş Yap{" "}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MomentumStat
            icon={<TrendingUp />}
            label="Eğitim İlerlemesi"
            value={isGuest ? "—" : rankData ? `${rankData.rank_percentage.toFixed(1)}%` : "—"}
            trend={rankData ? `${children.length} kişilik ağ` : "Yükleniyor…"}
            isGuest={isGuest}
          />
          <MomentumStat
            icon={<Users />}
            label="Partner Listesi"
            value={isGuest ? "—" : children.length.toString()}
            trend={
              children.filter((c) => !c.is_active).length > 0
                ? `${children.filter((c) => !c.is_active).length} onay bekliyor`
                : "Tümü aktif"
            }
            isGuest={isGuest}
          />
          <MomentumStat
            icon={<Target />}
            label="Eğitim Puanı"
            value={isGuest ? "—" : rankData ? rankData.earned_points.toLocaleString("tr-TR") : "—"}
            trend={rankData ? `${rankData.rank_percentage.toFixed(1)}% tamamlandı` : "—"}
            isGuest={isGuest}
          />
          <RankStat rankData={rankData} isGuest={isGuest} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4 px-2">
                Kendi Gelişimim
              </h3>
              <MyProgressStats />
            </section>

            {!isGuest && (
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4 px-2">
                  Ekibini Büyüt
                </h3>
                <ReferenceCodeGenerator />
              </section>
            )}

            {/* Partners list */}
            <section>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40">
                  {t("my_children")}
                </h3>
                {!isGuest && (
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                    TOPLAM: {children.length}
                  </span>
                )}
              </div>

              <GlassCard
                className={`p-6 border-foreground/5 min-h-[300px] flex flex-col ${
                  isGuest ? "blur-sm select-none pointer-events-none opacity-50" : ""
                }`}
              >
                {loadingChildren ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-spin opacity-20" />
                  </div>
                ) : children.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => handleChildClick(child.id, child.full_name)}
                        className="group p-4 rounded-2xl border border-foreground/5 bg-foreground/5 hover:border-primary/30 hover:bg-foreground/10 transition-all cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center font-black text-foreground/20 border border-foreground/5 group-hover:bg-primary/5 group-hover:text-primary transition-colors uppercase">
                              {child.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                                {child.full_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] text-foreground/30 font-medium tracking-widest">
                                  #{child.partner_id || "GUEST"}
                                </p>
                                {!child.is_active && (
                                  <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase">
                                    Onay Bekliyor
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Info size={16} className="text-foreground/10 group-hover:text-primary/30 transition-colors" />
                        </div>

                        {child.rank && (
                          <div className="mb-3">
                            <RankBadge
                              rank={child.rank}
                              rankLabel={child.rank_label}
                              rankEmoji={child.rank_emoji}
                              earnedPoints={child.earned_points}
                              size="sm"
                              showPoints={false}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <MiniProgress label="Shorts" percentage={child.shorts_percentage || 0} color="blue" />
                          <MiniProgress
                            label="Masterclass"
                            percentage={child.masterclass_percentage || 0}
                            color="emerald"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <UserPlus className="w-12 h-12 text-foreground/5 mb-4" />
                    <p className="text-foreground/30 text-sm font-medium italic max-w-xs">{t("no_children")}</p>
                  </div>
                )}
              </GlassCard>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {isGuest && (
              <GlassCard className="p-8 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <Shield className="w-10 h-10 text-white/50 mb-2" />
                  <h3 className="text-xl font-black italic leading-tight">Tam Erişimi Aktif Et</h3>
                  <p className="text-white/80 text-xs leading-relaxed">
                    Partnerliğe geçerek ekibini kurmaya başla, adaylarının gelişimini takip et ve tüm kaynaklara eriş.
                  </p>
                  <Link href="/auth/register">
                    <Button variant="secondary" className="w-full font-black text-primary py-6 rounded-2xl">
                      PARTNER OL
                    </Button>
                  </Link>
                </div>
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </GlassCard>
            )}

            {!isGuest && rankData && (
              <RankBadge
                rank={rankData.rank}
                rankLabel={rankData.rank_label}
                rankEmoji={rankData.rank_emoji}
                earnedPoints={rankData.earned_points}
                maxPoints={rankData.max_points}
                rankPercentage={rankData.rank_percentage}
                size="lg"
                showPoints
                showProgress
              />
            )}

            {/* Resources */}
            <GlassCard className="p-8 border-foreground/5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-6 italic">
                Mühimmat Kısayolu
              </h3>
              <div className="space-y-3">
                {resources.length > 0 ? (
                  resources.map((res) => <QuickLink key={res.id} label={res.title} url={res.url} isGuest={isGuest} />)
                ) : (
                  <div className="text-[10px] text-foreground/20 italic">Henüz kaynak bulunmuyor.</div>
                )}
              </div>
            </GlassCard>

            {/* Announcements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 italic">Duyurular</h3>
                {announcements.length > 0 && (
                  <span className="ml-auto text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {announcements.length}
                  </span>
                )}
              </div>

              {announcements.length > 0 ? (
                announcements.map((ann, i) => (
                  <AnnouncementCard key={ann.id} ann={ann} locale={locale} index={i} />
                ))
              ) : (
                <GlassCard className="p-6 border-foreground/5">
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Megaphone className="w-8 h-8 text-foreground/10" />
                    <p className="text-[11px] text-foreground/30 italic">Yeni duyuru bulunmuyor.</p>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </main>

      <ChildDetailModal
        isOpen={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        childName={selectedChild?.name || ""}
        progress={childProgress}
      />
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
/** isNew is pre-computed in useEffect so Date.now() isn't called during render */
function AnnouncementCard({ ann, locale, index }: { ann: Announcement; locale: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all group ${
          ann.pinned
            ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
            : "border-foreground/10 bg-foreground/[0.02] hover:border-primary/20 hover:bg-primary/[0.02]"
        }`}
      >
        {/* Left accent bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors ${
            ann.pinned ? "bg-primary" : "bg-foreground/10 group-hover:bg-primary/40"
          }`}
        />

        <div className="pl-4 pr-4 py-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {ann.pinned && (
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">
                  📌 Sabitlendi
                </span>
              )}
              {ann.isNew && !ann.pinned && (
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                  ✨ Yeni
                </span>
              )}
            </div>
            <time className="text-[10px] text-foreground/30 shrink-0 tabular-nums">
              {new Date(ann.created_at).toLocaleDateString(locale, {
                day: "2-digit",
                month: "short",
              })}
            </time>
          </div>

          <p className={`text-sm font-bold leading-snug ${ann.pinned ? "text-foreground" : "text-foreground/80"}`}>
            {ann.title}
          </p>

          {ann.body && (
            <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed line-clamp-2">{ann.body}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Rank Stat Card ───────────────────────────────────────────────────────────
function RankStat({ rankData, isGuest }: { rankData: RankData | null; isGuest: boolean }) {
  return (
    <GlassCard className="p-6 border-foreground/5 hover:border-primary/20 transition-all group overflow-hidden relative">
      <div className={`flex items-center justify-between mb-4 ${isGuest ? "blur-[2px]" : ""}`}>
        <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
          <Award />
        </div>
        {!isGuest && rankData && <span className="text-lg leading-none">{rankData.rank_emoji}</span>}
      </div>
      <div className={isGuest ? "blur-[2px]" : ""}>
        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Rütbe</p>
        {isGuest ? (
          <p className="text-2xl font-black text-foreground">—</p>
        ) : rankData ? (
          <p className="text-xl font-black text-foreground">{rankData.rank_label}</p>
        ) : (
          <p className="text-xl font-black text-foreground/20">—</p>
        )}
      </div>
      {isGuest && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
          <Lock size={16} className="text-primary/40" />
        </div>
      )}
    </GlassCard>
  );
}

// ─── Generic stat card ────────────────────────────────────────────────────────
function MomentumStat({
  icon,
  label,
  value,
  trend,
  isGuest,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  isGuest: boolean;
}) {
  return (
    <GlassCard className="p-6 border-foreground/5 hover:border-primary/20 transition-all group overflow-hidden relative">
      <div className={`flex items-center justify-between mb-4 ${isGuest ? "blur-[2px]" : ""}`}>
        <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
          {icon}
        </div>
        {!isGuest && (
          <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg italic">
            {trend}
          </span>
        )}
      </div>
      <div className={isGuest ? "blur-[2px]" : ""}>
        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
      {isGuest && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
          <Lock size={16} className="text-primary/40" />
        </div>
      )}
    </GlassCard>
  );
}

function MiniProgress({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: "blue" | "emerald";
}) {
  const colorClasses: Record<string, string> = { blue: "bg-blue-500", emerald: "bg-emerald-500" };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-foreground/30">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ label, url, isGuest }: { label: string; url: string; isGuest: boolean }) {
  return (
    <a
      href={isGuest ? "#" : url}
      target={isGuest ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={`flex items-center justify-between p-4 rounded-2xl border border-foreground/5 transition-all ${
        isGuest
          ? "opacity-30 cursor-not-allowed"
          : "hover:border-primary/30 hover:bg-surface hover:shadow-lg cursor-pointer"
      }`}
    >
      <span className="text-xs font-bold text-foreground/60">{label}</span>
      {isGuest ? (
        <Lock size={12} className="text-foreground/20" />
      ) : (
        <ArrowUpRight size={16} className="text-foreground/20" />
      )}
    </a>
  );
}
