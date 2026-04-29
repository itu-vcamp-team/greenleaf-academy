"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, MessageSquare,
  LogOut, ChevronLeft, ShieldCheck,
  Zap, Calendar, Phone, Sun, Moon, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useRouter, usePathname as useI18nPathname } from "@/i18n/navigation";
import { useThemeStore } from "@/store/theme.store";
import { useState, useEffect, useRef } from "react";

// ── Available locales (mirrors Navbar.tsx) ────────────────────────────────────
const LOCALE_OPTIONS = [
  { code: "tr-TR", label: "Türkçe", short: "TR", flag: "🇹🇷" },
  { code: "en-US", label: "English", short: "EN", flag: "🇺🇸" },
];

const menuItems = [
  { icon: BarChart3, label: "Genel Bakış",           href: "/admin",                color: "text-blue-500"    },
  { icon: Users,     label: "Kullanıcılar",           href: "/admin/users",          color: "text-emerald-500" },
  { icon: Zap,       label: "Akademi İçerikleri",     href: "/admin/academy-content",color: "text-primary"     },
  { icon: Calendar,  label: "Etkinlikler",            href: "/admin/events",         color: "text-orange-500"  },
  { icon: MessageSquare, label: "Duyurular & Kaynaklar", href: "/admin/content",    color: "text-purple-500"  },
  { icon: Phone,     label: "İletişim Bilgileri",     href: "/admin/contact",        color: "text-teal-500"    },
];

// ── Locale Switcher (admin sidebar version) ───────────────────────────────────
function AdminLocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const i18nPathname = useI18nPathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LOCALE_OPTIONS.find((l) => l.code === locale) ?? LOCALE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/60 transition-all active:scale-95 text-xs font-black"
        title="Dil / Language"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="tracking-widest">{current.short}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-background border border-foreground/10 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-[90]"
          >
            <div className="p-1.5">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => {
                    setOpen(false);
                    router.replace(i18nPathname, { locale: opt.code });
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    opt.code === locale
                      ? "bg-primary/10 text-primary font-black"
                      : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground font-bold"
                  }`}
                >
                  <span className="text-base leading-none">{opt.flag}</span>
                  <div className="flex-1">
                    <p className="text-xs leading-none">{opt.label}</p>
                    <p className="text-[10px] text-foreground/40 mt-0.5 leading-none">{opt.short}</p>
                  </div>
                  {opt.code === locale && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Admin Sidebar ─────────────────────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-background border-r border-border flex flex-col z-50 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">GL Academy</h2>
          <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest leading-none mt-1">
            Admin Paneli
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-black transition-all group relative overflow-hidden ${
                active
                  ? "bg-primary text-white shadow-xl shadow-primary/20"
                  : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="admin-active-pill"
                  className="absolute inset-0 bg-primary z-0"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <item.icon
                size={18}
                className={`relative z-10 transition-colors ${active ? "text-white" : item.color}`}
              />
              <span className="relative z-10">{item.label}</span>

              {!active && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft size={14} className="rotate-180 text-foreground/30" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 mt-auto space-y-4">
        {/* Theme + Locale row */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center p-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/60 transition-all active:scale-95"
            title={theme === "light" ? "Koyu moda geç" : "Açık moda geç"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <AdminLocaleSwitcher />
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-4 px-5 py-3.5 rounded-xl text-xs font-black text-foreground/30 hover:text-primary transition-all uppercase tracking-widest"
        >
          <LogOut size={16} className="rotate-180" />
          Panele Dön
        </Link>

        <div className="p-4 bg-foreground/[0.03] rounded-2xl border border-foreground/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">
              Sistem Aktif
            </span>
          </div>
          <p className="text-[10px] text-foreground/20 leading-relaxed">
            Tüm servisler çalışıyor.
          </p>
        </div>
      </div>
    </aside>
  );
}
