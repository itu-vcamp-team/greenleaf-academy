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
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default function ShortsPlayerPage({ params }: PageProps) {
  const { id, locale } = React.use(params);
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
    // This functionality is mock for now as per Task 10 feedback (To be implemented in Task 13)
    console.log("Add to favorites:", id);
  };

  if (loading) return <ShortsPlayerSkeleton />;
  if (!content || content.is_locked) return <LockedContent t={t} />;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="max-w-xl mx-auto pt-24 px-4 pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
          <Link href="/academy" className="hover:text-primary transition-colors">Akademi</Link>
          <ChevronRight size={10} />
          <span className="text-gray-400">Shorts</span>
          <ChevronRight size={10} />
          <span className="text-gray-900 line-clamp-1">{content.title}</span>
        </nav>

        {/* Video Player - 9:16 vertical style */}
        <div className="relative mx-auto shadow-2xl rounded-[2.5rem] overflow-hidden border-8 border-gray-900 bg-black" 
             style={{ maxWidth: "340px", aspectRatio: "9/16" }}>
          <YouTubePlayer
            videoUrl={content.video_url}
            contentId={content.id}
            initialPosition={content.progress?.last_position_seconds ?? 0}
            onProgressUpdate={(percentage) => {
              if (percentage >= 85) setIsCompleted(true);
            }}
          />
        </div>

        {/* Information Section */}
        <div className="mt-8 text-center sm:text-left">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{content.title}</h1>
          {content.description && (
            <p className="text-gray-500 text-sm mt-3 leading-relaxed border-l-2 border-primary/20 pl-4 italic">
              {content.description}
            </p>
          )}
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-3 mt-8">
          {/* Resource Link */}
          {content.resource_link && (
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

          {/* Completion Status */}
          <div
            className={`flex items-center justify-center gap-3 w-full py-4 px-6
                       rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              isCompleted
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-400 border border-gray-100"
            }`}
          >
            <CheckCircle size={16} />
            {isCompleted ? t("completed") + " ✓" : t("watching")}
          </div>

          {/* Utility Buttons */}
          <div className="flex justify-center mt-4 border-t border-gray-100 pt-4">
            <button
              onClick={handleAddFavorite}
              className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <BookmarkPlus size={14} />
              {t("add_favorite")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ShortsPlayerSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-xl mx-auto pt-24 px-4 pb-12 animate-pulse">
        <div className="h-3 bg-gray-100 rounded w-48 mb-6" />
        <div className="mx-auto bg-gray-100 rounded-[2.5rem]" style={{ maxWidth: "340px", aspectRatio: "9/16" }} />
        <div className="mt-8 space-y-3 px-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

function LockedContent({ t }: { t: any }) {
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
          <h2 className="text-3xl font-black mb-4 tracking-tight drop-shadow-sm">{t("locked")}</h2>
          <p className="text-foreground/70 text-sm mb-8 leading-relaxed font-medium">
            {t("locked_hint")}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/academy">
              <Button size="lg" className="rounded-2xl w-full">
                {t("back_to_list")}
              </Button>
            </Link>
            <Link href="/auth/register" className="text-primary text-xs font-bold hover:underline">
               Partner Ol ve Tümünü İzle
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
