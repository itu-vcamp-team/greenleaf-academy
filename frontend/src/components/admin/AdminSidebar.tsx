"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, MessageSquare,
  LogOut, ChevronLeft, ShieldCheck,
  Zap, Calendar, Phone,
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { icon: BarChart3, label: "Genel Bakış",           href: "/admin",                color: "text-blue-500"    },
  { icon: Users,     label: "Kullanıcılar",           href: "/admin/users",          color: "text-emerald-500" },
  { icon: Zap,       label: "Akademi İçerikleri",     href: "/admin/academy-content",color: "text-primary"     },
  { icon: Calendar,  label: "Etkinlikler",            href: "/admin/events",         color: "text-orange-500"  },
  { icon: MessageSquare, label: "Duyurular & Kaynaklar", href: "/admin/content",    color: "text-purple-500"  },
  { icon: Phone,     label: "İletişim Bilgileri",     href: "/admin/contact",        color: "text-teal-500"    },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-[rgb(var(--surface))] border-r border-gray-100 dark:border-[rgb(var(--border))] flex flex-col z-50 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">GL Academy</h2>
          <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest leading-none mt-1">
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
                  : "text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
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
                  <ChevronLeft size={14} className="rotate-180 text-gray-400 dark:text-white/30" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 mt-auto space-y-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-4 px-5 py-3.5 rounded-xl text-xs font-black text-gray-400 dark:text-white/30 hover:text-primary dark:hover:text-primary transition-all uppercase tracking-widest"
        >
          <LogOut size={16} className="rotate-180" />
          Panele Dön
        </Link>

        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
              Sistem Aktif
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-white/20 leading-relaxed">
            Tüm servisler çalışıyor.
          </p>
        </div>
      </div>
    </aside>
  );
}
