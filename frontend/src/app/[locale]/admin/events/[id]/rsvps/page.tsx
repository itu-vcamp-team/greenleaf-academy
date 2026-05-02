"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft, CalendarCheck, Loader2, Mail, Phone, UserCheck,
  UserX, Calendar, Globe, Lock, Video, Users, Briefcase, MapPin,
  BadgeCheck, Shield, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────────

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
  is_published: boolean;
}

interface RsvpEnriched {
  id: string;
  event_id: string;
  email: string;
  full_name: string | null;
  is_member: boolean;
  created_at: string;
  user_id: string | null;
  username: string | null;
  partner_id: string | null;
  profile_image_path: string | null;
  phone: string | null;
  user_is_active: boolean | null;
}

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

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default function EventRsvpDetailPage({ params }: PageProps) {
  const { locale, id } = React.use(params);

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [rsvps, setRsvps] = useState<RsvpEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "member" | "guest">("all");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [eventRes, rsvpRes] = await Promise.all([
          apiClient.get(`/events/${id}/detail`),
          apiClient.get(`/events/${id}/calendar-rsvps`),
        ]);
        setEvent(eventRes.data);
        setRsvps(rsvpRes.data);
      } catch (err) {
        console.error("Failed to fetch event/rsvps", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const memberCount = rsvps.filter((r) => r.is_member).length;
  const guestCount = rsvps.filter((r) => !r.is_member).length;

  const filteredRsvps = rsvps.filter((r) => {
    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "member" && r.is_member) ||
      (filterMode === "guest" && !r.is_member);

    if (!matchesFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (r.full_name ?? "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.username ?? "").toLowerCase().includes(q) ||
        (r.partner_id ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ── Back button ── */}
      <Link
        href={`/${locale}/admin/events`}
        className="inline-flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Etkinliklere Dön
      </Link>

      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-3 text-orange-500 mb-3">
          <CalendarCheck className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">Takvim İstekleri</span>
        </div>
        {loading ? (
          <div className="h-9 w-80 bg-surface rounded-xl animate-pulse" />
        ) : (
          <h1 className="text-3xl font-black text-foreground tracking-tight line-clamp-2">
            {event?.title}
          </h1>
        )}
      </header>

      {/* ── Event info card ── */}
      {event && (
        <GlassCard className="p-6 border-border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Left: event meta */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  {CATEGORY_ICONS[event.category]}
                </span>
                <span className="font-bold text-sm text-foreground">{CATEGORY_LABELS[event.category]}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-foreground/60">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(event.start_time).toLocaleString("tr-TR")}
                  {event.end_time && (
                    <> → {new Date(event.end_time).toLocaleString("tr-TR")}</>
                  )}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {event.location}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-sm text-foreground/50 leading-relaxed line-clamp-2">{event.description}</p>
              )}
            </div>

            {/* Right: badges & counts */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex gap-2 flex-wrap justify-end">
                {event.visibility === "ALL" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <Globe size={9} /> Herkese Açık
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 bg-surface px-2 py-1 rounded-full">
                    <Lock size={9} /> Sadece Partnerler
                  </span>
                )}
                {event.is_published && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <BadgeCheck size={9} /> Yayında
                  </span>
                )}
              </div>
              {/* Stats */}
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-foreground">{rsvps.length}</p>
                  <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Toplam</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-500">{memberCount}</p>
                  <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Üye</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-500">{guestCount}</p>
                  <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Misafir</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Filter + Search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1.5 p-1 bg-surface rounded-2xl border border-border">
          {(["all", "member", "guest"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterMode === mode
                  ? mode === "member"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : mode === "guest"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-background text-foreground shadow-sm"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              {mode === "all" ? `Tümü (${rsvps.length})` : mode === "member" ? `Üyeler (${memberCount})` : `Misafirler (${guestCount})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="İsim, e-posta, kullanıcı adı ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 h-10 px-4 bg-surface border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* ── RSVP List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredRsvps.length === 0 ? (
        <div className="text-center py-20 text-foreground/40 italic">
          {searchTerm ? "Aramanıza uygun kayıt bulunamadı." : "Henüz takvim isteği yok."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRsvps.map((rsvp, idx) => (
            <motion.div
              key={rsvp.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <GlassCard className="p-5 border-border hover:border-primary/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${
                      rsvp.is_member ? "bg-emerald-500/80" : "bg-blue-500/80"
                    }`}>
                      {(rsvp.full_name ?? rsvp.email)?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-foreground text-sm">
                          {rsvp.full_name || <span className="italic text-foreground/30">İsim yok</span>}
                        </p>
                        {rsvp.is_member ? (
                          <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            <UserCheck size={9} /> Üye
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                            <UserX size={9} /> Misafir
                          </span>
                        )}
                        {rsvp.user_is_active === false && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Pasif Hesap
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-foreground/50 mt-0.5">
                        <Mail size={10} /> {rsvp.email}
                      </div>
                    </div>
                  </div>

                  {/* Partner profile info (only for members) */}
                  {rsvp.is_member && (
                    <div className="flex flex-wrap gap-3 sm:flex-col sm:gap-1 sm:items-end">
                      {rsvp.username && (
                        <span className="text-xs font-bold text-foreground/50">
                          @{rsvp.username}
                        </span>
                      )}
                      {rsvp.partner_id && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                          <Shield size={9} /> {rsvp.partner_id}
                        </span>
                      )}
                      {rsvp.phone && (
                        <span className="flex items-center gap-1 text-xs text-foreground/40">
                          <Phone size={10} /> {rsvp.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/30 shrink-0">
                    <Clock size={11} />
                    {new Date(rsvp.created_at).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer count */}
      {filteredRsvps.length > 0 && (
        <p className="text-center text-xs text-foreground/30 font-bold uppercase tracking-widest pb-4">
          {filteredRsvps.length} kayıt listeleniyor
        </p>
      )}
    </div>
  );
}
