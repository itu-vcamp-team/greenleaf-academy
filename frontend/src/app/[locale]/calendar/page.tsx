"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon, Clock, Link as LinkIcon, Plus, Trash2,
  ChevronLeft, ChevronRight, Video, Shield, X, MapPin, Phone, CalendarPlus, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserRole } from "@/context/UserRoleContext";
import { useAuthStore } from "@/store/auth.store";
import { Link } from "@/i18n/navigation";
import apiClient from "@/lib/api-client";

// Matches the backend EventResponse schema exactly
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: "WEBINAR" | "TRAINING" | "CORPORATE" | "MEETUP";
  start_time: string;
  end_time: string | null;
  meeting_link: string | null;
  location: string | null;
  cover_image_url: string | null;
  contact_info: string | null;
  visibility: "ALL" | "PARTNER_ONLY";
  is_published?: boolean;
  is_rsvped?: boolean;
}

export default function CalendarPage() {
  const { role } = useUserRole();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchEvents = () => {
    const now = new Date();
    apiClient
      .get(`/events/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
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

          {role === "ADMIN" && (
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
                {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => (
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
                {events.map((event) => (
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
        onCreated={() => {
          setIsAdding(false);
          fetchEvents();
        }}
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
    events.map((e) => new Date(e.start_time).getDate())
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = role === "GUEST" || !isAuthenticated();

  const startTime = new Date(event.start_time);
  const isUpcoming = startTime > new Date();
  const canJoin = !isGuest && isUpcoming && !!event.meeting_link;

  const [calState, setCalState] = useState<"idle" | "form" | "loading" | "success">(
    event.is_rsvped ? "success" : "idle"
  );
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [calError, setCalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetCal = () => {
    setCalState("idle");
    setCalError("");
    setGuestEmail("");
    setGuestName("");
    setIsSubmitting(false);
  };

  const handleAddToCalendar = async () => {
    if (isGuest) {
      setCalState("form");
      setCalError("");
      return;
    }
    setCalState("loading");
    try {
      await apiClient.get(`/events/${event.id}/add-to-calendar`);
      setCalState("success");
    } catch {
      setCalState("idle");
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = guestEmail.trim();
    if (!trimmedEmail.includes("@")) {
      setCalError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    setIsSubmitting(true);
    setCalError("");
    try {
      await apiClient.post(`/events/${event.id}/add-to-calendar/guest`, {
        email: trimmedEmail,
        full_name: guestName.trim() || null,
      });
      setCalState("success");
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Bir hata oluştu. Lütfen tekrar deneyin.";
      setCalError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateStr = startTime.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  const timeStr = startTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <GlassCard className="p-8 group border-foreground/5 hover:border-primary/20 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center justify-center min-w-[80px] py-4 bg-foreground/5 rounded-2xl border border-foreground/5">
            <span className="text-sm font-black text-primary">{dateStr}</span>
            <span className="text-lg font-bold text-foreground">{timeStr}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
              {role === "ADMIN" && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="p-2 text-foreground/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-foreground/40 mb-4 italic leading-relaxed">{event.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2">
              {event.location && (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                  <MapPin className="w-4 h-4 text-primary" /> {event.location}
                </div>
              )}
              {event.contact_info && (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                  <Phone className="w-4 h-4 text-primary" /> {event.contact_info}
                </div>
              )}

              {role === "GUEST" ? (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/20 italic">
                  <Shield className="w-4 h-4" /> Sadece Partnerlere Özel
                </div>
              ) : canJoin ? (
                <a
                  href={event.meeting_link!}
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

              {isUpcoming && (
                <AnimatePresence mode="wait">
                  {calState === "success" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800"
                    >
                      <CheckCircle className="w-4 h-4" /> Takvime Eklendi
                    </motion.span>
                  ) : calState === "form" ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      onSubmit={handleGuestSubmit}
                      className="flex flex-col gap-2 w-full max-w-xs"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Takvimime Ekle</p>
                        <button type="button" onClick={resetCal} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Adınız (isteğe bağlı)"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="px-3 py-2 text-xs border border-foreground/10 rounded-xl bg-white/80 dark:bg-black/40 placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="email"
                        placeholder="E-posta adresiniz *"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                        className="px-3 py-2 text-xs border border-foreground/10 rounded-xl bg-white/80 dark:bg-black/40 placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      {calError && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {calError}
                        </p>
                      )}
                      <Button type="submit" disabled={isSubmitting} className="rounded-xl h-8 text-xs font-black gap-2 bg-primary/90 hover:bg-primary">
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CalendarPlus className="w-3 h-3" /> Daveti Gönder</>}
                      </Button>
                      <p className="text-[9px] text-foreground/30 text-center">
                        E-postanız yalnızca bu davet için kullanılır.{" "}
                        <Link href="/legal/kvkk" className="underline hover:text-primary transition-colors">KVKK</Link>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.button
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleAddToCalendar}
                      disabled={calState === "loading"}
                      className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {calState === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><CalendarPlus className="w-4 h-4" /> Takvimime Ekle</>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}

              {event.end_time && (
                <span className="text-xs text-foreground/30">
                  Bitiş: {new Date(event.end_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AddEventModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "WEBINAR" as const,
    start_time: "",
    end_time: "",
    meeting_link: "",
    location: "",
    contact_info: "",
    visibility: "PARTNER_ONLY" as const,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title || !form.start_time) {
      setError("Başlık ve başlangıç zamanı zorunludur.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("start_time", form.start_time);
      formData.append("visibility", form.visibility);
      if (form.description) formData.append("description", form.description);
      if (form.end_time) formData.append("end_time", form.end_time);
      if (form.meeting_link) formData.append("meeting_link", form.meeting_link);
      if (form.location) formData.append("location", form.location);
      if (form.contact_info) formData.append("contact_info", form.contact_info);

      await apiClient.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onCreated();
      setForm({
        title: "", description: "", category: "WEBINAR",
        start_time: "", end_time: "", meeting_link: "",
        location: "", contact_info: "", visibility: "PARTNER_ONLY",
      });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Etkinlik oluşturulamadı. Lütfen tekrar deneyin.");
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
        className="w-full max-w-lg bg-surface p-8 rounded-[2.5rem] border border-foreground/5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
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
            label="Başlık *"
            placeholder="Etkinlik başlığı"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic pl-1">Kategori *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as typeof form.category }))}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm transition-all"
              >
                <option value="WEBINAR">Webinar</option>
                <option value="TRAINING">Eğitim</option>
                <option value="CORPORATE">Kurumsal</option>
                <option value="MEETUP">Buluşma</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic pl-1">Görünürlük</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value as typeof form.visibility }))}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm transition-all"
              >
                <option value="PARTNER_ONLY">Sadece Partnerler</option>
                <option value="ALL">Herkese Açık</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Başlangıç *"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              required
            />
            <Input
              label="Bitiş"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
            />
          </div>

          <Input
            label="Meeting Linki"
            placeholder="https://zoom.us/..."
            icon={<LinkIcon size={14} />}
            value={form.meeting_link}
            onChange={(e) => setForm((p) => ({ ...p, meeting_link: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Konum"
              placeholder="Online / İstanbul"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
            <Input
              label="İletişim"
              placeholder="+90 555..."
              value={form.contact_info}
              onChange={(e) => setForm((p) => ({ ...p, contact_info: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic pl-1">Açıklama</label>
            <textarea
              placeholder="Etkinlik detayları..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-sm h-24 resize-none transition-all"
            />
          </div>

          <p className="text-xs text-foreground/40 italic bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
            💡 Etkinlik taslak olarak kaydedilir. Admin panelinden yayınlayabilirsiniz.
          </p>

          {error && <p className="text-red-500 text-xs font-bold italic">{error}</p>}
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Oluştur"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
