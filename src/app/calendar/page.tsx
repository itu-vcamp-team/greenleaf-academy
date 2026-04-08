"use client";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Clock, Link as LinkIcon, Plus, Trash2, ChevronLeft, ChevronRight, Video, Shield } from "lucide-react";
import { useUserRole } from "@/context/UserRoleContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
  speaker: string;
  link?: string;
  description: string;
};

const INITIAL_EVENTS: Event[] = [
  {
    id: "1",
    title: "Momentum Lansman Stratejisi",
    time: "21:00",
    date: "Bugün",
    speaker: "M. Dünya Kahtalı",
    link: "https://zoom.us/j/123456789",
    description: "Türkiye pazarında ilk 90 günde nasıl devasa bir ağ kurulur? Stratejik yol haritası.",
  },
  {
    id: "2",
    title: "Sealuxe Ürün Masterclass",
    time: "20:00",
    date: "Yarın",
    speaker: "Dr. Ayşe Yılmaz",
    link: "https://zoom.us/j/987654321",
    description: "Yüksek teknoloji cilt bakımı serisinin teknik detayları ve demo sunumu.",
  },
  {
    id: "3",
    title: "Kazanç Planı Derin Dalış",
    time: "19:00",
    date: "10 Nisan Cuma",
    speaker: "Lider Selim Kaplan",
    link: "https://zoom.us/j/456789123",
    description: "9 aşamalı kazanç planı matematiği ve derinlik bonusları analizi.",
  }
];

export default function CalendarPage() {
  const { role } = useUserRole();
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [isAdding, setIsAdding] = useState(false);

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-primary mb-4">
              <CalendarIcon className="w-6 h-6" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">Haftalık Yayın Akışı</span>
            </div>
            <h1 className="text-4xl font-black text-foreground">Akademi <span className="text-primary italic">Canlı Takvim</span></h1>
          </div>
          
          {role === "ADMIN" && (
            <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-2xl px-8 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Yeni Etkinlik Ekle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Sidebar (Mock) */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-6 border-foreground/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Nisan 2026</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {['Pz', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(d => (
                  <span key={d} className="text-[10px] font-black text-foreground/20 uppercase">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors cursor-pointer ${i === 7 ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30' : 'hover:bg-primary/5 text-foreground/40'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
              <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Önemli Not</h4>
              <p className="text-xs text-foreground/60 leading-relaxed italic">
                Tüm yayınlar kayıt altına alınmakta ve 24 saat sonra Akademi - Masterclass bölümüne yüklenmektedir.
              </p>
            </div>
          </div>

          {/* Event List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard className="p-8 group border-foreground/5 hover:border-primary/20 transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center justify-center min-w-[80px] py-4 bg-foreground/5 rounded-2xl border border-foreground/5">
                        <span className="text-sm font-black text-primary">{event.date}</span>
                        <span className="text-lg font-bold">{event.time}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          {role === "ADMIN" && (
                            <button 
                              onClick={() => deleteEvent(event.id)}
                              className="p-2 text-foreground/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/40 mb-4 italic leading-relaxed">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                            <Video className="w-4 h-4 text-primary" /> {event.speaker}
                          </div>
                          {role !== "GUEST" ? (
                            <Link href={event.link || "#"} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                              <LinkIcon className="w-4 h-4" /> Yayına Giriş Yap
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/20 italic">
                              <Shield className="w-4 h-4" /> Sadece Partnerlere Özel
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add Event Modal (Simulated) */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass p-8 rounded-[2.5rem] border-primary/20"
          >
            <h2 className="text-2xl font-bold mb-6">Yeni Canlı Yayın Ekle</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Eğitim Başlığı" className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50" />
              <input type="text" placeholder="Konuşmacı" className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Tarih" className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50" />
                <input type="text" placeholder="Saat" className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50" />
              </div>
              <textarea placeholder="Açıklama" className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 h-24" />
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Vazgeç</Button>
              <Button className="flex-1" onClick={() => {
                setEvents(prev => [{
                  id: Math.random().toString(),
                  title: "Yeni Eğitim",
                  time: "20:00",
                  date: "12 Nisan",
                  speaker: "Lider",
                  description: "Eğitim detayları...",
                }, ...prev]);
                setIsAdding(false);
              }}>Kaydet</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
