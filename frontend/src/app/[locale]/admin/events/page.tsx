"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "@/i18n/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus, Trash2, Pencil, Calendar, Loader2,
  Globe, Lock, Video, Users, Briefcase, MapPin,
  CheckCircle, Send, CalendarCheck, Bell, BellRing,
  ExternalLink, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";

type EventCategory = "WEBINAR" | "TRAINING" | "CORPORATE" | "MEETUP";
type EventVisibility = "ALL" | "PARTNER_ONLY";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  start_time: string;
  end_time: string | null;
  meeting_link: string | null;
  location: string | null;
  cover_image_url: string | null;
  contact_info: string | null;
  visibility: EventVisibility;
  is_published?: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  category: "WEBINAR" as EventCategory,
  start_time: "",
  end_time: "",
  meeting_link: "",
  location: "",
  contact_info: "",
  visibility: "PARTNER_ONLY" as EventVisibility,
};

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  WEBINAR: <Video size={14} />,
  TRAINING: <Users size={14} />,
  CORPORATE: <Briefcase size={14} />,
  MEETUP: <MapPin size={14} />,
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  WEBINAR: "Webinar",
  TRAINING: "Eğitim",
  CORPORATE: "Kurumsal",
  MEETUP: "Buluşma",
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Notification confirmation dialog after edit
  const [notifyDialog, setNotifyDialog] = useState<{ eventId: string; title: string } | null>(null);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/events/admin/list?limit=100");
      setEvents(res.data);
    } catch {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: CalendarEvent) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      start_time: item.start_time ? item.start_time.slice(0, 16) : "",
      end_time: item.end_time ? item.end_time.slice(0, 16) : "",
      meeting_link: item.meeting_link ?? "",
      location: item.location ?? "",
      contact_info: item.contact_info ?? "",
      visibility: item.visibility,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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

      const savedEditingId = editingId;
      const savedTitle = form.title;

      if (editingId) {
        await apiClient.patch(`/events/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await apiClient.post("/events/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowForm(false);
      fetchEvents();

      // Task 5: After a successful EDIT, prompt admin to notify users
      if (savedEditingId) {
        setNotifyDialog({ eventId: savedEditingId, title: savedTitle });
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      alert(detail ?? "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  // Task 5: Send update notifications to RSVPed users and/or all partners
  const handleNotify = async (notifyRsvped: boolean, notifyPartners: boolean) => {
    if (!notifyDialog) return;
    setNotifying(true);
    try {
      const notifyData = new FormData();
      notifyData.append("notify_rsvped", String(notifyRsvped));
      notifyData.append("notify_all_partners", String(notifyPartners));
      await apiClient.patch(`/events/${notifyDialog.eventId}`, notifyData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch {
      // notification errors are non-critical, silently proceed
    } finally {
      setNotifying(false);
      setNotifyDialog(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(
      "Bu etkinliği silmek istediğinize emin misiniz?\n\n" +
      "• Tüm takvim RSVP'leri silinecek.\n" +
      "• Takvime ekleyen kullanıcılara ve tüm aktif partnerlere otomatik iptal bildirimi gönderilecek."
    )) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/events/${id}`);
      fetchEvents();
    } catch {
      alert("Silme başarısız.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      await apiClient.post(`/events/${id}/publish?notify_partners=true`);
      fetchEvents();
    } catch {
      alert("Yayınlama başarısız.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-orange-500 mb-3">
            <Calendar className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Etkinlik Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Akademi <span className="text-orange-500 italic">Etkinlikleri</span>
          </h1>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-2xl px-8 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" /> Yeni Etkinlik Ekle
        </Button>
      </header>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-foreground/40 italic">
          Henüz etkinlik eklenmemiş.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <GlassCard className="p-5 border-border hover:border-primary/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                        {CATEGORY_ICONS[event.category]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-foreground text-sm line-clamp-1">{event.title}</p>
                          <p className="text-xs text-foreground/40 mt-1">
                          {new Date(event.start_time).toLocaleString("tr-TR")}
                          {" · "}
                          <span className="font-bold">{CATEGORY_LABELS[event.category]}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {event.visibility === "ALL" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              <Globe size={9} /> Herkese Açık
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 bg-surface px-2 py-0.5 rounded-full">
                                <Lock size={9} /> Sadece Partnerler
                            </span>
                          )}
                          {/* Task 5 fix: use strict equality to avoid showing "Yayında" for null is_published */}
                          {event.is_published === true && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={9} /> Yayında
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* RSVP detail page button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push(`/admin/events/${event.id}/rsvps`)}
                        title="Takvim davet detay sayfasını aç"
                      >
                        <CalendarCheck size={12} />
                        Takvim İstekleri
                        <ExternalLink size={10} />
                      </Button>

                      {/* Task 5 fix: show Publish button when is_published is false OR null */}
                      {event.is_published !== true && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handlePublish(event.id)}
                          disabled={publishingId === event.id}
                        >
                          {publishingId === event.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          Yayınla
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-xl border-gray-200"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil size={13} /> Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-50 rounded-xl px-3"
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                      >
                        {deletingId === event.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <h2 className="text-2xl font-black text-foreground mb-6">
                  {editingId ? "Etkinliği Düzenle" : "Yeni Etkinlik Ekle"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">Başlık *</label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Etkinlik başlığı"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Açıklama</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Etkinlik açıklaması..."
                      rows={3}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-surface text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">Kategori *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface text-foreground"
                        required
                      >
                        <option value="WEBINAR">Webinar</option>
                        <option value="TRAINING">Eğitim</option>
                        <option value="CORPORATE">Kurumsal</option>
                        <option value="MEETUP">Buluşma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">Görünürlük</label>
                      <select
                        value={form.visibility}
                        onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}
                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface text-foreground"
                      >
                        <option value="PARTNER_ONLY">Sadece Partnerler</option>
                        <option value="ALL">Herkese Açık</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">Başlangıç *</label>
                      <Input
                        type="datetime-local"
                        value={form.start_time}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">Bitiş</label>
                      <Input
                        type="datetime-local"
                        value={form.end_time}
                        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">Meeting Linki</label>
                    <Input
                      value={form.meeting_link}
                      onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                      placeholder="https://zoom.us/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">Konum</label>
                      <Input
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Online / İstanbul"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/50 mb-2">İletişim</label>
                      <Input
                        value={form.contact_info}
                        onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                        placeholder="+90 555..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 rounded-2xl border border-border"
                      onClick={() => setShowForm(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit" className="flex-1 rounded-2xl" disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingId ? (
                        "Kaydet"
                      ) : (
                        "Oluştur"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notify Users Dialog (shown after edit) ── */}
      <AnimatePresence>
        {notifyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
            >
              <div className="p-8">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <BellRing size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Bildirim Gönder</p>
                    <h3 className="text-lg font-black text-foreground">Etkinlik güncellendi</h3>
                  </div>
                </div>

                <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
                  <strong className="text-foreground">&ldquo;{notifyDialog.title}&rdquo;</strong> etkinliği kaydedildi.
                  Kullanıcıları bu güncelleme hakkında bilgilendirmek ister misiniz?
                </p>

                <div className="space-y-3">
                  {/* Option 1: Notify RSVPed users */}
                  <button
                    onClick={() => handleNotify(true, false)}
                    disabled={notifying}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors text-left disabled:opacity-60"
                  >
                    <Bell size={18} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Takvime ekleyenleri bilgilendir</p>
                      <p className="text-[11px] text-foreground/50">Yalnızca RSVP yapan kullanıcılara mail gönderilir</p>
                    </div>
                  </button>

                  {/* Option 2: Notify all partners */}
                  <button
                    onClick={() => handleNotify(false, true)}
                    disabled={notifying}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors text-left disabled:opacity-60"
                  >
                    <BellRing size={18} className="text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Tüm partnerleri bilgilendir</p>
                      <p className="text-[11px] text-foreground/50">Aktif tüm partner hesaplarına mail gönderilir</p>
                    </div>
                  </button>

                  {/* Option 3: Notify both */}
                  <button
                    onClick={() => handleNotify(true, true)}
                    disabled={notifying}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left disabled:opacity-60"
                  >
                    {notifying ? (
                      <Loader2 size={18} className="text-primary animate-spin shrink-0" />
                    ) : (
                      <CheckCircle size={18} className="text-primary shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground">Her ikisini de bilgilendir</p>
                      <p className="text-[11px] text-foreground/50">Takvime ekleyenler + tüm partnerler (tekrarsız)</p>
                    </div>
                  </button>
                </div>

                {/* Skip */}
                <button
                  onClick={() => setNotifyDialog(null)}
                  className="w-full mt-4 py-3 text-sm font-bold text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  Bildirim gönderme, geç →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
