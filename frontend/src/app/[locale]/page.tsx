"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronRight, Shield, Target, Plus, Calendar, Users } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import ContentCard from "@/components/academy/ContentCard";
import { NextMeetingCounter } from "@/components/dashboard/NextMeetingCounter";

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface AcademyPreviewItem {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  type: "SHORT" | "MASTERCLASS";
  is_locked: boolean;
  is_new: boolean;
}

export default function Home({ params }: PageProps) {
  const { locale } = React.use(params);
  const { role } = useUserRole();
  const router = useRouter();

  const [previewContents, setPreviewContents] = useState<AcademyPreviewItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (role !== "GUEST") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  // Fetch real academy content for the preview section
  useEffect(() => {
    apiClient
      .get("/academy/contents?type=SHORT")
      .then((res) => {
        setPreviewContents((res.data as AcademyPreviewItem[]).slice(0, 6));
      })
      .catch(() => {
        setPreviewContents([]);
      })
      .finally(() => setPreviewLoading(false));
  }, []);

  const isTR = locale.startsWith("tr");

  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden">
      <Navbar />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Next Event Counter — shared component ── */}
          <NextMeetingCounter />

          {/* HERO SECTION */}
          <section className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {isTR ? "Yeni Nesil Ticaret & Eğitim Ekosistemi" : "Next-Gen Business & Education Ecosystem"}
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] md:leading-[0.9] text-foreground">
              {isTR ? (
                <>Mühimmatı <span className="text-gradient">Kuşan,</span><br /> Globalde <span className="text-primary-dark dark:opacity-40 opacity-70">Büyü.</span></>
              ) : (
                <>Equip the <span className="text-gradient">Arsenal,</span><br /> Scale <span className="text-primary-dark dark:opacity-40 opacity-70">Globally.</span></>
              )}
            </h1>

            <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/50 mb-12 leading-relaxed">
              {isTR
                ? "Artık sadece 'öğrenmek' yetmez. Greenleaf Partneri olarak global ticaret hakları, dijital mühimmatlar ve 24/7 mentorluk ile işinizi sisteme bağlayın."
                : "Learning is no longer enough. As a Greenleaf Partner, link your business to a system with global rights, digital ammunition, and 24/7 mentorship."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-7 rounded-2xl text-lg gap-3 shadow-xl shadow-primary/20">
                  {isTR ? "Partnerlik Yolculuğuna Başla" : "Start Partnership"} <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="outline" size="lg" className="px-8 py-7 rounded-2xl text-lg gap-3 border-foreground/10 group">
                  <Calendar className="w-5 h-5 group-hover:text-primary transition-colors" /> {isTR ? "Canlı Eğitim Takvimi" : "Live Calendar"}
                </Button>
              </Link>
            </div>
          </section>

          {/* PARTNER PERKS */}
          {role === "GUEST" && (
            <section id="imkanlar" className="mb-32 space-y-16">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                  {isTR ? <>Partnerlik <span className="text-primary italic">Avantajları</span></> : <>Partner <span className="text-primary italic">Benefits</span></>}
                </h2>
                <p className="text-foreground/40 max-w-2xl mx-auto italic">
                  {isTR ? "Basit bir üyelikten fazlası; tam kapsamlı bir iş geliştirme cephaneliği." : "More than a membership; a full-scale business development arsenal."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PerkCard
                  icon={<Target className="w-6 h-6" />}
                  title={isTR ? "Dijital Cephanelik" : "Digital Arsenal"}
                  desc={isTR
                    ? "Yüksek dönüşümlü Reels senaryo eğitimleri, Masterclass eğitimleri ve teknik mühimmatlar."
                    : "High-conversion Reels script trainings, Masterclass sessions, and technical tools."}
                />
                <PerkCard
                  icon={<Shield className="w-6 h-6" />}
                  title={isTR ? "Özel Workshoplar" : "Exclusive Workshops"}
                  desc={isTR
                    ? "Sadece partnerlere özel, kapalı devre profesyonel satış teknikleri eğitimleri webinarları."
                    : "Closed-circuit professional sales techniques training webinars for partners only."}
                />
                <PerkCard
                  icon={<Users className="w-6 h-6" />}
                  title={isTR ? "Liderlik Paneli" : "Leadership Panel"}
                  desc={isTR
                    ? "Kendi ekibinizi yönetebileceğiniz profesyonel aday ve istatistik takip paneli."
                    : "Professional candidate and statistics tracking panel to manage your own team."}
                />
              </div>
            </section>
          )}

          {/* ROADMAP SECTION */}
          {role === "GUEST" && (
            <section className="mb-32">
              <GlassCard className="p-12 border-primary/5 bg-primary/[0.02] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                  <ChevronRight className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-4xl font-black leading-tight italic">
                      {isTR ? "Başarıya Giden Sistemli Yol" : "Systematic Path to Success"}
                    </h3>
                    <p className="text-foreground/50 text-sm leading-relaxed">
                      {isTR ? "Tesadüflere yer yok. Greenleaf Akademi sizi adım adım bir müritten bir liderliğe taşır." : "No room for accidents. Greenleaf Academy takes you step-by-step from student to leader."}
                    </p>
                    <Link href="/auth/register">
                      <Button className="rounded-xl px-10 py-6 text-sm">{isTR ? "Hemen Başvur" : "Apply Now"}</Button>
                    </Link>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <RoadmapStep number="01" label={isTR ? "Adaylık" : "Candidate"} desc={isTR ? "Vizyonu anla, mühimmatı incele." : "Understand vision, review tools."} />
                    <RoadmapStep number="02" label={isTR ? "Partnerlik" : "Partner"} desc={isTR ? "Sistemi kuşan, ilk geliri elde et." : "Equip system, get first income."} />
                    <RoadmapStep number="03" label={isTR ? "Liderlik" : "Leader"} desc={isTR ? "Ekibini kur, pasif geliri ölçekle." : "Build team, scale passive income."} />
                  </div>
                </div>
              </GlassCard>
            </section>
          )}

          {/* ACADEMY PREVIEW — real content from API */}
          <section id="akademi" className="space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">
                  {isTR ? <>Eğitim <span className="text-primary italic">Kataloğu</span></> : <>Training <span className="text-primary italic">Catalog</span></>}
                </h2>
                <p className="text-foreground/40 max-w-md italic">
                  {isTR ? "Hazır içeriklere göz at, partnere özel erişim kazan." : "Browse available content and earn partner-exclusive access."}
                </p>
              </div>
              <Link href="/academy">
                <Button variant="ghost" className="gap-2 font-bold text-primary">
                  {isTR ? "Tümünü Gör" : "View All"} <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {previewLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-video bg-foreground/5 rounded-2xl animate-pulse" />
                ))
              ) : previewContents.length > 0 ? (
                previewContents.map((item) => (
                  <ContentCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    thumbnailUrl={item.thumbnail_url}
                    type={item.type}
                    isLocked={item.is_locked}
                    isNew={item.is_new}
                    lockReason="guest"
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <p className="text-foreground/30 italic text-sm">
                    {isTR ? "Henüz içerik eklenmemiş. Yakında!" : "No content yet. Coming soon!"}
                  </p>
                  <Link href="/auth/register" className="mt-4 inline-block">
                    <Button className="rounded-xl px-8 py-5 mt-4">
                      {isTR ? "Partnerlik İçin Başvur" : "Apply for Partnership"}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function PerkCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <GlassCard className="p-8 border-foreground/5 hover:border-primary/20 transition-all group rounded-3xl">
      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-lg font-black mb-2">{title}</h3>
      <p className="text-foreground/40 text-sm leading-relaxed">{desc}</p>
    </GlassCard>
  );
}

function RoadmapStep({ number, label, desc }: { number: string; label: string; desc: string }) {
  return (
    <div className="space-y-4">
      <div className="text-4xl font-black text-primary/20 dark:text-primary/10 tracking-widest">{number}</div>
      <div className="space-y-1">
        <div className="text-sm font-black uppercase tracking-widest text-foreground">{label}</div>
        <div className="text-xs text-foreground/40 leading-relaxed italic">{desc}</div>
      </div>
    </div>
  );
}
