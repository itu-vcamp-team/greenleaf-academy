"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Zap, ShieldCheck, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "@/components/ui/Navbar";
import MyProgressStats from "@/components/academy/MyProgressStats";
import SearchBar from "@/components/academy/SearchBar";
import ContentCard, { LockReason } from "@/components/academy/ContentCard";
import apiClient from "@/lib/api-client";
import { useUserRole } from "@/context/UserRoleContext";

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface AcademyContentItem {
  id: string;
  title: string;
  description: string | undefined;
  video_url: string | undefined;
  thumbnail_url: string | undefined;
  type: "SHORT" | "MASTERCLASS";
  locale: string;
  order: number;
  status: string;
  is_locked: boolean;
  is_new: boolean;
  progress?: {
    status: "not_started" | "in_progress" | "completed";
    completion_percentage: number;
    completed_at?: string | null;
  } | null;
}

const LANGUAGE_FILTERS = [
  { label: "Tümü", value: null, flag: "🌐" },
  { label: "Türkçe", value: "tr-TR", flag: "🇹🇷" },
  { label: "English", value: "en-US", flag: "🇬🇧" },
];

export default function AcademyPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations("academy");
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState<"SHORT" | "MASTERCLASS">("SHORT");
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [contents, setContents] = useState<AcademyContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveLockReason = (item: AcademyContentItem): LockReason | undefined => {
    if (!item.is_locked) return undefined;
    return role === "GUEST" ? "guest" : "prerequisite";
  };

  useEffect(() => {
    // AbortController cancels in-flight requests when activeTab/selectedLocale changes,
    // preventing stale responses from overwriting newer tab data (race condition fix).
    const controller = new AbortController();

    async function fetchContents(signal: AbortSignal) {
      setLoading(true);
      try {
        // Locale is a UI-based filter — not URL-based.
        // If no locale selected, backend returns all languages.
        const params = new URLSearchParams({ type: activeTab });
        if (selectedLocale) {
          params.set("locale", selectedLocale);
        }
        const res = await apiClient.get(`/academy/contents?${params.toString()}`, {
          signal,
        });
        setContents(res.data);
      } catch (err) {
        // Ignore AbortError — a new request is already in flight
        const axiosErr = err as { name?: string; code?: string };
        if (axiosErr?.name !== "CanceledError" && axiosErr?.code !== "ERR_CANCELED") {
          console.error("Failed to fetch academy contents:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchContents(controller.signal);

    // Re-fetch progress data when the user returns to this tab/page after watching a video.
    // Each visibility-triggered fetch gets its own controller so it can also be aborted.
    let visibilityController: AbortController | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityController?.abort();
        visibilityController = new AbortController();
        fetchContents(visibilityController.signal);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      visibilityController?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab, selectedLocale]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-[1600px] mx-auto pt-32 px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">{t("title")}</h1>
          <p className="text-foreground/50 font-medium">{t("subtitle")}</p>
        </motion.div>

        {/* User Progress Overview */}
        <MyProgressStats />

        {/* Global Search */}
        <SearchBar className="mb-8" locale={locale} />

        {/* Content Type Tabs + Language Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Content Type Tabs */}
          <div className="flex p-1.5 bg-foreground/5 backdrop-blur-md rounded-2xl border border-foreground/5 shadow-sm">
            <TabButton
              active={activeTab === "SHORT"}
              onClick={() => setActiveTab("SHORT")}
              icon={<Zap size={16} />}
              label="Shorts"
            />
            <TabButton
              active={activeTab === "MASTERCLASS"}
              onClick={() => setActiveTab("MASTERCLASS")}
              icon={<ShieldCheck size={16} />}
              label="Masterclass"
            />
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-foreground/5 rounded-xl border border-foreground/5">
            <Globe className="w-3.5 h-3.5 text-foreground/30 ml-2" />
            {LANGUAGE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setSelectedLocale(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedLocale === filter.value
                    ? "bg-surface text-primary border border-primary/10 shadow-sm"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                {filter.flag} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${selectedLocale}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-video bg-foreground/5 rounded-2xl animate-pulse" />
              ))
            ) : contents.length > 0 ? (
              contents.map((item) => (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  thumbnailUrl={item.thumbnail_url}
                  type={item.type}
                  isLocked={item.is_locked}
                  isNew={item.is_new}
                  lockReason={resolveLockReason(item)}
                  progress={item.progress ?? undefined}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center opacity-20 italic">
                {t("no_results")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
        active
          ? "bg-surface text-primary shadow-lg shadow-primary/5 border border-primary/10"
          : "text-foreground/30 hover:text-foreground/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
