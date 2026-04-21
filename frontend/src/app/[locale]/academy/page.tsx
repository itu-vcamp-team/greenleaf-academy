"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "@/components/ui/Navbar";
import MyProgressStats from "@/components/academy/MyProgressStats";
import SearchBar from "@/components/academy/SearchBar";
import ContentCard from "@/components/academy/ContentCard";
import apiClient from "@/lib/api-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function AcademyPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations("academy");
  const [activeTab, setActiveTab] = useState<"SHORT" | "MASTERCLASS">("SHORT");
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContents() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/academy/contents?type=${activeTab}&locale=${locale}`);
        setContents(res.data);
      } catch (err) {
        console.error("Failed to fetch academy contents:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, [activeTab, locale]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-5xl mx-auto pt-32 px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2 tracking-tight">{t("title")}</h1>
          <p className="text-foreground/50 font-medium">{t("subtitle")}</p>
        </motion.div>

        {/* User Progress Overview */}
        <MyProgressStats />

        {/* Global Search */}
        <SearchBar className="mb-8" locale={locale} />

        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-foreground/5 backdrop-blur-md rounded-2xl border border-foreground/5 mb-8 max-w-sm mx-auto shadow-sm">
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

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
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
                  {...item} 
                  isLocked={item.is_locked}
                  thumbnailUrl={item.thumbnail_url}
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

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
