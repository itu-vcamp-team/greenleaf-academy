"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronRight, Play, BookOpen, Clock, Shield, Target, Plus, Calendar, Globe, Zap, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/context/UserRoleContext";
import { useTenant } from "@/context/TenantContext";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function Home({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations();
  const { role } = useUserRole();
  const { activeTenant } = useTenant();
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 24, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59, hours: prev.hours };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
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
          
          {/* GLOBAL COUNTDOWN HOOK (MOVED TO TOP) */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="relative glass rounded-[2.5rem] p-8 md:p-10 overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Clock className="w-40 h-40" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    {isTR ? "Sıradaki Canlı Eğitim" : "Nächste Live-Schulung"}
                  </p>
                  <h3 className="text-3xl font-bold mb-2 tracking-tight">
                    {isTR ? "Momentum Lansman Stratejisi" : "Momentum Launch-Strategie"}
                  </h3>
                  <p className="text-foreground/40 text-sm italic font-medium">
                    {isTR ? "Katılımcı: M. Dünya Kahtalı • 21:00" : "Sprecher: M. D. Kahtali • 21:00"}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 bg-foreground/5 px-8 py-5 rounded-[2rem] border border-foreground/5">
                  <CountdownUnit value={timeLeft.hours} label={isTR ? "SAAT" : "STD"} />
                  <div className="w-[1px] h-8 bg-foreground/10" />
                  <CountdownUnit value={timeLeft.minutes} label={isTR ? "DAKİKA" : "MIN"} />
                  <div className="w-[1px] h-8 bg-foreground/10" />
                  <CountdownUnit value={timeLeft.seconds} label={isTR ? "SANİYE" : "SEK"} />
                </div>

                {role !== "GUEST" ? (
                  <Button className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-10 py-6 shadow-lg shadow-primary/20">
                    {isTR ? "Eğitime Katıl" : "Teilnehmen"}
                  </Button>
                ) : (
                  <div className="max-w-[140px] text-center">
                    <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1 italic">
                       {isTR ? "Erişim Kısıtlı" : "Eingeschränkt"}
                    </div>
                    <div className="text-[11px] font-bold text-foreground/40 leading-tight">
                      {isTR ? "Liderlik linkleri üyelerimize özeldir." : "Links sind exklusiv für Mitglieder."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

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
                <>Mühimmatı <span className="text-gradient">Kuşan,</span><br /> Globalde <span className="text-primary-dark opacity-40">Büyü.</span></>
              ) : (
                <>Equip the <span className="text-gradient">Arsenal,</span><br /> Scale <span className="text-primary-dark opacity-40">Globally.</span></>
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
                  <Calendar className="w-5 h-5 group-hover:text-primary transition-colors" /> {isTR ? "Canlı Eğitim Takvimi" : "Live-Kalender"}
                </Button>
              </Link>
            </div>
          </section>

          {/* PARTNER PERKS (ONLY FOR GUEST) */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PerkCard 
                  icon={<Globe className="w-6 h-6" />}
                  title={isTR ? "Global Dağıtım Hakları" : "Global Rights"}
                  desc={isTR ? "12+ ülkede resmi temsilcilik ve global cirodan pay alma hakkı." : "Official representation in 12+ countries and global turnover rights."}
                />
                <PerkCard 
                  icon={<Target className="w-6 h-6" />}
                  title={isTR ? "Dijital Cephanelik" : "Digital Arsenal"}
                  desc={isTR ? "Yüksek dönüşümlü Reels senaryoları, PDF sunumlar ve teknik mühimmatlar." : "High-conversion Reels scripts, PDF presentations, and technical tools."}
                />
                <PerkCard 
                  icon={<Zap className="w-6 h-6" />}
                  title={isTR ? "Canlı Mentorluk" : "Live Mentorship"}
                  desc={isTR ? "Bölge liderleriyle haftalık strateji toplantıları ve saha desteği." : "Weekly strategy meetings with regional leads and field support."}
                />
                <PerkCard 
                  icon={<Calendar className="w-6 h-6" />}
                  title={isTR ? "Özel Workshoplar" : "Exclusive Workshops"}
                  desc={isTR ? "Sadece partnerlere özel, kapalı devre profesyonel satış teknikleri eğitimi." : "Closed-circuit professional sales techniques training for partners only."}
                />
                <PerkCard 
                  icon={<BookOpen className="w-6 h-6" />}
                  title={isTR ? "Sertifikalı Eğitim" : "Certified Training"}
                  desc={isTR ? "Akademi müfredatını tamamlayanlara özel Greenleaf onaylı başarı sertifikası." : "Greenleaf-approved success certificate for academy graduates."}
                />
                <PerkCard 
                  icon={<Users className="w-6 h-6" />}
                  title={isTR ? "Liderlik Paneli" : "Leadership Panel"}
                  desc={isTR ? "Kendi ekibinizi yönetebileceğiniz profesyonel aday ve istatistik takip paneli." : "Professional candidate and statistics tracking panel for team management."}
                />
              </div>
            </section>
          )}

          {/* ROADMAP SECTION (ONLY FOR GUEST) */}
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

          {/* ACADEMY PREVIEW (GUEST VS PARTNER) */}
          <section id="akademi" className="space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">
                  {isTR ? <>Eğitim <span className="text-primary italic">Kataloğu</span></> : <>Schulungs <span className="text-primary italic">Katalog</span></>}
                </h2>
                <p className="text-foreground/40 max-w-md italic">
                  {t("academy.continue_watching")}
                </p>
              </div>
              {role !== "GUEST" && (
                <Link href="/academy">
                  <Button variant="ghost" className="gap-2 font-bold text-primary">
                    {isTR ? "Tümünü Gör" : "Alles sehen"} <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AcademyPreviewCard 
                title={isTR ? "Kanca (Hook) Tekniği" : "Hook-Technik"} 
                desc={isTR ? "Sosyal medyada 0-5 saniyede adayı yakalama yöntemleri." : "Methoden, um Interessenten in 0-5 Sekunden zu fangen."}
                locked={role === "GUEST"}
                isTR={isTR}
              />
              <AcademyPreviewCard 
                title={isTR ? "Sealuxe Ürün Tanıtımı" : "Sealuxe-Präsentation"} 
                desc={isTR ? "Yüksek teknoloji cilt bakımı serisinin profesyonel sunumu." : "Professionelle Präsentation der High-Tech-Hautpflegeserie."}
                locked={role === "GUEST"}
                isTR={isTR}
              />
              <AcademyPreviewCard 
                title={isTR ? "Kazanç Planı Matematiği" : "Vergütungsplan-Mathe"} 
                desc={isTR ? "Greenleaf Global ile finansal özgürlük yol haritası." : "Fahrplan zur finanziellen Freiheit mit Greenleaf Global."}
                locked={role === "GUEST"}
                isTR={isTR}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function PerkCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
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

function RoadmapStep({ number, label, desc }: { number: string, label: string, desc: string }) {
  return (
    <div className="space-y-4">
      <div className="text-4xl font-black text-primary/10 tracking-widest">{number}</div>
      <div className="space-y-1">
        <div className="text-sm font-black uppercase tracking-widest text-foreground">{label}</div>
        <div className="text-xs text-foreground/40 leading-relaxed italic">{desc}</div>
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[50px]">
      <span className="text-3xl font-black text-foreground tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function AcademyPreviewCard({ title, desc, locked, isTR }: { title: string, desc: string, locked: boolean, isTR: boolean }) {
  return (
    <div className="relative group cursor-pointer">
      <GlassCard className={`p-8 h-full border-foreground/5 shadow-sm transition-all duration-500 overflow-hidden rounded-[2.5rem] ${locked ? 'hover:border-primary/20' : 'hover:border-primary/50'}`}>
        <div className="mb-6 w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/20">
          <Play className="w-6 h-6" fill="currentColor" fillOpacity={0.1} />
        </div>
        
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-foreground/50 text-sm leading-relaxed mb-6 italic">{desc}</p>
        
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground/30">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 3:15 {isTR ? "dk" : "min"}</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {isTR ? "PDF Mevcut" : "PDF verfügbar"}</span>
        </div>

        {locked && (
          <div className="absolute inset-x-0 inset-y-0 crystal-blur flex flex-col items-center justify-center p-6 text-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Shield className="w-10 h-10 text-primary mb-4" />
            <p className="text-sm font-bold mb-4">{isTR ? "Bu eğitim Partnerlere özeldir." : "Exklusiv für Partner."}</p>
            <Link href="/auth/register">
              <Button size="sm" className="rounded-xl">{isTR ? "Partner Ol ve İzle" : "Partner werden"}</Button>
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
