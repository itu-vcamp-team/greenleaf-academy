"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Users, Target, Award, ArrowUpRight,
  Shield, Zap, Lock, ChevronRight, UserPlus, Info, Bell, Megaphone, X, Search,
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
  username: string;
  email: string;
  phone: string | null;
  partner_id: string | null;
  is_active: boolean;
  shorts_percentage: number;
  masterclass_percentage: number;
  rank: RankKey;
  rank_label: string;
  rank_emoji: string;
  rank_color: string;
  earned_points: number;
  max_points: number;
  rank_percentage: number;
  joined_at: string | null;
  profile_image_path: string | null;
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
  const [selectedChild, setSelectedChild] = useState<ChildUser | null>(null);
  const [childProgress, setChildProgress] = useState<ProgressDetail[]>([]);

  // Adaylarım filter / sort / search
  const [childSearch, setChildSearch] = useState("");
  const [childSort, setChildSort] = useState<
    "joined_desc" | "name_asc" | "name_desc" | "shorts_desc" | "masterclass_desc" | "points_desc"
  >("joined_desc");
  const [childFilter, setChildFilter] = useState<"all" | "active" | "pending">("all");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<{ id: string; title: string; url: string }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [rankData, setRankData] = useState<RankData | null>(null);
  // Task 1: Announcement detail modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

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

  const handleChildClick = async (child: ChildUser) => {
    setSelectedChild(child);
    setChildProgress([]); // clear previous data while loading
    try {
      const res = await apiClient.get(`/admin/users/child/${child.id}/progress`);
      setChildProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch child progress:", err);
    }
  };

  // ── Computed: filtered + sorted children list ──────────────────────────────
  const filteredChildren = (() => {
    let result = [...children];
    if (childFilter === "active") result = result.filter((c) => c.is_active);
    else if (childFilter === "pending") result = result.filter((c) => !c.is_active);
    if (childSearch.trim()) {
      const q = childSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          (c.username ?? "").toLowerCase().includes(q) ||
          (c.partner_id ?? "").toLowerCase().includes(q)
      );
    }
    switch (childSort) {
      case "name_asc":        result.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
      case "name_desc":       result.sort((a, b) => b.full_name.localeCompare(a.full_name)); break;
      case "shorts_desc":     result.sort((a, b) => b.shorts_percentage - a.shorts_percentage); break;
      case "masterclass_desc":result.sort((a, b) => b.masterclass_percentage - a.masterclass_percentage); break;
      case "points_desc":     result.sort((a, b) => b.earned_points - a.earned_points); break;
      default: result.sort((a, b) =>
        new Date(b.joined_at ?? 0).getTime() - new Date(a.joined_at ?? 0).getTime()
      ); break;
    }
    return result;
  })();

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
            value={isGuest ? "—" : loadingStats ? "…" : rankData ? `${rankData.rank_percentage.toFixed(1)}%` : "—"}
            trend={loadingStats ? "Yükleniyor…" : rankData ? `${rankData.rank_percentage.toFixed(1)}% puan tamamlandı` : "—"}
            isGuest={isGuest}
          />
          <MomentumStat
            icon={<Users />}
            label="Partner Listesi"
            value={isGuest ? "—" : loadingChildren ? "…" : children.length.toString()}
            trend={
              loadingChildren
                ? "Yükleniyor…"
                : children.filter((c) => !c.is_active).length > 0
                ? `${children.filter((c) => !c.is_active).length} onay bekliyor`
                : children.length > 0 ? "Tümü aktif" : "Henüz partner yok"
            }
            isGuest={isGuest}
          />
          <MomentumStat
            icon={<Target />}
            label="Eğitim Puanı"
            value={isGuest ? "—" : loadingStats ? "…" : rankData ? rankData.earned_points.toLocaleString("tr-TR") : "—"}
            trend={loadingStats ? "Yükleniyor…" : rankData ? `Maks: ${rankData.max_points.toLocaleString("tr-TR")} puan` : "—"}
            isGuest={isGuest}
          />
          <RankStat rankData={rankData} isGuest={isGuest} loading={loadingStats} />
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

            {/* Partners list (Adaylarım) */}
            <section>
              <div className="flex items-start justify-between mb-4 px-2 gap-3 flex-wrap">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40">
                  {t("my_children")}
                </h3>
                {!isGuest && (
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                    TOPLAM: {children.length}
                  </span>
                )}
              </div>

              {/* Search / Filter / Sort — hidden for guests and when list is empty */}
              {!isGuest && children.length > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="İsim, kullanıcı adı veya ID ara…"
                      value={childSearch}
                      onChange={(e) => setChildSearch(e.target.value)}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder-foreground/30"
                    />
                  </div>

                  {/* Filter tabs + Sort dropdown */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1 bg-foreground/5 rounded-2xl p-1">
                      {(["all", "active", "pending"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setChildFilter(f)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            childFilter === f
                              ? "bg-primary text-white shadow-sm"
                              : "text-foreground/40 hover:text-foreground/70"
                          }`}
                        >
                          {f === "all" ? `Tümü (${children.length})` : f === "active" ? `Aktif (${children.filter((c) => c.is_active).length})` : `Bekleyen (${children.filter((c) => !c.is_active).length})`}
                        </button>
                      ))}
                    </div>
                    <select
                      value={childSort}
                      onChange={(e) => setChildSort(e.target.value as typeof childSort)}
                      className="ml-auto bg-foreground/5 border border-foreground/10 rounded-2xl py-2 px-3 text-xs font-black text-foreground/60 outline-none focus:border-primary/30 cursor-pointer"
                    >
                      <option value="joined_desc">En Yeni</option>
                      <option value="name_asc">İsim A→Z</option>
                      <option value="name_desc">İsim Z→A</option>
                      <option value="shorts_desc">Shorts %</option>
                      <option value="masterclass_desc">Masterclass %</option>
                      <option value="points_desc">Puan</option>
                    </select>
                  </div>
                </div>
              )}

              <GlassCard
                className={`p-6 border-foreground/5 min-h-[300px] flex flex-col ${
                  isGuest ? "blur-sm select-none pointer-events-none opacity-50" : ""
                }`}
              >
                {loadingChildren ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-spin opacity-20" />
                  </div>
                ) : filteredChildren.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChildren.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => handleChildClick(child)}
                        className="group p-4 rounded-2xl border border-foreground/5 bg-foreground/5 hover:border-primary/30 hover:bg-foreground/10 transition-all cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {/* Profile photo or initial avatar */}
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-foreground/5 group-hover:border-primary/20 transition-colors">
                              {child.profile_image_path ? (
                                <Image
                                  src={`/api/backend${child.profile_image_path}`}
                                  alt={child.full_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-foreground/5 flex items-center justify-center font-black text-foreground/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors uppercase text-sm">
                                  {child.full_name.charAt(0)}
                                </div>
                              )}
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
                ) : children.length > 0 && (childSearch || childFilter !== "all") ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <Search className="w-12 h-12 text-foreground/5 mb-4" />
                    <p className="text-foreground/30 text-sm font-medium italic max-w-xs">
                      Eşleşen aday bulunamadı.
                    </p>
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
                    <Button className="w-full font-black bg-white text-primary hover:bg-white/90 py-6 rounded-2xl gap-2 group">
                      PARTNER OL
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    locale={locale}
                    index={i}
                    onSelect={setSelectedAnnouncement}
                  />
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

      {selectedChild && (
        <ChildDetailModal
          isOpen={!!selectedChild}
          onClose={() => {
            setSelectedChild(null);
            setChildProgress([]);
          }}
          child={selectedChild}
          progress={childProgress}
        />
      )}

      {/* Task 1: Announcement detail modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          ann={selectedAnnouncement}
          locale={locale}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
/** isNew is pre-computed in useEffect so Date.now() isn't called during render */
function AnnouncementCard({
  ann, locale, index, onSelect,
}: {
  ann: Announcement;
  locale: string;
  index: number;
  onSelect: (ann: Announcement) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        type="button"
        onClick={() => onSelect(ann)}
        className={`w-full text-left relative overflow-hidden rounded-2xl border transition-all group cursor-pointer ${
          ann.pinned
            ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/15"
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

          {ann.body && (
            <p className="text-[10px] text-primary/60 mt-2 font-bold uppercase tracking-widest flex items-center gap-1 group-hover:text-primary transition-colors">
              Devamını Oku →
            </p>
          )}
        </div>
      </button>
    </motion.div>
  );
}

// ─── Announcement Detail Modal ────────────────────────────────────────────────
function AnnouncementDetailModal({
  ann,
  locale,
  onClose,
}: {
  ann: Announcement;
  locale: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-background rounded-[2rem] shadow-2xl overflow-hidden border border-foreground/10"
        >
          {/* Header */}
          <div className={`p-6 ${ann.pinned ? "bg-primary/5 border-b border-primary/20" : "border-b border-foreground/10"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
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
                <h2 className="text-xl font-black text-foreground leading-tight">{ann.title}</h2>
                <time className="text-[10px] text-foreground/40 font-medium">
                  {new Date(ann.created_at).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {ann.body ? (
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
            ) : (
              <p className="text-sm text-foreground/40 italic">Bu duyurunun detaylı içeriği bulunmuyor.</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground text-sm font-bold transition-all"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Rank Stat Card ───────────────────────────────────────────────────────────
function RankStat({ rankData, isGuest, loading = false }: { rankData: RankData | null; isGuest: boolean; loading?: boolean }) {
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
        ) : loading ? (
          <p className="text-xl font-black text-foreground/20">…</p>
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
