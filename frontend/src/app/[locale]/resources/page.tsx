"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import {
  FolderOpen, ExternalLink, Bell, Pin, Loader2, AlertCircle,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  pinned: boolean;
  created_at: string;
}

interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  category?: string | null;
  created_at: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [annRes, resRes] = await Promise.all([
          apiClient.get<Announcement[]>("/announcements/"),
          apiClient.get<ResourceLink[]>("/resource-links/"),
        ]);
        // pinned announcements first, then by date
        const sorted = [...annRes.data].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setAnnouncements(sorted.filter((a) => a.is_active));
        setResources(resRes.data);
      } catch {
        setError("İçerikler yüklenemedi. Lütfen sayfayı yenileyin.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-24 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Kaynaklar</h1>
            <p className="text-foreground/40 text-sm italic">Duyurular ve paylaşılan bağlantılar</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Announcements ─────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-foreground/40" />
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Duyurular
                </h2>
              </div>

              {announcements.length === 0 ? (
                <p className="text-foreground/30 text-sm italic text-center py-8">
                  Henüz duyuru bulunmuyor.
                </p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, i) => (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GlassCard className="p-5 border-foreground/5 hover:border-foreground/10 transition-colors">
                        <div className="flex items-start gap-3">
                          {ann.pinned && (
                            <Pin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm mb-1 leading-snug">{ann.title}</h3>
                            <p className="text-foreground/50 text-xs leading-relaxed whitespace-pre-line">
                              {ann.body}
                            </p>
                            <p className="text-foreground/20 text-[10px] mt-2 italic">
                              {format(new Date(ann.created_at), "d MMMM yyyy", { locale: tr })}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Resource Links ────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className="w-4 h-4 text-foreground/40" />
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Bağlantılar
                </h2>
              </div>

              {resources.length === 0 ? (
                <p className="text-foreground/30 text-sm italic text-center py-8">
                  Henüz bağlantı eklenmemiş.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {resources.map((res, i) => (
                    <motion.a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="block group"
                    >
                      <GlassCard className="p-4 border-foreground/5 group-hover:border-primary/30 transition-all cursor-pointer h-full">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 group-hover:bg-primary/20 transition-colors">
                            <ExternalLink className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-snug truncate group-hover:text-primary transition-colors">
                              {res.title}
                            </p>
                            {res.description && (
                              <p className="text-foreground/40 text-xs mt-1 leading-relaxed line-clamp-2">
                                {res.description}
                              </p>
                            )}
                            {res.category && (
                              <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest bg-foreground/5 text-foreground/40 px-2 py-0.5 rounded-full">
                                {res.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.a>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
