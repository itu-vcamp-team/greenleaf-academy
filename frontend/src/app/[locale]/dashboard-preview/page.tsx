"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Target, Award, Lock, ChevronRight,
  CheckCircle2, BarChart3, BookOpen, Star, Zap, Shield,
  UserPlus, Bell, Link2, Play, ArrowUpRight, Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

// ─── Mock data (realistic-looking numbers for preview) ───────────────────────

const MOCK_STATS = [
  {
    icon: <TrendingUp />,
    label: "Eğitim İlerlemesi",
    value: "%87",
    trend: "87.4% puan tamamlandı",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
  },
  {
    icon: <Users />,
    label: "Partner Listesi",
    value: "12",
    trend: "Tümü aktif",
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
  },
  {
    icon: <Target />,
    label: "Eğitim Puanı",
    value: "2.840",
    trend: "Maks: 3.200 puan",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
  },
  {
    icon: <Award />,
    label: "Rütbe",
    value: "🥈 Gümüş",
    trend: "Altın rütbeye 360 puan kaldı",
    color: "text-yellow-500",
    bg: "bg-yellow-500/5",
  },
];

const MOCK_PARTNERS = [
  { name: "Ahmet Y.", id: "GLF-2841", shorts: 92, masterclass: 78, active: true },
  { name: "Selin K.", id: "GLF-1934", shorts: 67, masterclass: 55, active: true },
  { name: "Murat D.", id: "GLF-3012", shorts: 44, masterclass: 30, active: false },
  { name: "Elif Ş.", id: "GLF-2200", shorts: 100, masterclass: 91, active: true },
];

const MOCK_ANNOUNCEMENTS = [
  { title: "Mayıs Eğitim Planı Yayınlandı!", pinned: true, date: "30 Nis" },
  { title: "Yeni Masterclass: Pazarlama Stratejileri", pinned: false, date: "28 Nis" },
  { title: "Nisan Ödül Töreni Tarihi Açıklandı", pinned: false, date: "25 Nis" },
];

const FEATURES = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Gerçek Zamanlı İstatistikler",
    desc: "Eğitim ilerleme puanın, rütben ve partnerlerinin gelişimini canlı takip et.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Partner Yönetimi",
    desc: "Alt partnerlerini ekle, gelişimlerini izle ve onay süreçlerini yönet.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Eksklüzif Akademi İçerikleri",
    desc: "Shorts ve Masterclass videoları, kısa özetler ve not alma araçlarına eriş.",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Duyurular & Etkinlikler",
    desc: "Şirket duyurularını ve yaklaşan toplantı tarihlerini kaçırma.",
  },
  {
    icon: <Link2 className="w-6 h-6" />,
    title: "Mühimmat Kısayolları",
    desc: "Sık kullandığın linklere ve kaynak materyallere tek tıkla ulaş.",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Rütbe & Ödül Sistemi",
    desc: "Eğitimde ilerledikçe rütbe kazan, ödül törenlerinde sahne al.",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPreviewPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="max-w-[1600px] mx-auto pt-32 px-6">

        {/* ── Hero CTA Banner ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 rounded-3xl bg-primary p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-primary/30"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/60">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Partner Dashboard Önizleme</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Momentum <span className="italic opacity-80">Vision</span> Seni Bekliyor
              </h1>
              <p className="text-white/70 text-sm md:text-base max-w-xl leading-relaxed">
                Partner olarak katıl — kendi istatistiklerini, ekibini ve akademi içeriklerini
                bu dashboard&apos;dan yönet. Aşağıda gerçek bir partner deneyimini keşfet.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Link href="/auth/register">
                <Button
                  className="w-full font-black bg-white text-primary hover:bg-white/90 py-5 px-10 rounded-2xl shadow-xl gap-2 group"
                >
                  Partner Ol
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="w-full font-bold text-white/70 hover:text-white border border-white/20 hover:bg-white/10 py-5 px-10 rounded-2xl"
                >
                  Zaten hesabım var
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Section Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 text-primary mb-8">
          <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">
            Partner Dashboard — Canlı Önizleme
          </span>
        </div>

        {/* ── Mock Stats Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {MOCK_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <GlassCard className="p-6 border-foreground/5 relative overflow-hidden group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stat.bg} rounded-xl ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg italic">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>

                {/* Lock overlay to indicate this is preview */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black border border-primary/20">
                    ÖNIZLEME
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ── Main Dashboard Layout Preview ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

          {/* Left Column — Partners list preview */}
          <div className="lg:col-span-2 space-y-8">

            {/* Progress section */}
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4 px-2">
                Kendi Gelişimim
              </h3>
              <GlassCard className="p-6 border-foreground/5 relative overflow-hidden">
                {/* Blurred content overlay */}
                <div className="absolute inset-0 flex items-end justify-center pb-6 z-10 pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-primary/20 flex items-center gap-3 shadow-lg">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground/70">
                      Partner olduktan sonra aktif olur
                    </span>
                  </div>
                </div>

                {/* Fake progress bars */}
                <div className="space-y-5 blur-[3px] select-none pointer-events-none">
                  {[
                    { label: "Shorts İlerlemesi", value: 87, color: "bg-blue-500" },
                    { label: "Masterclass İlerlemesi", value: 62, color: "bg-emerald-500" },
                    { label: "Genel Tamamlanma", value: 74, color: "bg-primary" },
                  ].map((bar) => (
                    <div key={bar.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-foreground/60">
                        <span>{bar.label}</span>
                        <span>%{bar.value}</span>
                      </div>
                      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bar.color} rounded-full`}
                          style={{ width: `${bar.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </section>

            {/* Partners list preview */}
            <section>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40">
                  Partnerlerim
                </h3>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                  TOPLAM: {MOCK_PARTNERS.length}
                </span>
              </div>

              <GlassCard className="p-6 border-foreground/5 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 blur-[3px] select-none pointer-events-none">
                  {MOCK_PARTNERS.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-foreground/5 bg-foreground/5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary uppercase">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{p.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-foreground/30 font-medium tracking-widest">
                              #{p.id}
                            </p>
                            {!p.active && (
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase">
                                Onay Bekliyor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-foreground/30">
                            <span>Shorts</span><span>{p.shorts}%</span>
                          </div>
                          <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.shorts}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-foreground/30">
                            <span>Masterclass</span><span>{p.masterclass}%</span>
                          </div>
                          <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.masterclass}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-primary/20 flex flex-col items-center gap-3 shadow-lg text-center">
                    <UserPlus className="w-8 h-8 text-primary" />
                    <p className="text-sm font-bold text-foreground/80">
                      Partnerlerini buradan yönet
                    </p>
                    <p className="text-xs text-foreground/50 max-w-[200px]">
                      Adaylarınızın eğitim ilerlemesini takip edin
                    </p>
                  </div>
                </div>
              </GlassCard>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">

            {/* Partner Ol CTA Card */}
            <GlassCard className="p-8 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <Shield className="w-10 h-10 text-white/50 mb-2" />
                <h3 className="text-xl font-black italic leading-tight">Tam Erişimi Aktif Et</h3>
                <p className="text-white/80 text-xs leading-relaxed">
                  Partnerliğe geçerek ekibini kurmaya başla, adaylarının gelişimini
                  takip et ve tüm kaynaklara eriş.
                </p>
                <Link href="/auth/register">
                  <Button
                    className="w-full font-black bg-white text-primary hover:bg-white/90 py-6 rounded-2xl gap-2 group"
                  >
                    PARTNER OL
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </GlassCard>

            {/* Rank preview */}
            <GlassCard className="p-6 border-foreground/5 relative overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4">Rütbe Sistemi</h3>
              <div className="space-y-3 blur-[3px] select-none pointer-events-none">
                {[
                  { rank: "🥉 Bronz", pct: 35, color: "bg-orange-400" },
                  { rank: "🥈 Gümüş", pct: 65, color: "bg-slate-400" },
                  { rank: "🥇 Altın", pct: 85, color: "bg-yellow-400" },
                  { rank: "💎 Elmas", pct: 100, color: "bg-blue-400" },
                ].map((r) => (
                  <div key={r.rank} className="flex items-center gap-3">
                    <span className="text-sm w-24 font-bold text-foreground/70">{r.rank}</span>
                    <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                      <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-primary/20 flex items-center gap-2 shadow-md">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground/70">Partner olduktan sonra görünür</span>
                </div>
              </div>
            </GlassCard>

            {/* Announcements preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 italic">Duyurular</h3>
                <span className="ml-auto text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {MOCK_ANNOUNCEMENTS.length}
                </span>
              </div>

              {MOCK_ANNOUNCEMENTS.map((ann, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-2xl border transition-all ${
                    ann.pinned
                      ? "border-primary/30 bg-primary/5"
                      : "border-foreground/10 bg-foreground/[0.02]"
                  } ${i > 0 ? "blur-[3px] select-none" : ""}`}
                >
                  {ann.pinned && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                  )}
                  <div className="pl-4 pr-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {ann.pinned && (
                          <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">
                            📌 Sabitlendi
                          </span>
                        )}
                      </div>
                      <time className="text-[10px] text-foreground/30 shrink-0">{ann.date}</time>
                    </div>
                    <p className={`text-sm font-bold leading-snug ${ann.pinned ? "text-foreground" : "text-foreground/80"}`}>
                      {ann.title}
                    </p>
                  </div>
                </div>
              ))}

              {/* Blur + lock on the rest of announcements */}
              <div className="text-center py-2">
                <span className="text-[10px] text-foreground/30 font-bold italic">
                  + daha fazla duyuru partner girişinden görüntülenir
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features Grid ─────────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Neler Sunuyor?</span>
              </div>
              <h2 className="text-3xl font-black text-foreground">
                Dashboard&rsquo;da Seni Bekleyen <span className="text-primary italic">Özellikler</span>
              </h2>
              <p className="text-foreground/50 text-sm max-w-xl mx-auto leading-relaxed">
                Greenleaf Akademi partner dashboard&rsquo;u, iş büyümeni takip etmek için
                ihtiyacın olan her şeyi tek bir yerde toplar.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="p-6 border-foreground/5 hover:border-primary/20 transition-all group h-full">
                  <div className="p-3 bg-primary/5 rounded-xl text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    {feat.icon}
                  </div>
                  <h3 className="font-black text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">{feat.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-primary/20 bg-primary/5 p-10 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Play className="w-4 h-4" fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Hemen Başla</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
              Dashboard&rsquo;unu Aktif Et, <br />
              <span className="text-primary italic">Ekibini Büyüt</span>
            </h2>
            <p className="text-foreground/60 text-sm md:text-base leading-relaxed">
              Referans kodu ile kayıt ol, partnerliğini aktif et ve Momentum Vision
              dashboard&rsquo;unu kullanmaya başla. Her adımda yanındayız.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button className="rounded-2xl px-10 py-6 gap-3 shadow-xl shadow-primary/20 font-black group transition-all text-base">
                  Partner Olarak Kayıt Ol
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-2xl px-10 py-6 font-black border-foreground/15 hover:border-primary/30 text-base gap-2">
                  <ArrowUpRight className="w-5 h-5" />
                  Giriş Yap
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {[
                "Referans kodu ile ücretsiz kayıt",
                "Anında aktif dashboard erişimi",
                "Eğitim & destek dahil",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-foreground/50 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
