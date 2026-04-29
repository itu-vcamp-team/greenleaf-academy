"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CalendarPlus, CheckCircle, AlertCircle, Play, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import { useAuthStore } from "@/store/auth.store";

interface UpcomingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  meeting_link?: string | null;
  category: string;
  visibility: string;
  is_rsvped?: boolean;
}

/** Returns days / hours / minutes remaining — no seconds to avoid 1-second ticks. */
function getTimeLeft(targetDate: Date) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };

  const totalMinutes = Math.floor(diff / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    total: totalMinutes,
  };
}

type CalState = "idle" | "form" | "loading" | "success" | "error";

export function NextMeetingCounter() {
  const { role } = useUserRole();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isGuest = role === "GUEST" || !isAuthenticated();

  const [nextEvent, setNextEvent] = useState<UpcomingEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(new Date()));
  const [isFallback, setIsFallback] = useState(false);

  // Calendar invite state — initialized from server-side is_rsvped once event loads
  const [calState, setCalState] = useState<CalState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [calError, setCalError] = useState("");

  // ── Fetch next upcoming event ──────────────────────────────────────────────
  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const res = await apiClient.get("/events?limit=1");
        if (res.data && res.data.length > 0) {
          setNextEvent(res.data[0]);
          setTimeLeft(getTimeLeft(new Date(res.data[0].start_time)));
          setIsFallback(false);
        } else {
          throw new Error("No events");
        }
      } catch {
        // Show motivational placeholder — no real event countdown
        const placeholder = new Date();
        placeholder.setHours(placeholder.getHours() + 14);
        setNextEvent({
          id: "placeholder",
          title: "Gelecek Eğitim & Toplantı",
          start_time: placeholder.toISOString(),
          category: "PLANLANIYOR",
          meeting_link: null,
          visibility: "ALL",
        });
        setTimeLeft(getTimeLeft(placeholder));
        setIsFallback(true);
      }
    };

    fetchNextEvent();
  }, []);

  // ── Sync calState with server-side is_rsvped once event loads ────────────
  useEffect(() => {
    if (nextEvent?.is_rsvped) setCalState("success");
  }, [nextEvent]);

  // ── Countdown tick — every 60 s (no seconds displayed) ────────────────────
  useEffect(() => {
    if (!nextEvent) return;
    const target = new Date(nextEvent.start_time);
    const timer = setInterval(() => {
      const remaining = getTimeLeft(target);
      setTimeLeft(remaining);
      if (remaining.total <= 0) clearInterval(timer);
    }, 60_000);
    return () => clearInterval(timer);
  }, [nextEvent]);

  // ── Calendar invite handlers ───────────────────────────────────────────────
  const handleCalendarClick = useCallback(async () => {
    if (!nextEvent || isFallback) return;

    if (isGuest) {
      // Open inline form to collect name + email
      setCalState("form");
      setCalError("");
      return;
    }

    // Authenticated user — call GET endpoint directly
    setCalState("loading");
    try {
      await apiClient.get(`/events/${nextEvent.id}/add-to-calendar`);
      setCalState("success");
    } catch {
      setCalState("error");
      setCalError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }, [nextEvent, isFallback, isGuest]);

  const handleGuestSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nextEvent) return;

      const trimmedEmail = guestEmail.trim();
      if (!trimmedEmail.includes("@")) {
        setCalError("Lütfen geçerli bir e-posta adresi girin.");
        return;
      }

      setIsSubmitting(true);
      setCalError("");
      try {
        await apiClient.post(`/events/${nextEvent.id}/add-to-calendar/guest`, {
          email: trimmedEmail,
          full_name: guestName.trim() || null,
        });
        setCalState("success");
      } catch (err: unknown) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Bir hata oluştu. Lütfen tekrar deneyin.";
        setCalError(detail);
        // Stay on form so user can retry
      } finally {
        setIsSubmitting(false);
      }
    },
    [nextEvent, guestEmail, guestName]
  );

  const resetCal = () => {
    setCalState("idle");
    setCalError("");
    setGuestEmail("");
    setGuestName("");
    setIsSubmitting(false);
  };

  if (!nextEvent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-12"
    >
      <div className="relative overflow-hidden glass rounded-[2.5rem] p-1 border-primary/20 shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />

        <div className="relative z-10 bg-transparent rounded-[2.4rem] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-10">

          {/* ── Event Info ── */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/10 flex-shrink-0">
              <CalendarPlus size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 italic">
                {isFallback ? "MOMENTUM VISION" : "SIRADAKİ CANLI ETKİNLİK"}
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none mb-3">
                {nextEvent.title}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {nextEvent.category}
                </span>
                {!isFallback && (
                  <span className="text-xs text-foreground/50 font-bold italic">
                    {new Date(nextEvent.start_time).toLocaleString("tr-TR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Countdown (days / hours / minutes — no seconds) ── */}
          <div className="flex items-center gap-4 md:gap-8 bg-foreground/5 px-8 py-5 rounded-[2rem] border border-foreground/10 shadow-sm flex-shrink-0">
            {timeLeft.days > 0 && (
              <>
                <TimeUnit value={timeLeft.days} label="GÜN" />
                <Divider />
              </>
            )}
            <TimeUnit value={timeLeft.hours} label="SAAT" />
            <Divider />
            <TimeUnit value={timeLeft.minutes} label="DAKİKA" />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col items-center gap-3 min-w-[200px]">
            {/* Join button — shown only for authenticated users with a meeting link */}
            {!isGuest && nextEvent.meeting_link && (
              <a
                href={nextEvent.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black italic tracking-tight gap-2 shadow-xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                  <Play size={16} fill="currentColor" />
                  YAYINA KATIL
                </Button>
              </a>
            )}

            {/* Add to Calendar button / form */}
            {!isFallback && (
              <AnimatePresence mode="wait">
                {calState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-600 font-black text-sm bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle size={16} />
                    E-posta gönderildi!
                  </motion.div>
                ) : calState === "form" ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onSubmit={handleGuestSubmit}
                    className="w-full space-y-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">
                        Takvimime Ekle
                      </p>
                      <button
                        type="button"
                        onClick={resetCal}
                        className="text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Adınız (isteğe bağlı)"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-surface/80 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="email"
                      placeholder="E-posta adresiniz *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-surface/80 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {calError && (
                      <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={10} /> {calError}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl h-9 text-xs font-black gap-2 bg-primary/90 hover:bg-primary"
                    >
                      {isSubmitting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <CalendarPlus size={12} />
                          Daveti Gönder
                        </>
                      )}
                    </Button>
                    <p className="text-[9px] text-foreground/40 text-center leading-tight">
                      E-postanız yalnızca bu davet için kullanılır.{" "}
                      <Link href="/legal/kvkk" className="underline hover:text-primary transition-colors">
                        KVKK
                      </Link>
                    </p>
                  </motion.form>
                ) : calState === "error" && !isGuest ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                      <AlertCircle size={14} /> {calError || "Bir hata oluştu."}
                    </div>
                    <button
                      onClick={resetCal}
                      className="text-[10px] text-foreground/40 underline hover:text-primary"
                    >
                      Tekrar dene
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      variant="outline"
                      onClick={handleCalendarClick}
                      disabled={calState === "loading"}
                      className="w-full rounded-2xl h-12 px-6 font-black italic tracking-tight gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 transition-all"
                    >
                      {calState === "loading" ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <CalendarPlus size={16} />
                          TAKVİMİME EKLE
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Fallback / no-meeting-link hint for guests */}
            {(isFallback || (!nextEvent.meeting_link && isGuest)) && (
              <div className="text-center px-2">
                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1 italic">
                  {isFallback ? "HAZIR OLUN" : "BİLGİ BEKLENIYOR"}
                </p>
                <p className="text-[11px] font-bold text-foreground/50 leading-tight">
                  {isFallback
                    ? "Yeni etkinlikler için takipte kalın."
                    : "Yayın linkleri yalnızca partner üyelerine gönderilir."}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[45px]">
      <span className="text-2xl md:text-4xl font-black text-foreground tabular-nums tracking-tighter">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-[1px] h-10 bg-foreground/10" />;
}
