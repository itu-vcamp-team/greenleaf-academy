"use client";

import { Leaf, Shield, FileText, LayoutDashboard, BookOpen, Calendar, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";

/** Paths on which the footer should NOT be shown. */
const HIDDEN_PATTERNS = ["/admin"];

const currentYear = new Date().getFullYear();

const LEGAL_LINKS = [
  { href: "/legal/kvkk", label: "KVKK Politikası", Icon: Shield },
  { href: "/legal/aydinlatma", label: "Aydınlatma Metni", Icon: FileText },
];

const PLATFORM_LINKS = [
  { href: "/dashboard", label: "Pano", Icon: LayoutDashboard },
  { href: "/academy", label: "Akademi", Icon: BookOpen },
  { href: "/calendar", label: "Takvim", Icon: Calendar },
];

export function Footer() {
  const pathname = usePathname();

  // Don't render on admin pages (sidebar layout)
  const isHidden = HIDDEN_PATTERNS.some((p) => pathname.includes(p));
  if (isHidden) return null;

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/30 transition duration-500" />
                <div className="relative bg-foreground/5 p-2 rounded-xl border border-foreground/5 group-hover:border-primary/40 transition duration-500">
                  <Leaf className="w-5 h-5 text-primary" fill="currentColor" fillOpacity={0.2} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Greenleaf<span className="text-primary">.</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-bold leading-none">
                  Akademi
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
              Greenleaf Family Global bünyesinde sunulan dijital eğitim platformu.
              Kısa videolardan masterclass içeriklerine, gelişimini takip et.
            </p>

            {/* Contact */}
            <a
              href="mailto:help@greenleafakademi.com"
              className="inline-flex items-center gap-2 text-xs text-foreground/40 hover:text-primary transition-colors"
            >
              <Mail size={13} />
              help@greenleafakademi.com
            </a>
          </div>

          {/* ── Platform Links ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Platform</p>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors group"
                  >
                    <Icon size={14} className="text-foreground/30 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal Links ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Yasal</p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors group"
                  >
                    <Icon size={14} className="text-foreground/30 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground/30">
            © {currentYear} Greenleaf Akademi. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/legal/kvkk"
              className="text-[11px] text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              KVKK
            </Link>
            <span className="text-foreground/20 text-xs">·</span>
            <Link
              href="/legal/aydinlatma"
              className="text-[11px] text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              Aydınlatma Metni
            </Link>
            <span className="text-foreground/20 text-xs">·</span>
            <span className="text-[11px] text-foreground/20">
              greenleafakademi.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
