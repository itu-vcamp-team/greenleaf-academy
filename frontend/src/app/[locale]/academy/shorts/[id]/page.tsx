"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, ExternalLink, CheckCircle, BookmarkPlus, BookmarkCheck,
  Lock, ChevronLeft, ChevronRight as ChevronRightIcon, Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

import YouTubePlayer from "@/components/academy/YouTubePlayer";
import apiClient from "@/lib/api-client";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useUserRole } from "@/context/UserRoleContext";

interface ContentDetail {
  id: string;
  title: string;
  description: string;
  video_url: string;
  resource_link: string | null;
  resource_link_label: string | null;
  is_locked: boolean;
  progress: {
    status: string;
    completion_percentage: number;
    last_position_seconds: number | null;
  } | null;
  next_id: string | null;
  prev_id: string | null;
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default function ShortsPlayerPage({ params }: PageProps) {
  const { id } = React.use(params);
  const t = useTranslations("academy");
  const { role } = useUserRole();
  const isGuest = role === "GUEST";

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    apiClient.get(`/academy/contents/${id}`)
      .then((res) => {
        const data = res.data as ContentDetail;
        setContent(data);
        setIsCompleted(data.progress?.status === "completed");
        setProgressPct(data.progress?.completion_percentage ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (!isGuest) {
      apiClient.get("/favorites")
        .then((res: { data: { content_id: string }[] }) => {
          const ids = res.data.map((f) => f.content_id);
          setIsFavorited(ids.includes(id));
        })
        .catch(() => {});
    }
  }, [id, isGuest]);

  const handleToggleFavorite = async () => {
    if (isGuest || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await apiClient.delete(`/favorites/${id}`);
        setIsFavorited(false);
      } else {
        await apiClient.post("/favorites", { content_id: id });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) return <ShortsPlayerSkeleton />;
  if (!content) return <LockedContent t={t} />;

  const displayedPct = isCompleted ? 100 : progressPct;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-5xl mx-auto pt-24 px-4 sm:px-6 pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-6">
          <Link href="/academy" className="hover:text-primary transition-colors">Akademi</Link>
          <ChevronRight size={10} />
          <Link href="/academy" className="hover:text-primary transition-colors">Shorts</Link>
          <ChevronRight size={10} />
          <span className="text-foreground line-clamp-1">{content.title}</span>
        </nav>

        {/* ─── Main layout: 2-column on sm+, stacked on mobile ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-12 items-start">

          {/* ── LEFT: Phone mock + nav ── */}
          <div className="flex flex-col items-center">
            {/* Phone mock with side arrows on sm+ */}
            <div className="relative flex items-center justify-center w-full sm:w-auto">
              {/* Prev button — left side (sm+) */}
              <Link
                href={content.prev_id ? `/academy/shorts/${content.prev_id}` : "#"}
                className={`hidden sm:flex absolute -left-14 items-center justify-center
                            w-12 h-12 rounded-2xl border-2 transition-all
                            ${content.prev_id
                              ? "border-foreground/20 text-foreground/60 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/10"
                              : "border-foreground/5 text-foreground/20 pointer-events-none"}`}
                aria-label="Önceki video"
              >
                <ChevronLeft size={20} />
              </Link>

              {/* Video player — phone mock */}
              <div
                className="relative mx-auto shadow-2xl rounded-[2.5rem] overflow-hidden border-8 border-foreground/10 bg-black"
                style={{ maxWidth: "340px", width: "100%", aspectRatio: "9/16" }}
              >
                {content.is_locked ? (
                  <LockedVideoOverlay />
                ) : (
                  <YouTubePlayer
                    videoUrl={content.video_url}
                    contentId={content.id}
                    initialPosition={content.progress?.last_position_seconds ?? 0}
                    vertical={true}
                    onProgressUpdate={(percentage) => {
                      setProgressPct(percentage);
                      if (percentage >= 85) setIsCompleted(true);
                    }}
                  />
                )}
              </div>

              {/* Next button — right side (sm+) */}
              <Link
                href={content.next_id ? `/academy/shorts/${content.next_id}` : "#"}
                className={`hidden sm:flex absolute -right-14 items-center justify-center
                            w-12 h-12 rounded-2xl border-2 transition-all
                            ${content.next_id
                              ? "border-primary/30 text-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20 bg-primary/5"
                              : "border-foreground/5 text-foreground/20 pointer-events-none"}`}
                aria-label="Sonraki video"
              >
                <ChevronRightIcon size={20} />
              </Link>
            </div>

            {/* Mobile nav — only visible below sm */}
            <div className="flex sm:hidden gap-4 mt-5 w-full">
              <Link href={content.prev_id ? `/academy/shorts/${content.prev_id}` : "#"} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl gap-2 text-xs font-black"
                  disabled={!content.prev_id}
                >
                  <ChevronLeft size={14} /> Önceki
                </Button>
              </Link>
              <Link href={content.next_id ? `/academy/shorts/${content.next_id}` : "#"} className="flex-1">
                <Button
                  className="w-full rounded-2xl gap-2 text-xs font-black shadow-lg shadow-primary/20"
                  disabled={!content.next_id}
                >
                  Sonraki <ChevronRightIcon size={14} />
                </Button>
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Info panel (sidebar on sm+, stacked on mobile) ── */}
          <div className="space-y-6">
            {/* Title + Description */}
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                {content.title}
              </h1>
              {content.description && (
                <p className="text-foreground/60 text-sm mt-3 leading-relaxed border-l-2 border-primary/20 pl-4 italic">
                  {content.description}
                </p>
              )}
            </div>

            {/* Progress card — only for unlocked authenticated users */}
            {!content.is_locked && !isGuest && (
              <div className="glass p-6 rounded-3xl border border-foreground/10 space-y-4 shadow-sm">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Durum</span>
                  {isCompleted ? (
                    <span className="text-[10px] font-black uppercase text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                      Tamamlandı
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      İzleniyor
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-foreground/40 mb-1.5">
                    <span className="font-bold uppercase tracking-wide">İlerleme</span>
                    <span className="font-black">%{Math.round(displayedPct)}</span>
                  </div>
                  <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${displayedPct}%` }}
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-center gap-2 justify-center text-green-600 text-xs font-bold">
                    <CheckCircle size={14} /> {t("completed")}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {/* Resource Link */}
              {!content.is_locked && content.resource_link && (
                <a
                  href={content.resource_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 px-6
                             border-2 border-primary text-primary rounded-2xl font-black text-xs uppercase tracking-widest
                             hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                  <ExternalLink size={16} />
                  {content.resource_link_label || t("view_resource")}
                </a>
              )}

              {/* Locked CTA */}
              {content.is_locked && (
                <Link
                  href="/auth/register"
                  className="flex items-center justify-center gap-3 w-full py-4 px-6
                             bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest
                             hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Lock size={16} />
                  Partner Ol ve İzle
                </Link>
              )}

              {/* Favorite Button — only for authenticated unlocked users */}
              {!content.is_locked && !isGuest && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`flex items-center justify-center gap-3 w-full py-4 px-6
                             rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                             disabled:opacity-60 disabled:cursor-not-allowed ${
                    isFavorited
                      ? "border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
                      : "border border-foreground/10 text-foreground/40 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {favoriteLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isFavorited ? (
                    <BookmarkCheck size={16} />
                  ) : (
                    <BookmarkPlus size={16} />
                  )}
                  {isFavorited ? "Favorilerimde" : t("add_favorite")}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ShortsPlayerSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 px-4 sm:px-6 pb-12 animate-pulse">
        <div className="h-3 bg-foreground/10 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-12 items-start">
          <div className="mx-auto bg-foreground/10 rounded-[2.5rem]"
            style={{ maxWidth: "340px", width: "100%", aspectRatio: "9/16" }} />
          <div className="space-y-4 pt-2">
            <div className="h-8 bg-foreground/10 rounded w-3/4" />
            <div className="h-4 bg-foreground/10 rounded w-full" />
            <div className="h-4 bg-foreground/10 rounded w-5/6" />
            <div className="h-28 bg-foreground/10 rounded-3xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LockedVideoOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm gap-4">
      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <p className="text-white text-xs font-black uppercase tracking-widest text-center px-6">
        Partner üyelere özel
      </p>
    </div>
  );
}

function LockedContent({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-surface p-12 rounded-[3rem] border border-foreground/10 shadow-2xl"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-primary/20 shadow-lg shadow-primary/10">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">{t("locked")}</h2>
          <p className="text-foreground/70 text-sm mb-8 leading-relaxed font-medium">
            {t("locked_hint")}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/academy">
              <Button size="lg" className="rounded-2xl w-full px-12">
                {t("back_to_list")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
