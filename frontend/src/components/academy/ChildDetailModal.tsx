"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Zap, Search, X, Phone, Mail,
  Calendar, BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { RankBadge, type RankKey } from "@/components/ui/RankBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressDetail {
  content_id: string;
  title: string;
  type: "SHORT" | "MASTERCLASS";
  status: "not_started" | "in_progress" | "completed";
  percentage: number;
}

export interface ChildUser {
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

interface ChildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: ChildUser;
  progress: ProgressDetail[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChildDetailModal({
  isOpen,
  onClose,
  child,
  progress,
}: ChildDetailModalProps) {
  const t = useTranslations("academy");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "progress">("overview");

  const filteredProgress = progress.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Construct profile image URL the same way settings page does
  const profileImageUrl = child.profile_image_path
    ? `/api/backend${child.profile_image_path}`
    : null;

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const inProgressCount = progress.filter((p) => p.status === "in_progress").length;
  const notStartedCount = progress.length - completedCount - inProgressCount;

  const shortsItems = progress.filter((p) => p.type === "SHORT");
  const masterclassItems = progress.filter((p) => p.type === "MASTERCLASS");

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

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-background rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-foreground/10"
        >

          {/* ── Profile Header ──────────────────────────────────────────── */}
          <div className="p-6 border-b border-foreground/10 bg-gradient-to-br from-primary/5 to-background">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">

                {/* Avatar / Profile Photo */}
                <div className="relative shrink-0">
                  {profileImageUrl ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                      <Image
                        src={profileImageUrl}
                        alt={child.full_name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-2xl text-primary shadow-lg uppercase">
                      {child.full_name.charAt(0)}
                    </div>
                  )}
                  {/* Online status dot */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${
                      child.is_active ? "bg-green-500" : "bg-amber-500"
                    }`}
                  />
                </div>

                {/* Name, Username, Badges */}
                <div>
                  <h2 className="text-xl font-black text-foreground leading-tight">
                    {child.full_name}
                  </h2>
                  <p className="text-xs text-foreground/40 font-medium">
                    @{child.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {child.partner_id && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        #{child.partner_id}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        child.is_active
                          ? "text-green-600 bg-green-500/10 border-green-500/20"
                          : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                      }`}
                    >
                      {child.is_active ? "Aktif" : "Onay Bekliyor"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/40 hover:text-foreground shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contact & Join Info row */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {child.email && (
                <a
                  href={`mailto:${child.email}`}
                  className="flex items-center gap-2 text-xs text-foreground/50 hover:text-primary transition-colors truncate"
                >
                  <Mail size={12} className="shrink-0 text-primary/50" />
                  <span className="truncate">{child.email}</span>
                </a>
              )}
              {child.phone && (
                <a
                  href={`tel:${child.phone}`}
                  className="flex items-center gap-2 text-xs text-foreground/50 hover:text-primary transition-colors"
                >
                  <Phone size={12} className="shrink-0 text-primary/50" />
                  {child.phone}
                </a>
              )}
              {child.joined_at && (
                <div className="flex items-center gap-2 text-xs text-foreground/40">
                  <Calendar size={12} className="shrink-0 text-primary/50" />
                  Katıldı:{" "}
                  {new Date(child.joined_at).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Progress Summary Bar ────────────────────────────────────── */}
          <div className="px-6 py-4 border-b border-foreground/10 bg-foreground/[0.01]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Rank */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  {child.rank_emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">
                    Rütbe
                  </p>
                  <p className="text-sm font-black text-foreground">{child.rank_label}</p>
                  <p className="text-[10px] text-primary font-bold">
                    {child.earned_points} / {child.max_points} puan
                  </p>
                </div>
              </div>

              {/* Shorts progress */}
              <div>
                <div className="flex justify-between text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1.5">
                  <span className="flex items-center gap-1">
                    <Zap size={9} /> Shorts
                  </span>
                  <span className="text-blue-500">{Math.round(child.shorts_percentage)}%</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${child.shorts_percentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-foreground/30 mt-1">
                  {shortsItems.filter((p) => p.status === "completed").length} /{" "}
                  {shortsItems.length} tamamlandı
                </p>
              </div>

              {/* Masterclass progress */}
              <div>
                <div className="flex justify-between text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1.5">
                  <span className="flex items-center gap-1">
                    <BarChart3 size={9} /> Masterclass
                  </span>
                  <span className="text-emerald-500">
                    {Math.round(child.masterclass_percentage)}%
                  </span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${child.masterclass_percentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-foreground/30 mt-1">
                  {masterclassItems.filter((p) => p.status === "completed").length} /{" "}
                  {masterclassItems.length} tamamlandı
                </p>
              </div>
            </div>
          </div>

          {/* ── Tab Navigation ──────────────────────────────────────────── */}
          <div className="flex border-b border-foreground/10 shrink-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                activeTab === "overview"
                  ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              Özet
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                activeTab === "progress"
                  ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              İçerik İlerlemesi ({progress.length})
            </button>
          </div>

          {/* ── Tab Content ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-6 space-y-4">

                {/* Completion stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-center">
                    <p className="text-2xl font-black text-green-500">{completedCount}</p>
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mt-0.5">
                      Tamamlandı
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-center">
                    <p className="text-2xl font-black text-blue-500">{inProgressCount}</p>
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mt-0.5">
                      Devam Ediyor
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-center">
                    <p className="text-2xl font-black text-foreground/40">{notStartedCount}</p>
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mt-0.5">
                      Başlanmadı
                    </p>
                  </div>
                </div>

                {/* Rank progress bar */}
                <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-foreground/50 uppercase tracking-widest">
                      Rütbe İlerlemesi
                    </span>
                    <span className="text-xs font-black text-primary">
                      {Math.round(child.rank_percentage)}%
                    </span>
                  </div>
                  <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${child.rank_percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-foreground/30 mt-2">
                    {child.earned_points} / {child.max_points} puan
                  </p>
                </div>

                {/* Full rank badge */}
                {child.rank && (
                  <div className="flex justify-center">
                    <RankBadge
                      rank={child.rank}
                      rankLabel={child.rank_label}
                      rankEmoji={child.rank_emoji}
                      earnedPoints={child.earned_points}
                      maxPoints={child.max_points}
                      rankPercentage={child.rank_percentage}
                      size="md"
                      showPoints
                      showProgress
                    />
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <>
                {/* Sticky search bar */}
                <div className="px-6 py-3 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-foreground/5 z-10">
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-3.5 text-foreground/30" />
                    <input
                      type="text"
                      placeholder={t("search_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder-foreground/30"
                    />
                  </div>
                </div>

                {/* Content list */}
                <div className="p-6 space-y-3">
                  {filteredProgress.length === 0 ? (
                    <div className="text-center py-12 text-foreground/30 italic font-medium">
                      {t("no_results")}
                    </div>
                  ) : (
                    filteredProgress.map((item) => (
                      <div
                        key={item.content_id}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-foreground/10 hover:border-primary/20 hover:bg-primary/[0.02] transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl border shrink-0 ${
                              item.type === "SHORT"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            }`}
                          >
                            <Zap size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] uppercase font-black tracking-widest text-foreground/40 mt-0.5">
                              {item.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 min-w-[110px] shrink-0 ml-3">
                          <div className="flex items-center gap-2">
                            {item.status === "completed" ? (
                              <span className="text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20 uppercase">
                                {t("status_completed")}
                              </span>
                            ) : item.status === "in_progress" ? (
                              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 uppercase">
                                {t("status_in_progress")}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded-lg border border-foreground/10 uppercase">
                                {t("status_not_started")}
                              </span>
                            )}
                            <span className="text-xs font-black text-foreground tabular-nums">
                              {Math.round(item.percentage)}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${
                                item.status === "completed"
                                  ? "bg-green-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-foreground/[0.02] border-t border-foreground/10 flex justify-between items-center shrink-0">
            <p className="text-[10px] text-foreground/30 font-medium uppercase tracking-[0.2em]">
              Greenleaf Akademi • Gerçek Zamanlı Takip
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground text-sm font-bold transition-all"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
