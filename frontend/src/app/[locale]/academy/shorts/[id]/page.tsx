"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, CheckCircle, BookmarkPlus, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

import YouTubePlayer from "@/components/academy/YouTubePlayer";
import apiClient from "@/lib/api-client";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";

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
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    apiClient.get(`/academy/contents/${id}`)
      .then((res) => {
        setContent(res.data);
        setIsCompleted(res.data.progress?.status === "completed");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddFavorite = async () => {
    console.log("Add to favorites:", id);
  };

  if (loading) return <ShortsPlayerSkeleton />;
  if (!content) return <LockedContent t={t} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-xl mx-auto pt-24 px-4 pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-6">
          <Link href="/academy" className="hover:text-primary transition-colors">Akademi</Link>
          <ChevronRight size={10} />
          <span className="text-foreground/40">Shorts</span>
          <ChevronRight size={10} />
          <span className="text-foreground line-clamp-1">{content.title}</span>
        </nav>

        {/* Video Player - 9:16 vertical style */}
        <div className="relative mx-auto shadow-2xl rounded-[2.5rem] overflow-hidden border-8 border-foreground/10 bg-black"
             style={{ maxWidth: "340px", aspectRatio: "9/16" }}>
          {content.is_locked ? (
            <LockedVideoOverlay />
          ) : (
            <YouTubePlayer
              videoUrl={content.video_url}
              contentId={content.id}
              initialPosition={content.progress?.last_position_seconds ?? 0}
              onProgressUpdate={(percentage) => {
                if (percentage >= 85) setIsCompleted(true);
              }}
            />
          )}
        </div>

        {/* Information Section */}
        <div className="mt-8 text-center sm:text-left">
          <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">{content.title}</h1>
          {content.description && (
            <p className="text-foreground/60 text-sm mt-3 leading-relaxed border-l-2 border-primary/20 pl-4 italic">
              {content.description}
            </p>
          )}
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-3 mt-8">
          {/* Resource Link — hidden when locked */}
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
            <Link href="/auth/register"
              className="flex items-center justify-center gap-3 w-full py-4 px-6
                         bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest
                         hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Lock size={16} />
              Partner Ol ve İzle
            </Link>
          )}

          {/* Completion Status — only for unlocked */}
          {!content.is_locked && (
            <div
              className={`flex items-center justify-center gap-3 w-full py-4 px-6
                         rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                isCompleted
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-foreground/5 text-foreground/40 border border-foreground/10"
              }`}
            >
              <CheckCircle size={16} />
              {isCompleted ? t("completed") + " ✓" : t("watching")}
            </div>
          )}

          {/* Favorite Button */}
          {!content.is_locked && (
            <button
              onClick={handleAddFavorite}
              className="flex items-center justify-center gap-3 w-full py-4 px-6
                         border border-foreground/10 text-foreground/40 rounded-2xl font-black text-xs uppercase tracking-widest
                         hover:border-primary/30 hover:text-primary transition-all"
            >
              <BookmarkPlus size={16} />
              {t("add_favorite")}
            </button>
          )}

          {/* Navigation Area */}
          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-foreground/10 pt-6">
            <Link href={content.prev_id ? `/academy/shorts/${content.prev_id}` : "#"}>
              <Button
                variant="outline"
                className="w-full rounded-2xl gap-2 text-xs font-black"
                disabled={!content.prev_id}
              >
                ← Önceki
              </Button>
            </Link>
            <Link href={content.next_id ? `/academy/shorts/${content.next_id}` : "#"}>
              <Button
                className="w-full rounded-2xl gap-2 text-xs font-black shadow-lg shadow-primary/20"
                disabled={!content.next_id}
              >
                Sonraki →
              </Button>
            </Link>
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
      <div className="max-w-xl mx-auto pt-24 px-4 pb-12 animate-pulse">
        <div className="h-3 bg-foreground/10 rounded w-48 mb-6" />
        <div className="mx-auto bg-foreground/10 rounded-[2.5rem]" style={{ maxWidth: "340px", aspectRatio: "9/16" }} />
        <div className="mt-8 space-y-3 px-4">
          <div className="h-8 bg-foreground/10 rounded w-3/4" />
          <div className="h-4 bg-foreground/10 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

function LockedVideoOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm gap-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <p className="text-white text-xs font-black uppercase tracking-widest text-center px-6">
        Partner üyelere özel
      </p>
    </div>
  );
}

function LockedContent({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md"
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
              <Button size="lg" className="rounded-2xl w-full">
                {t("back_to_list")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
