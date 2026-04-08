"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Play, Download, Clock, Lock, ShieldCheck, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserRole } from "@/context/UserRoleContext";
import { useTenant } from "@/context/TenantContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  { id: "reels", label: "Reels Cephaneliği", icon: <Play className="w-4 h-4" /> },
  { id: "masterclass", label: "Masterclass", icon: <ShieldCheck className="w-4 h-4" /> },
];

const CATEGORIES_DE = [
  { id: "reels", label: "Reels Arsenal", icon: <Play className="w-4 h-4" /> },
  { id: "masterclass", label: "Masterclass", icon: <ShieldCheck className="w-4 h-4" /> },
];

const ACADEMY_DATA_SETS: Record<string, any> = {
  tr: {
    reels: [
      {
        id: "tr-r1",
        brand: "STRATEJİ",
        title: "Kanca (Hook) Tekniği",
        description: "Müşteri adayınız telefonunu elinden bırakamadan onu yakalayın! Sosyal medyada 0-5 saniyede adayı nasıl videoda tutarsınız?",
        duration: "2:45",
        videoUrl: "https://www.youtube.com/embed/3Gj9vUMgu3E",
        pdfName: "Kanca_Senaryolari.pdf",
        outcomes: ["0-5 sn kuralı", "Aday tutma oranında %40 artış", "Viral senaryo şablonları"],
        isPublic: false,
      },
      {
        id: "tr-r2",
        brand: "VİZYON",
        title: "Neden Greenleaf Akademi?",
        description: "Türkiye lansmanında neden tek elden eğitim merkezi kullanıyoruz? Misyonumuz ve vizyonumuz.",
        duration: "5:20",
        videoUrl: "https://www.youtube.com/embed/QiW2F9KwhPw",
        outcomes: ["Merkezi eğitim önemi", "Global vizyon", "Ekip bütünlüğü"],
        isPublic: true,
      },
    ],
    masterclass: [
      {
        id: "tr-m1",
        brand: "GLOBAL BÜYÜME",
        title: "Tam Kapsamlı İş Sunumu",
        description: "90 dakikalık derinlemesine kazanç planı, şirket vizyonu ve Türkiye lansman stratejisi.",
        duration: "14:24",
        videoUrl: "https://www.youtube.com/embed/Ngvf07ZDyHI",
        pdfName: "Is_Sunumu_Masterclass.pdf",
        outcomes: ["9 aşamalı kazanç planı", "Derinlik bonusları", "Kariyer basamakları"],
        isPublic: false,
      }
    ]
  },
  de: {
    reels: [
      {
        id: "de-r1",
        brand: "STRATEGIE",
        title: "Hook-Technik",
        description: "Fangen Sie Ihren Interessenten ein, bevor er sein Telefon weglegt! Wie man die Aufmerksamkeit in 0-5 Sekunden hält.",
        duration: "2:45",
        videoUrl: "https://www.youtube.com/embed/3Gj9vUMgu3E",
        pdfName: "Hook_Skripte.pdf",
        outcomes: ["0-5 Sek Regel", "40% höhere Bindung", "Virale Skripte"],
        isPublic: false,
      },
      {
        id: "de-r2",
        brand: "VISION",
        title: "Warum Greenleaf Germany?",
        description: "Warum nutzen wir einen zentralen Ausbildungsknoten für den deutschen Markt?",
        duration: "4:15",
        videoUrl: "https://www.youtube.com/embed/QiW2F9KwhPw",
        outcomes: ["Zentrale Ausbildung", "Globale Vision", "Team-Integrität"],
        isPublic: true,
      },
    ],
    masterclass: [
      {
        id: "de-m1",
        brand: "GLOBALES WACHSTUM",
        title: "Vollständige Business-Präsentation",
        description: "90-minütiger tiefer Einblick in den Vergütungsplan und die globale Vision.",
        duration: "14:24",
        videoUrl: "https://www.youtube.com/embed/Ngvf07ZDyHI",
        pdfName: "Business_Masterclass.pdf",
        outcomes: ["Vergütungsplan", "Tiefenboni", "Karrierestufen"],
        isPublic: false,
      }
    ]
  }
};

export default function AcademyPage() {
  const { role } = useUserRole();
  const { activeTenant } = useTenant();
  const [academyData, setAcademyData] = useState(ACADEMY_DATA_SETS[activeTenant.slug]);
  const [activeTab, setActiveTab] = useState<"reels" | "masterclass">("reels");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<any>(ACADEMY_DATA_SETS[activeTenant.slug].reels[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Switch data set when tenant changes
  useEffect(() => {
    const newData = ACADEMY_DATA_SETS[activeTenant.slug];
    setAcademyData(newData);
    setSelectedVideo(newData.reels[0]);
  }, [activeTenant.slug]);

  // New Education Form State
  const [newEdu, setNewEdu] = useState({
    title: "",
    brand: "STRATEJİ",
    description: "",
    videoUrl: "",
    duration: "5:00",
    isPublic: false,
    outcomes: [""]
  });

  const filteredPlaylist = academyData[activeTab].filter((video: any) => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLockedForGuest = role === "GUEST" && !selectedVideo.isPublic;

  const handleAddEducation = () => {
    const freshEdu = {
      ...newEdu,
      id: Math.random().toString(),
      outcomes: newEdu.outcomes.filter(o => o.trim() !== ""),
      pdfName: "N/A"
    };

    setAcademyData((prev: any) => ({
      ...prev,
      [activeTab]: [freshEdu, ...prev[activeTab]]
    }));
    setIsAdding(false);
    setSelectedVideo(freshEdu);
    setNewEdu({ title: "", brand: "STRATEJİ", description: "", videoUrl: "", duration: "5:00", isPublic: false, outcomes: [""] });
  };

  const handleDeleteEducation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newItems = academyData[activeTab].filter((v: any) => v.id !== id);
    setAcademyData((prev: any) => ({
      ...prev,
      [activeTab]: newItems
    }));
    if (selectedVideo.id === id) {
      setSelectedVideo(newItems[0] || academyData[activeTab === "reels" ? "masterclass" : "reels"][0]);
    }
  };

  const currentCategories = activeTenant.slug === "tr" ? CATEGORIES : CATEGORIES_DE;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-32 px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* PLAYER AREA */}
          <div className="flex-1 space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden glass border-foreground/5 shadow-2xl">
              <iframe 
                src={selectedVideo.videoUrl}
                className={`w-full h-full border-none transition-all duration-700 ${isLockedForGuest ? 'blur-3xl saturate-0 scale-110 pointer-events-none' : ''}`}
                allowFullScreen
              />
              
              {isLockedForGuest && (
                <div className="absolute inset-0 crystal-blur flex flex-col items-center justify-center p-8 text-center z-10 transition-all duration-1000">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md"
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-primary/20 shadow-lg shadow-primary/10">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 tracking-tight drop-shadow-sm">
                      {activeTenant.slug === "tr" ? "Mühimmat Kilidini Açın" : "Arsenal freischalten"}
                    </h2>
                    <p className="text-foreground/70 text-sm mb-8 leading-relaxed font-medium">
                      {activeTenant.slug === "tr" 
                        ? "Partner olduğunuzda bu video ile birlikte 120+ teknik ders, Reels senaryoları ve PDF strateji dökümanlarına kesintisiz erişim sağlayacaksınız."
                        : "Als Partner erhalten Sie sofortigen Zugriff auf dieses Video sowie 120+ technische Lektionen, Reels-Skripte und PDF-Strategiedokumente."}
                    </p>
                    <Link href="/auth/register">
                      <Button size="lg" className="rounded-2xl px-12 gap-3 shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                        {activeTenant.slug === "tr" ? "Partner Ol ve Tümünü İzle" : "Partner werden & Alles sehen"} <ChevronRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="glass p-8 rounded-3xl border-foreground/5 space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      {selectedVideo.brand}
                    </span>
                    {selectedVideo.isPublic && (
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                        {activeTenant.slug === "tr" ? "Herkese Açık" : "Öffentlich"}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-4">{selectedVideo.title}</h1>
                  <p className="max-w-xl text-foreground/60 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                    {selectedVideo.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {!isLockedForGuest && selectedVideo.pdfName && (
                    <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl">
                      <Download className="w-4 h-4" /> {activeTenant.slug === "tr" ? "Teknik PDF İndir" : "PDF Download"}
                    </Button>
                  )}
                  {role === "ADMIN" && (
                    <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                      <Plus className="w-4 h-4" /> {activeTenant.slug === "tr" ? "Ekle" : "Hinzufügen"}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-foreground/5">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> {activeTenant.slug === "tr" ? "Bu Eğitimde Ne Öğreneceksiniz?" : "Was wirst du lernen?"}
                  </h4>
                  <ul className="space-y-3">
                    {selectedVideo.outcomes?.map((outcome: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-foreground/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {isLockedForGuest && (
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-center">
                    <p className="text-xs font-bold text-primary italic mb-2">
                      {activeTenant.slug === "tr" ? "Partner Avantajı:" : "Partner Vorteil:"}
                    </p>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      {activeTenant.slug === "tr" 
                        ? `Partner olduğunuzda bu videonun altındaki dökümanlar ve uygulama metinleri de erişiminize açılacaktır.`
                        : `Als Partner erhalten Sie Zugriff auf die Dokumentation und das Anwendungsskript für dieses Video.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PLAYLIST AREA */}
          <div className="w-full lg:w-[400px] space-y-6">
            <div className="space-y-4">
              <div className="flex p-1 bg-foreground/5 rounded-2xl border border-foreground/5">
                {currentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id as any);
                      const list = academyData[cat.id as keyof typeof academyData];
                      setSelectedVideo(list[0]);
                      setSearchQuery("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === cat.id ? "bg-primary text-white shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Play className="w-3.5 h-3.5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                </div>
                <input 
                  type="text"
                  placeholder={activeTenant.slug === "tr" ? "Eğitim ara..." : "Suchen..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-foreground/5 border border-foreground/5 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary/20 transition-all placeholder:text-foreground/20 italic"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPlaylist.length > 0 ? (
                filteredPlaylist.map((video: any) => (
                  <motion.div
                    key={video.id}
                    layout
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedVideo(video)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all relative group ${
                      selectedVideo.id === video.id 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "glass border-foreground/5 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-24 aspect-video rounded-lg bg-foreground/10 flex items-center justify-center text-foreground/20 relative overflow-hidden">
                        <Play className="w-4 h-4" fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h4 className="text-xs font-black mb-1 line-clamp-1">{video.title}</h4>
                        <p className="text-[10px] text-foreground/40 font-bold flex items-center gap-1 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> {video.duration} • {video.brand}
                        </p>
                      </div>
                    </div>

                    {role === "ADMIN" && (
                      <button
                        onClick={(e) => handleDeleteEducation(video.id, e)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 opacity-20 italic text-sm">
                   {activeTenant.slug === "tr" ? "Bulunamadı." : "Keine Ergebnisse."}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* ADMIN: MODAL */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass p-8 rounded-[2.5rem]"
            >
              <h2 className="text-xl font-black mb-6 uppercase">Yeni Eğitim Ekle</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <input className="glass p-3 rounded-xl outline-none" placeholder="Başlık" value={newEdu.title} onChange={e => setNewEdu({...newEdu, title: e.target.value})} />
                <input className="glass p-3 rounded-xl outline-none" placeholder="YouTube Link" value={newEdu.videoUrl} onChange={e => setNewEdu({...newEdu, videoUrl: e.target.value})} />
                <textarea className="glass p-3 rounded-xl outline-none col-span-2 h-24" placeholder="Açıklama" value={newEdu.description} onChange={e => setNewEdu({...newEdu, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Vazgeç</Button>
                <Button onClick={handleAddEducation}>Kaydet</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
