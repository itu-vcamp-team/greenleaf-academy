"use client";

import { BrandLogo } from "./BrandLogo";
import { Button } from "./Button";
import { Link, useRouter, usePathname as useI18nPathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import {
  Sun, Moon, Calendar, User, LogOut, Menu, X,
  Mail, Phone, Globe, Link2, MessageSquare, Play, ShieldCheck, ChevronDown, LayoutDashboard, GraduationCap,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import apiClient from "@/lib/api-client";

// ── Available locales (add more here as new languages are supported) ─────────

const LOCALE_OPTIONS = [
  { code: "tr-TR", label: "Türkçe", short: "TR", flag: "🇹🇷" },
  { code: "en-US", label: "English", short: "EN", flag: "🇺🇸" },
];

// ── Contact Info Types ────────────────────────────────────────────────────────

type ContactType = "EMAIL" | "PHONE" | "WHATSAPP" | "INSTAGRAM" | "YOUTUBE" | "WEBSITE" | "OTHER";

interface ContactEntry {
  id: string;
  owner_name: string;
  label?: string | null;
  type: ContactType;
  value: string;
  order: number;
}

function getContactHref(type: ContactType, value: string): string {
  switch (type) {
    case "EMAIL":     return `mailto:${value}`;
    case "PHONE":     return `tel:${value}`;
    case "WHATSAPP":  return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "INSTAGRAM": return value.startsWith("http") ? value : `https://instagram.com/${value.replace(/^@/, "")}`;
    case "YOUTUBE":   return value.startsWith("http") ? value : `https://youtube.com/@${value.replace(/^@/, "")}`;
    case "WEBSITE":   return value.startsWith("http") ? value : `https://${value}`;
    default:          return value.startsWith("http") ? value : "#";
  }
}

function ContactTypeIcon({ type }: { type: ContactType }) {
  const cls = "w-3.5 h-3.5 shrink-0";
  switch (type) {
    case "EMAIL":     return <Mail className={cls} />;
    case "PHONE":     return <Phone className={cls} />;
    case "WHATSAPP":  return <MessageSquare className={cls} />;
    case "YOUTUBE":   return <Play className={cls} />;
    case "WEBSITE":   return <Globe className={cls} />;
    case "INSTAGRAM":
    default:          return <Link2 className={cls} />;
  }
}

// ── Locale Switcher Dropdown ──────────────────────────────────────────────────

function LocaleSwitcherDropdown({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const i18nPathname = useI18nPathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LOCALE_OPTIONS.find((l) => l.code === locale) ?? LOCALE_OPTIONS[0];

  // Close on outside click
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

  const switchTo = (code: string) => {
    setOpen(false);
    router.replace(i18nPathname, { locale: code });
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/60 transition-all active:scale-95 ${
          compact ? "p-2.5 text-xs font-black tracking-widest" : "px-3 py-2 text-xs font-black"
        }`}
        title="Dil / Language"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="tracking-widest">{current.short}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 w-40 glass rounded-2xl shadow-2xl shadow-black/10 border border-foreground/5 overflow-hidden z-[80]"
          >
            <div className="p-1.5">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => switchTo(opt.code)}
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

// ── Main Navbar ───────────────────────────────────────────────────────────────

export function Navbar() {
  const t = useTranslations("nav");
  const authT = useTranslations("auth");
  const { theme, toggleTheme } = useThemeStore();
  const { role } = useUserRole();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact info state
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [mobileContactsOpen, setMobileContactsOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  const isGuest = role === "GUEST";
  const showContacts = contacts.length > 0 && role !== "ADMIN";

  // Fetch contact info (public; shown for guest + partner, not admin).
  // We do NOT clear contacts on failure so a re-fetch when role transitions
  // GUEST → PARTNER can never wipe contacts that were already loaded.
  useEffect(() => {
    if (role === "ADMIN") return;
    apiClient
      .get("/contact-info")
      .then((res) => {
        if (res.data?.length > 0) setContacts(res.data);
      })
      .catch(() => {}); // silently fail — keep any previously loaded contacts
  }, [role]);

  // Close desktop contacts dropdown on outside click
  useEffect(() => {
    if (!contactsOpen) return;
    const handler = (e: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contactsOpen]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  // For guests: show both Home (/) and Dashboard (/dashboard) separately.
  // For partners/admins: home link already points to /dashboard, no duplicate needed.
  const navLinks = [
    { href: isGuest ? "/" : "/dashboard", label: t("home"), icon: <User className="w-4 h-4" /> },
    // Guests see Dashboard as a preview page (not the private /dashboard)
    ...(isGuest
      ? [{ href: "/dashboard-preview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> }]
      : []),
    { href: "/calendar", label: t("calendar"), icon: <Calendar className="w-4 h-4" /> },
    { href: "/academy", label: t("academy"), icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-[70] p-4 pointer-events-none"
      >
        <div className="max-w-[1600px] mx-auto glass rounded-full px-4 md:px-8 py-2.5 flex items-center justify-between pointer-events-auto border-white/10 shadow-2xl shadow-black/5">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="shrink-0">
            <BrandLogo />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-foreground/70">
            {navLinks.map((link) => (
              <NavLink
                key={`${link.href}-${link.label}`}
                href={link.href}
                icon={link.icon}
                active={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))}
              >
                {link.label}
              </NavLink>
            ))}

            {/* İletişim dropdown — only when contacts exist and not admin */}
            {showContacts && (
              <div ref={contactRef} className="relative">
                <button
                  onClick={() => setContactsOpen((v) => !v)}
                  className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 group overflow-hidden ${
                    contactsOpen
                      ? "text-primary bg-primary/5"
                      : "hover:text-primary text-foreground/50 hover:bg-primary/5"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  İletişim
                </button>

                <AnimatePresence>
                  {contactsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 right-0 w-72 glass rounded-2xl shadow-2xl shadow-black/10 border border-foreground/5 overflow-hidden z-[80]"
                    >
                      <div className="p-2">
                        {contacts.map((c) => (
                          <a
                            key={c.id}
                            href={getContactHref(c.type, c.value)}
                            target={c.type !== "EMAIL" && c.type !== "PHONE" ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-colors group"
                          >
                            <span className="text-primary mt-0.5">
                              <ContactTypeIcon type={c.type} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-foreground truncate">
                                {c.label ?? c.owner_name}
                              </p>
                              <p className="text-[11px] text-foreground/40 truncate">{c.value}</p>
                              {c.label && (
                                <p className="text-[10px] text-foreground/30 truncate">{c.owner_name}</p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {(role === "ADMIN" || role === "EDITOR") && (
              <div className="hidden md:block">
                <Link href="/admin">
                  <Button size="sm" variant="outline" className="rounded-full px-4 gap-2 border-primary/30 text-primary hover:bg-primary/5">
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                  </Button>
                </Link>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/60 transition-all active:scale-95"
              title={theme === "light" ? "Koyu moda geç" : "Açık moda geç"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Locale switcher dropdown */}
            <LocaleSwitcherDropdown compact />

            <div className="hidden md:flex items-center gap-2">
              {isGuest ? (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="rounded-full px-6">{authT("login")}</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20">{authT("register")}</Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/settings">
                    <Button size="sm" className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20">
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">{authT("profile") || "Profilim"}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="p-2.5 rounded-full text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2.5 rounded-full bg-foreground/5 text-foreground/60 hover:text-primary transition-all active:scale-95 flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-[60] glass rounded-[2.5rem] md:hidden flex flex-col p-8 pt-24 shadow-2xl overflow-y-auto"
          >
            <div className="flex flex-col gap-4">
              {(role === "ADMIN" || role === "EDITOR") && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-bold tracking-tight text-primary transition-colors flex items-center gap-5 p-4 rounded-3xl bg-primary/5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  Admin Panel
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-bold tracking-tight hover:text-primary transition-colors flex items-center gap-5 p-4 rounded-3xl hover:bg-primary/5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    {link.icon || <div className="w-4 h-4 border-2 border-current rounded-full" />}
                  </div>
                  {link.label}
                </Link>
              ))}

              {/* İletişim in mobile */}
              {showContacts && (
                <div>
                  <button
                    onClick={() => setMobileContactsOpen((v) => !v)}
                    className="w-full text-2xl font-bold tracking-tight hover:text-primary transition-colors flex items-center gap-5 p-4 rounded-3xl hover:bg-primary/5 group text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <Phone className="w-5 h-5" />
                    </div>
                    İletişim
                  </button>

                  <AnimatePresence>
                    {mobileContactsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-[68px] pl-4 flex flex-col gap-1"
                      >
                        {contacts.map((c) => (
                          <a
                            key={c.id}
                            href={getContactHref(c.type, c.value)}
                            target={c.type !== "EMAIL" && c.type !== "PHONE" ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-primary/5 transition-colors"
                          >
                            <span className="text-primary">
                              <ContactTypeIcon type={c.type} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">
                                {c.label ?? c.owner_name}
                              </p>
                              <p className="text-xs text-foreground/40 truncate">{c.value}</p>
                            </div>
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-4 pt-6">
              {/* Theme + Locale */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/60 transition-all active:scale-95 text-xs font-black"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {theme === "light" ? "Koyu" : "Açık"}
                </button>

                {/* Mobile locale switcher — inline list */}
                <div className="flex gap-1">
                  {LOCALE_OPTIONS.map((opt) => (
                    <LocaleMobileButton key={opt.code} opt={opt} />
                  ))}
                </div>
              </div>

              {isGuest ? (
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/auth/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full py-7 rounded-3xl border-foreground/10 text-xs font-black uppercase tracking-widest">{authT("login")}</Button>
                  </Link>
                  <Link href="/auth/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full py-7 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">{authT("register")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link href="/dashboard/settings" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full py-7 rounded-3xl gap-3 text-sm font-bold shadow-xl shadow-primary/20">
                      <User className="w-5 h-5" /> {authT("profile") || "Profilim"}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-7 rounded-3xl text-red-500/60 hover:bg-red-500/10 gap-3 text-sm font-bold"
                  >
                    <LogOut className="w-5 h-5" /> {t("logout")}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile locale button — uses the router hook directly (needs to be a component)
function LocaleMobileButton({ opt }: { opt: typeof LOCALE_OPTIONS[number] }) {
  const locale = useLocale();
  const router = useRouter();
  const i18nPathname = useI18nPathname();
  const isActive = opt.code === locale;

  return (
    <button
      onClick={() => router.replace(i18nPathname, { locale: opt.code })}
      className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border transition-all active:scale-95 text-xs font-black ${
        isActive
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-foreground/5 border-foreground/5 text-foreground/60 hover:bg-foreground/10"
      }`}
    >
      <span>{opt.flag}</span>
      <span className="tracking-widest">{opt.short}</span>
    </button>
  );
}

function NavLink({ href, icon, children, active }: { href: string; icon?: React.ReactNode; children: React.ReactNode, active?: boolean }) {
  return (
    <Link
      href={href}
      className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 group overflow-hidden ${
        active
          ? "text-primary bg-primary/5"
          : "hover:text-primary text-foreground/50 hover:bg-primary/5"
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      {children}
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-primary/5 -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}
