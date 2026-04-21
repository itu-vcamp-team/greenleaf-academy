"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, Target, Award, Clock, ArrowUpRight, 
  Shield, Zap, Lock, ChevronRight, UserPlus, Info
} from "lucide-react";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import MyProgressStats from "@/components/academy/MyProgressStats";
import ReferenceCodeGenerator from "@/components/academy/ReferenceCodeGenerator";
import ChildDetailModal from "@/components/academy/ChildDetailModal";
import apiClient from "@/lib/api-client";
import { useUserRole } from "@/context/UserRoleContext";
import { useTenant } from "@/context/TenantContext";

interface ChildUser {
  id: string;
  full_name: string;
  partner_id: string;
  role: string;
  shorts_percentage: number;
  masterclass_percentage: number;
  is_active: boolean;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function DashboardPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const t = useTranslations("academy");
  const { role } = useUserRole();
  const { activeTenant } = useTenant();
  const isGuest = role === "GUEST";
  
  const [children, setChildren] = useState<ChildUser[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(!isGuest);
  const [selectedChild, setSelectedChild] = useState<{ id: string, name: string } | null>(null);
  const [childProgress, setChildProgress] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isGuest) {
      Promise.all([
        apiClient.get("/admin/users/my-children"),
        apiClient.get("/announcements"),
        apiClient.get("/resource-links")
      ]).then(([childrenRes, announcementsRes, resourcesRes]) => {
        setChildren(childrenRes.data);
        setAnnouncements(announcementsRes.data);
        setResources(resourcesRes.data);
      }).catch(err => {
        console.error("Dashboard data fetch error:", err);
      }).finally(() => {
        setLoadingChildren(false);
        setLoadingStats(false);
      });
    } else {
       apiClient.get("/announcements").then(res => setAnnouncements(res.data)).catch(() => {});
       setLoadingChildren(false);
       setLoadingStats(false);
    }
  }, [isGuest]);

  const handleChildClick = async (childId: string, childName: string) => {
    setSelectedChild({ id: childId, name: childName });
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/admin/users/child/${childId}/progress`);
      setChildProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch child progress:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-32 px-6">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3 text-primary mb-2">
                <Zap className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">
                   Dashboard
                </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
                Momentum <span className="text-primary italic">Vision</span>
            </h1>
          </motion.div>

          {isGuest && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Link href="/auth/register">
                <Button className="rounded-2xl px-8 py-6 gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-black group transition-all">
                    Partnerliğe Geçiş Yap <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MomentumStat 
            icon={<TrendingUp />} 
            label="Genel Bakış" 
            value={isGuest ? "XXX" : "Aktif"} 
            trend="+12%" 
            isGuest={isGuest}
          />
          <MomentumStat 
            icon={<Users />} 
            label="Aday Listesi" 
            value={isGuest ? "XX" : children.length.toString()} 
            trend={`+${children.filter(c => !c.is_active).length} Yeni`} 
            isGuest={isGuest}
          />
          <MomentumStat 
            icon={<Target />} 
            label="Eğitim Puanı" 
            value={isGuest ? "XXX" : "850"} 
            trend="Lvl 4" 
            isGuest={isGuest}
          />
          <MomentumStat 
            icon={<Award />} 
            label="Rütbe" 
            value={role} 
            trend="Prestige" 
            isGuest={isGuest}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4 px-2">Kendi Gelişimim</h3>
              <MyProgressStats />
            </section>

            {!isGuest && (
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-4 px-2">Ekibini Büyüt</h3>
                <ReferenceCodeGenerator />
              </section>
            )}

            <section>
               <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40">{t("my_children")}</h3>
                  {!isGuest && (
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      TOPLAM: {children.length}
                    </span>
                  )}
               </div>
               
               <GlassCard className={`p-6 border-foreground/5 min-h-[300px] flex flex-col ${isGuest ? 'blur-sm select-none pointer-events-none opacity-50' : ''}`}>
                  {loadingChildren ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary animate-spin opacity-20" />
                    </div>
                  ) : children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {children.map(child => (
                        <div 
                          key={child.id}
                          onClick={() => handleChildClick(child.id, child.full_name)}
                          className="group p-4 rounded-2xl border border-foreground/5 bg-foreground/5 hover:border-primary/30 hover:bg-foreground/10 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center font-black text-foreground/20 border border-foreground/5 group-hover:bg-primary/5 group-hover:text-primary transition-colors uppercase">
                                {child.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{child.full_name}</p>
                                <p className="text-[10px] text-foreground/30 font-medium tracking-widest">#{child.partner_id || "GUEST"}</p>
                              </div>
                            </div>
                            <Info size={16} className="text-foreground/10 group-hover:text-primary/30 transition-colors" />
                          </div>
                          
                          <div className="space-y-3">
                            <MiniProgress label="Shorts" percentage={child.shorts_percentage} color="blue" />
                            <MiniProgress label="Masterclass" percentage={child.masterclass_percentage} color="emerald" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                       <UserPlus className="w-12 h-12 text-foreground/5 mb-4" />
                       <p className="text-foreground/30 text-sm font-medium italic max-w-xs">{t("no_children")}</p>
                    </div>
                  )}
               </GlassCard>
            </section>
          </div>

          <div className="space-y-8">
             {isGuest && (
               <GlassCard className="p-8 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <Shield className="w-10 h-10 text-white/50 mb-2" />
                    <h3 className="text-xl font-black italic leading-tight">Tam Erişimi Aktif Et</h3>
                    <p className="text-white/80 text-xs leading-relaxed">
                      Partnerliğe geçerek ekibini kurmaya başla, adaylarının gelişimini takip et ve tüm kaynaklara eriş.
                    </p>
                    <Link href="/auth/register">
                      <Button variant="secondary" className="w-full font-black text-primary py-6 rounded-2xl">
                        PARTNER OL
                      </Button>
                    </Link>
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
               </GlassCard>
             )}

             <GlassCard className="p-8 border-foreground/5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-6 italic">Mühimmat Kısayolu</h3>
                <div className="space-y-3">
                   {resources.length > 0 ? resources.map(res => (
                     <QuickLink key={res.id} label={res.title} url={res.url} isGuest={isGuest} />
                   )) : (
                     <div className="text-[10px] text-foreground/20 italic">Henüz kaynak bulunmuyor.</div>
                   )}
                </div>
             </GlassCard>

             <GlassCard className="p-8 border-foreground/5 shadow-sm bg-foreground/5">
                <div className="flex items-center gap-3 mb-4">
                   <Clock className="w-5 h-5 text-foreground/20" />
                   <h3 className="text-xs font-black uppercase tracking-widest text-foreground/30 italic">Son Duyurular</h3>
                </div>
                <div className="space-y-4">
                   {announcements.length > 0 ? announcements.map(ann => (
                     <div key={ann.id} className="space-y-1">
                        <p className="text-[11px] font-bold text-foreground/70 line-clamp-2">{ann.title}</p>
                        <p className="text-[9px] text-foreground/30">{new Date(ann.created_at).toLocaleDateString(locale)}</p>
                     </div>
                   )) : (
                     <div className="text-[10px] text-foreground/20 italic">Yeni duyuru bulunmuyor.</div>
                   )}
                </div>
             </GlassCard>
          </div>
        </div>
      </main>

      <ChildDetailModal 
        isOpen={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        childName={selectedChild?.name || ""}
        progress={childProgress}
      />
    </div>
  );
}

function MomentumStat({ icon, label, value, trend, isGuest }: any) {
  return (
    <GlassCard className="p-6 border-foreground/5 hover:border-primary/20 transition-all group overflow-hidden relative">
      <div className={`flex items-center justify-between mb-4 ${isGuest ? 'blur-[2px]' : ''}`}>
        <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
          {icon}
        </div>
        {!isGuest && <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg italic">{trend}</span>}
      </div>
      <div className={`${isGuest ? 'blur-[2px]' : ''}`}>
        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
      {isGuest && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
           <Lock size={16} className="text-primary/40" />
        </div>
      )}
    </GlassCard>
  );
}

function MiniProgress({ label, percentage, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500"
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-foreground/30">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ label, url, isGuest }: any) {
  return (
    <a 
      href={isGuest ? "#" : url} 
      target={isGuest ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={`flex items-center justify-between p-4 rounded-2xl border border-foreground/5 transition-all ${isGuest ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary/30 hover:bg-surface hover:shadow-lg cursor-pointer'}`}
    >
       <span className="text-xs font-bold text-foreground/60">{label}</span>
       {isGuest ? <Lock size={12} className="text-foreground/20" /> : <ArrowUpRight size={16} className="text-foreground/20" />}
    </a>
  );
}00" />}
    </a>
  );
}
