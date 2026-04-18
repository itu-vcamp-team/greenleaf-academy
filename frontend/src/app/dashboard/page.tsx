"use client";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Users, Target, Award, Clock, ArrowUpRight, Shield, Zap, Lock, ChevronRight } from "lucide-react";
import { useUserRole } from "@/context/UserRoleContext";
import { useTenant } from "@/context/TenantContext";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const { role } = useUserRole();
  const { activeTenant } = useTenant();
  const isTR = activeTenant.slug === "tr";
  const isGuest = role === "GUEST";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-32 px-6">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary mb-2">
                <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">
                {isTR ? "Liderlik Paneli Önizlemesi" : "Leader-Panel Vorschau"}
                </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
                {isTR ? "Momentum" : "Momentum"} <span className="text-primary italic">{isTR ? "Vizyonu" : "Vision"}</span>
            </h1>
          </div>

          {isGuest && (
            <Link href="/auth/register">
                <Button className="rounded-2xl px-8 py-6 gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-dark text-white font-black group">
                    {isTR ? "Partnerliğe Geçiş Yap" : "Zum Partner aufsteigen"} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative">
          <MomentumStat 
            icon={<TrendingUp />} 
            label={isTR ? "Haftalık Kazanç" : "Wochengewinn"} 
            value={isGuest ? "1.XXX $" : "1,240 $"} 
            trend="+12%" 
            isGuest={isGuest}
            explainer={isTR ? "Kazançlarınız burada birikecek." : "Ihre Gewinne werden hier angezeigt."}
          />
          <MomentumStat 
            icon={<Users />} 
            label={isTR ? "Aday Listesi" : "Interessenten"} 
            value={isGuest ? "XX" : "24"} 
            trend="+5" 
            isGuest={isGuest}
            explainer={isTR ? "Ekibinizi buradan yöneteceksiniz." : "Verwalten Sie Ihr Team hier."}
          />
          <MomentumStat 
            icon={<Target />} 
            label={isTR ? "Akademi Puanı" : "Akademie-Punkte"} 
            value={isGuest ? "XXX" : "850"} 
            trend="Lvl 4" 
            isGuest={isGuest}
            explainer={isTR ? "Eğitim puanlarınız burada görünecek." : "Ihre Trainingspunkte werden hier angezeigt."}
          />
          <MomentumStat 
            icon={<Award />} 
            label={isTR ? "Aktiflik Durumu" : "Aktivitätsstatus"} 
            value={isTR ? "Aktif" : "Aktiv"} 
            trend="90 Gün" 
            isGuest={isGuest}
            explainer={isTR ? "Ticari durum takibiniz." : "Ihre geschäftliche Statusverfolgung."}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-8 border-foreground/5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" /> {isTR ? "Canlı Aktivite Akışı" : "Live-Aktivitätsfeed"}
                </h3>
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest italic">{isTR ? "Liderlik Hattı" : "Leader-Line"}</span>
              </div>
              
              <div className={`space-y-4 transition-all duration-1000 ${isGuest ? 'blur-sm select-none pointer-events-none opacity-50' : ''}`}>
                <ActivityItem user="Selim K." action={isTR ? "İş Planı videosunu %100 tamamladı" : "Geschäftsplan Video 100% abgeschlossen"} time="2dk önce" highlight />
                <ActivityItem user="Merve A." action={isTR ? "Sealuxe Teknik PDF indirdi" : "Sealuxe PDF heruntergeladen"} time="15dk önce" />
                <ActivityItem user="Ali V." action={isTR ? "Aday kayıt formunu doldurdu" : "Anmeldeformular ausgefüllt"} time="1sa önce" />
                <ActivityItem user="Canan Y." action={isTR ? "Kanca Tekniği videosunu izledi" : "Hook-Technik Video angesehen"} time="3sa önce" />
              </div>

              {isGuest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-background/10 backdrop-blur-[2px]">
                   <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                     <Users className="w-6 h-6 text-primary" />
                   </div>
                   <h4 className="font-black text-lg mb-2">{isTR ? "Ekip Dinamiğini İzleyin" : "Beobachten Sie die Teamdynamik"}</h4>
                   <p className="text-xs text-foreground/50 max-w-[280px]">
                     {isTR ? "Partner olduğunuzda alt ekibinizin tüm aktivitelerini ve gelişimini anlık olarak buradan takip edebileceksiniz." 
                          : "Als Partner können Sie alle Aktivitäten und Entwicklungen Ihres Unterteams in Echtzeit verfolgen."}
                   </p>
                </div>
              )}

              {!isGuest && (
                <Button variant="ghost" className="w-full mt-8 border border-foreground/5 text-foreground/40 font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors">
                    {isTR ? "Tümünü Görüntüle" : "Alle anzeigen"}
                </Button>
              )}
            </GlassCard>
          </div>

          {/* Goals & Quick Links */}
          <div className="space-y-6">
            <GlassCard className="p-8 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className={`transition-all ${isGuest ? 'blur-sm' : ''}`}>
                <h3 className="text-lg font-black mb-2 italic">{isTR ? "Haftalık Hedef" : "Wochenziel"}</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                    {isTR ? "Yeni 5 partner kaydı alarak 'Elite' seviyesine yükselin." : "Erreichen Sie 'Elite', indem Sie 5 neue Partner registrieren."}
                </p>
                <div className="w-full bg-white/20 h-2 rounded-full mb-6 overflow-hidden">
                    <div className="bg-white h-full w-[60%] shadow-lg" />
                </div>
                <Button className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl">
                    {isTR ? "İlerleme Detayı" : "Fortschrittsdetails"}
                </Button>
              </div>

              {isGuest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                   <Lock className="w-8 h-8 text-white mb-3 opacity-40" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">
                     {isTR ? "Hedef Takip Sistemi" : "Zielverfolgung"}
                   </p>
                   <p className="text-[9px] text-white/60 mt-2">
                     {isTR ? "Partner olduğunuzda kendi hedeflerinizi buradan yöneteceksiniz." : "Verwalten Sie Ihre Ziele als Partner hier."}
                   </p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-8 border-foreground/5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-6">
                {isTR ? "Mühimmat Kısayolu" : "Arsenal-Schnellzugriff"}
              </h3>
              <div className="space-y-3">
                <QuickLink label={isTR ? "Sunum Dosyaları" : "Präsentationsdateien"} isGuest={isGuest} />
                <QuickLink label={isTR ? "Yasal Evraklar" : "Rechtliche Dokumente"} isGuest={isGuest} />
                <QuickLink label={isTR ? "Ürün Fiyat Listesi" : "Produktpreisliste"} isGuest={isGuest} />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Guest Footer CTA */}
        {isGuest && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 text-center space-y-6 max-w-2xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    <Shield className="w-3 h-3" /> {isTR ? "Tam Erişim Paketi" : "Vollzugriffspaket"}
                </div>
                <h2 className="text-3xl font-black">
                    {isTR ? "Bu Gücü Kendi Ticaretinize Yansıtın" : "Nutzen Sie diese Kraft für Ihr Geschäft"}
                </h2>
                <p className="text-foreground/50 text-sm leading-relaxed">
                    {isTR ? "Burası basit bir uygulama değil, mühimmatlarınızı, ekibinizi ve kazancınızı yönettiğiniz kontrol merkezinizdir. Hemen partner olun ve tüm özellikleri aktif edin." 
                         : "Dies ist keine einfache App, sondern Ihr Kontrollzentrum, in dem Sie Ihr Arsenal, Ihr Team und Ihren Gewinn verwalten. Werden Sie Partner und aktivieren Sie alle Funktionen."}
                </p>
                <Link href="/auth/register">
                    <Button size="lg" className="rounded-2xl px-12 py-8 text-lg font-black bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
                        {isTR ? "HEMEN PARTNER OL VE BAŞLA" : "JETZT PARTNER WERDEN"}
                    </Button>
                </Link>
            </motion.div>
        )}
      </main>
    </div>
  );
}

function MomentumStat({ icon, label, value, trend, isGuest, explainer }: { icon: React.ReactNode, label: string, value: string, trend: string, isGuest: boolean, explainer: string }) {
  return (
    <GlassCard className="p-6 border-foreground/5 hover:border-primary/20 transition-all group overflow-hidden relative">
      <div className={`flex items-center justify-between mb-4 ${isGuest ? 'blur-sm' : ''}`}>
        <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
          {icon}
        </div>
        <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg italic">{trend}</span>
      </div>
      <div className={`${isGuest ? 'blur-sm' : ''}`}>
        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>

      {isGuest && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-primary/[0.02] text-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <p className="text-[10px] font-black text-primary leading-tight italic">{explainer}</p>
        </div>
      )}
    </GlassCard>
  );
}

function ActivityItem({ user, action, time, highlight = false }: { user: string, action: string, time: string, highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${highlight ? 'bg-primary/5 border-primary/20 shadow-sm' : 'border-foreground/5 hover:border-primary/10'}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-[10px] font-black text-foreground/40 border border-foreground/5">
          {user.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-black text-foreground">{user}</p>
          <p className="text-xs text-foreground/40 leading-none">{action}</p>
        </div>
      </div>
      <span className="text-[10px] text-foreground/20 font-black uppercase tracking-tighter">{time}</span>
    </div>
  );
}

function QuickLink({ label, isGuest }: { label: string, isGuest: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-colors group ${isGuest ? 'cursor-not-allowed opacity-50' : 'hover:bg-foreground/5 cursor-pointer'}`}>
      <span className={`text-xs font-bold transition-colors ${isGuest ? 'text-foreground/20' : 'text-foreground/60 group-hover:text-primary'}`}>{label}</span>
      {isGuest ? <Lock className="w-3 h-3 text-foreground/10" /> : <ArrowUpRight className="w-4 h-4 text-foreground/20 group-hover:text-primary transition-all" />}
    </div>
  );
}
