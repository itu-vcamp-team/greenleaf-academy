"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Zap, ShieldCheck, Globe, ChevronDown, Heart } from "lucide-react";
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

/** Mapping of locale codes to display info */
const LOCALE_META: Record<string, { label: string; flag: string }> = {
  "tr-TR": { label: "Türkçe", flag: "🇹🇷" },
  "en-US": { label: "English", flag: "🇬🇧" },
  "de-DE": { label: "Deutsch", flag: "🇩🇪" },
  "fr-FR": { label: "Français", flag: "🇫🇷" },
  "es-ES": { label: "Español", flag: "🇪🇸" },
  "ar-SA": { label: "العربية", flag: "🇸🇦" },
};

export default function AcademyPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations("academy");
  const { role } = useUserRole();
  const isGuest = role === "GUEST";

  const [activeTab, setActiveTab] = useState<"SHORT" | "MASTERCLASS">("SHORT");
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [contents, setContents] = useState<AcademyContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);

  // Favorites filter state
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const resolveLockReason = (item: AcademyContentItem): LockReason | undefined => {
    if (!item.is_locked) return undefined;
    return role === "GUEST" ? "guest" : "prerequisite";
  };

  /** Fetch the set of favorited content IDs for authenticated users */
  const loadFavorites = async () => {
    if (isGuest) return;
    try {
      const res = await apiClient.get<{ content_id: string }[]>("/favorites");
      setFavoriteIds(new Set(res.data.map((f) => f.content_id)));
    } catch {
      // not critical — silently fail
    }
  };

  // Fetch locales once on mount
  useEffect(() => {
    apiClient
      .get<string[]>("/academy/locales")
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  // Load favorites once we know the role
  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchContents(signal: AbortSignal) {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: activeTab });
        if (selectedLocale) params.set("locale", selectedLocale);

        const res = await apiClient.get(`/academy/contents?${params.toString()}`, { signal });
        setContents(res.data);
      } catch (err) {
        const axiosErr = err as { name?: string; code?: string };
        if (axiosErr?.name !== "CanceledError" && axiosErr?.code !== "ERR_CANCELED") {
          console.error("Failed to fetch academy contents:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchContents(controller.signal);

    let visibilityController: AbortController | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityController?.abort();
        visibilityController = new AbortController();
        // Re-fetch both contents and favorites when returning to page
        fetchContents(visibilityController.signal);
        loadFavorites();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      visibilityController?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLocale]);

  // Filter to favorites when the toggle is active
  const displayedContents = showFavorites
    ? contents.filter((c) => favoriteIds.has(c.id))
    : contents;

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

        {/* Content Type Tabs + Favorites + Language Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">

          {/* Left: Content Type Tabs + Favorites Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Content type tabs */}
            <div className="flex p-1.5 bg-foreground/5 backdrop-blur-md rounded-2xl border border-foreground/5 shadow-sm">
              <TabButton
                active={activeTab === "SHORT"}
                onClick={() => { setActiveTab("SHORT"); setShowFavorites(false); }}
                icon={<Zap size={16} />}
                label="Shorts"
              />
              <TabButton
                active={activeTab === "MASTERCLASS"}
                onClick={() => { setActiveTab("MASTERCLASS"); setShowFavorites(false); }}
                icon={<ShieldCheck size={16} />}
                label="Masterclass"
              />
            </div>

            {/* Favorites toggle — only for authenticated users */}
            {!isGuest && (
              <button
                onClick={() => setShowFavorites((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-xs font-black uppercase tracking-widest ${
                  showFavorites
                    ? "border-primary text-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-foreground/10 text-foreground/40 hover:border-foreground/20 hover:text-foreground/60"
                }`}
                aria-label="Favorilerim"
              >
                <Heart
                  size={14}
                  className={showFavorites ? "fill-primary" : ""}
                />
                Favorilerim
                {showFavorites && favoriteIds.size > 0 && (
                  <span className="ml-0.5 bg-primary text-white rounded-full px-1.5 py-0.5 text-[9px] font-black">
                    {favoriteIds.size}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Right: Language Filter Dropdown */}
          <div className="relative flex items-center gap-2 px-3 py-2 bg-foreground/5 rounded-xl border border-foreground/5 hover:border-foreground/10 transition-colors">
            <Globe className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
            <select
              value={selectedLocale ?? ""}
              onChange={(e) => setSelectedLocale(e.target.value || null)}
              className="appearance-none bg-transparent text-[11px] font-black uppercase tracking-widest text-foreground/70 outline-none cursor-pointer pr-5 min-w-[80px]"
              aria-label={t("language_filter")}
            >
              <option value="">
                {t("filter_all")}
              </option>
              {availableLocales.map((lc) => {
                const meta = LOCALE_META[lc];
                return (
                  <option key={lc} value={lc}>
                    {meta ? `${meta.flag} ${meta.label}` : lc}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3 h-3 text-foreground/30 pointer-events-none absolute right-3" />
          </div>
        </div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${selectedLocale}-${showFavorites ? "fav" : "all"}`}
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
            ) : displayedContents.length > 0 ? (
              displayedContents.map((item) => (
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
            ) : showFavorites ? (
              <div className="col-span-full py-20 text-center">
                <div className="opacity-30 italic text-sm">Henüz favori içerik eklemediniz.</div>
              </div>
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
