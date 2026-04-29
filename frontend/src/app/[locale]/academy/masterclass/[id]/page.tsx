"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, CheckCircle, BookmarkPlus, Lock, GraduationCap } from "lucide-react";
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

export default function MasterclassPlayerPage({ params }: PageProps) {
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

  if (loading) return <MasterclassPlayerSkeleton />;
  if (!content) return <LockedContent t={t} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-28 px-6 pb-20">
        <div className="flex flex-col gap-8">
          
          {/* Header & Breadcrumb */}
          <div className="space-y-4">
            <nav className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
              <Link href="/academy" className="hover:text-primary transition-colors">Akademi</Link>
              <ChevronRight size={10} />
              <span className="text-foreground/40">Masterclass</span>
              <ChevronRight size={10} />
              <span className="text-foreground line-clamp-1">{content.title}</span>
            </nav>
            <h1 className="text-3xl font-black text-foreground tracking-tight">{content.title}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Player Side (Left) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass border-foreground/5 shadow-2xl bg-black">
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

              {/* Description Card */}
              <div className="p-8 bg-surface border border-foreground/10 rounded-3xl space-y-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
                  <GraduationCap size={18} /> Eğitim Detayları
                </h3>
                <p className="text-foreground/70 leading-relaxed font-medium">
                  {content.description || "Bu eğitim için henüz bir açıklama girilmemiştir."}
                </p>
              </div>
            </div>

            {/* Actions Side (Right) */}
            <div className="space-y-6">
              <div className="glass p-8 rounded-3xl border-foreground/5 space-y-6 shadow-xl shadow-black/5">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Durum</span>
                    {isCompleted ? (
                      <span className="text-[10px] font-black uppercase text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Tamamlandı</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">İzleniyor</span>
                    )}
                  </div>
                  
                  <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: isCompleted ? '100%' : '30%' }} 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-foreground/10">
                  {content.is_locked ? (
                    <Link
                      href="/auth/register"
                      className="flex items-center justify-center gap-2 w-full py-4 px-6
                                 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest
                                 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                    >
                      <Lock size={16} />
                      Partner Ol ve İzle
                    </Link>
                  ) : (
                    <>
                      {content.resource_link && (
                        <a
                          href={content.resource_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-4 px-6
                                     bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest
                                     hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                        >
                          <ExternalLink size={16} />
                          {content.resource_link_label || t("view_resource")}
                        </a>
                      )}

                      <button
                        onClick={handleAddFavorite}
                        className="flex items-center justify-center gap-2 w-full py-4 px-6
                                   border border-foreground/10 text-foreground/40 rounded-2xl font-black text-xs uppercase tracking-widest
                                   hover:border-primary/20 hover:text-primary transition-all"
                      >
                        <BookmarkPlus size={16} />
                        {t("add_favorite")}
                      </button>

                      {isCompleted && (
                        <div className="flex items-center gap-2 justify-center text-green-600 text-xs font-bold">
                          <CheckCircle size={14} /> {t("completed")}
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-foreground/10">
                    <Link href={content.prev_id ? `/academy/masterclass/${content.prev_id}` : "#"}>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-2xl text-[10px] font-black h-12"
                        disabled={!content.prev_id}
                      >
                        ← ÖNCEKİ
                      </Button>
                    </Link>
                    <Link href={content.next_id ? `/academy/masterclass/${content.next_id}` : "#"}>
                      <Button 
                        className="w-full rounded-2xl text-[10px] font-black h-12 shadow-lg shadow-primary/20"
                        disabled={!content.next_id}
                      >
                        SONRAKİ →
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-foreground/[0.03] p-4 rounded-2xl border border-foreground/10">
                  <p className="text-[10px] text-foreground/40 leading-relaxed italic text-center">
                    Gelecek güncellemelerde burada eğitime özel ek kaynaklar ve tartışma notları yer alacaktır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
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

function MasterclassPlayerSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-28 px-6 pb-20 animate-pulse">
        <div className="h-4 bg-foreground/10 rounded w-64 mb-4" />
        <div className="h-10 bg-foreground/10 rounded w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video bg-foreground/10 rounded-3xl" />
            <div className="h-32 bg-foreground/10 rounded-3xl" />
          </div>
          <div className="h-96 bg-foreground/10 rounded-3xl" />
        </div>
      </div>
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
