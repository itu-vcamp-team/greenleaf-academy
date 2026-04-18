"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Clock, Video, Users, Download } from "lucide-react";

export function SmartCalendar() {
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

  return (
    <div className="space-y-6">
      {/* FOMO Countdown Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-primary to-primary-dark shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse-subtle">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Canlı Eğitim Başlıyor!</h3>
              <p className="text-white/80 text-sm">Konu: Profesyonel İtiraz Karşılama Teknikleri</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/20 px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/10">
            <CountdownUnit unit="S" value={timeLeft.hours} />
            <span className="text-white/40 font-bold">:</span>
            <CountdownUnit unit="D" value={timeLeft.minutes} />
            <span className="text-white/40 font-bold">:</span>
            <CountdownUnit unit="SN" value={timeLeft.seconds} />
          </div>

          <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold">
            Takvime Ekle
          </Button>
        </div>
        
        {/* Animated Orbs for Banner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Mini Calendar List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EventCard 
          date="10 Nisan" 
          time="21:00" 
          title="Masterclass: Kazanç Planı" 
          speaker="M. Dünya Kahtalı" 
        />
        <EventCard 
          date="12 Nisan" 
          time="20:00" 
          title="Zoom: Yeni Ürün Lansmanı" 
          speaker="Ürün Geliştirme Ekibi" 
        />
      </div>
    </div>
  );
}

function CountdownUnit({ unit, value }: { unit: string; value: number }) {
  return (
    <div className="flex flex-col items-center min-w-[32px]">
      <span className="text-2xl font-black text-white lining-nums tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{unit}</span>
    </div>
  );
}

function EventCard({ date, time, title, speaker }: { date: string; time: string; title: string; speaker: string }) {
  return (
    <GlassCard className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-500">
          <span className="text-[10px] font-bold text-white/40 uppercase">{date.split(' ')[1]}</span>
          <span className="text-lg font-bold text-white leading-none">{date.split(' ')[0]}</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white/90">{title}</h4>
          <p className="text-xs text-white/40">{speaker} • {time}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Download className="w-4 h-4" />
      </Button>
    </GlassCard>
  );
}
