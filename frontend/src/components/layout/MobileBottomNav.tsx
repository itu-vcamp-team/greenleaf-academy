"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Calendar, FolderOpen, User } from "lucide-react";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
  { href: "/academy", icon: BookOpen, labelKey: "nav.academy" },
  { href: "/calendar", icon: Calendar, labelKey: "nav.calendar" },
  { href: "/resources", icon: FolderOpen, labelKey: "nav.resources" },
  { href: "/settings", icon: User, labelKey: "nav.settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname.includes(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-foreground/50 hover:text-foreground/70"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
