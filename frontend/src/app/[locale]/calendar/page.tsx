"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import {
  Calendar as CalendarIcon, Clock, Link as LinkIcon, Plus, Trash2,
  ChevronLeft, ChevronRight, Video, Shield, X
} from "lucide-react";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useUserRole } from "@/context/UserRoleContext";
import apiClient from "@/lib/api-client";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  speaker: string;
  link?: string;
  description: string;
  event_date?: string;
}

export default function CalendarPage() {
  const { role } = useUserRole();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    apiClient.get("/events/calendar")
      .then(res => setEvents(res.data))
      .catch(err => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Delete event failed:", err);
    }
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
            <h1 className="text-4xl font-black text-foreground">
              Akademi <span className="text-primary italic">Canlı Takvim</span>
            </h1>
          </div>

          {(role === "ADMIN" || role === "SUPERADMIN") && (
            <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-2xl px-8 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Yeni Etkinlik Ekle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mini Calendar Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-6 border-foreground/5 shadow-sm">
              <div className="flex items-center justify-between mb-8 text-foreground">
                <h3 className="font-bold text-lg">
                  {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-foreground/5">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-foreground/5">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(d => (
                  <span key={d} className="text-[10px] font-black text-foreground/20 uppercase">{d}</span>
                ))}
              </div>
              <MiniCalendarDays events={events} />
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
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-36 bg-foreground/5 rounded-3xl animate-pulse border border-foreground/5" />
              ))
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CalendarIcon className="w-12 h-12 text-foreground/10 mb-4" />
                <p className="text-foreground/40 font-medium text-sm italic">Yaklaşan etkinlik bulunmuyor.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    role={role}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <AddEventModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onCreated={(newEvent) => setEvents(prev => [newEvent, ...prev])}
      />
    </div>
  );
}

function MiniCalendarDays({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;

  const eventDays = new Set(
    events
      .map(e => e.event_date ? new Date(e.event_date).getDate() : null)
      .filter(Boolean)
  );

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const isToday = day === today.getDate();
        const hasEvent = eventDays.has(day);
        return (
          <div
            key={day}
            className={`aspect-square flex items-center justify-center text-xs rounded-lg relative transition-colors cursor-pointer
              ${isToday ? "bg-primary text-white font-bold shadow-lg shadow-primary/30" : "hover:bg-primary/5 text-foreground/40"}
            `}
          >
            {day}
            {hasEvent && !isToday && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-sm shadow-primary/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EventCard({
  event,
  role,
  onDelete,
}: {
  event: CalendarEvent;
  role: string;
  onDelete: (id: string) => void;
}) {
  const isUpcoming = isEventUpcoming(event.event_date ?? "", event.date, event.time);
  const canJoin = role !== "GUEST" && isUpcoming && !!event.link;

  return (
    <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <GlassCard className="p-8 group border-foreground/5 hover:border-primary/20 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center justify-center min-w-[80px] py-4 bg-foreground/5 rounded-2xl border border-foreground/5">
            <span className="text-sm font-black text-primary">{event.date}</span>
            <span className="text-lg font-bold text-foreground">{event.time}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
              {(role === "ADMIN" || role === "SUPERADMIN") && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="p-2 text-foreground/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-foreground/40 mb-4 italic leading-relaxed">{event.description}</p>
            <div className="flex flex-wrap items-center gap-6">
              {event.speaker && (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                  <Video className="w-4 h-4 text-primary" /> {event.speaker}
                </div>
              )}
              {role === "GUEST" ? (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/20 italic">
                  <Shield className="w-4 h-4" /> Sadece Partnerlere Özel
                </div>
              ) : canJoin ? (
                <a
                  href={event.link!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  <LinkIcon className="w-4 h-4" /> Yayına Katıl
                </a>
              ) : (
                <span className="flex items-center gap-2 text-xs font-bold text-foreground/20 italic cursor-not-allowed">
                  <Clock className="w-4 h-4" /> Yayın Sona Erdi
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function isEventUpcoming(isoDate: string, dateStr?: string, timeStr?: string): boolean {
  if (isoDate) return new Date(isoDate) > new Date();
  if (dateStr === "Bugün" || dateStr === "Yarın") return true;
  try {
    return new Date(`${dateStr} ${timeStr}`) > new Date();
  } catch {
    return true;
  }
}

function AddEventModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (event: CalendarEvent) => void;
}) {
  const [form, setForm] = useState({ title: "", speaker: "", date: "", time: "", description: "", link: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.time) {
      setError("Başlık, tarih ve saat zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiClient.post("/events", {
        ...form,
        event_date: `${form.date}T${form.time}:00`,
      });
      onCreated(res.data);
      onClose();
      setForm({ title: "", speaker: "", date: "", time: "", description: "", link: "" });
    } catch (err) {
      console.error("Create event failed:", err);
      setError("Etkinlik oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface p-8 rounded-[2.5rem] border border-foreground/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="text-foreground/20 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-foreground italic flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" /> Yeni Etkinlik
        </h2>
        <div className="space-y-4">
          <Input
            label="Eğitim Başlığı"
            placeholder="Kanca Tekniği Eğitimi"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
          <Input
            label="Konuşmacı"
            placeholder="Lider Adı"
            icon={<Video size={14}/>}
            value={form.speaker}
            onChange={e => setForm(p => ({ ...p, speaker: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarih"
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              required
            />
            <Input
              label="Saat"
              type="time"
              value={form.time}
              onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Link"
            placeholder="Zoom/Meet Linki"
            icon={<LinkIcon size={14}/>}
            value={form.link}
            onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic pl-1">Açıklama</label>
            <textarea
                placeholder="Eğitim detayları..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-sm h-24 resize-none transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold italic">{error}</p>}
        </div>
        <div className="flex gap-4 mt-8">
          <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
