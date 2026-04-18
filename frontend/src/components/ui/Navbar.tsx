"use client";

import { BrandLogo } from "./BrandLogo";
import { Button } from "./Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTenant } from "@/context/TenantContext";
import { useUserRole } from "@/context/UserRoleContext";
import { Sun, Moon, Calendar, Shield, Settings } from "lucide-react";

export function Navbar() {
  const { activeTenant, setTenantBySlug, availableTenants, theme, toggleTheme } = useTenant();
  const { role, setRole } = useUserRole();

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 p-4"
    >
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/">
          <BrandLogo />
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/calendar" icon={<Calendar className="w-4 h-4" />}>
            {activeTenant.slug === "tr" ? "Takvim" : "Kalender"}
          </NavLink>
          <NavLink href="/academy">
            {activeTenant.slug === "tr" ? "Akademi" : "Akademie"}
          </NavLink>
          <NavLink href="/dashboard">
            {activeTenant.slug === "tr" ? "Panelim" : "Panel"}
          </NavLink>
          {role === "GUEST" && (
            <NavLink href="/#imkanlar">{activeTenant.slug === "tr" ? "İmkanlar" : "Vorteile"}</NavLink>
          )}
          {(role === "PARTNER" || role === "ADMIN") && (
            <>
              {role === "ADMIN" && (
                <NavLink href="/settings" icon={<Settings className="w-4 h-4" />}>
                  {activeTenant.slug === "tr" ? "Admin" : "Admin"}
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 p-1 bg-black/5 rounded-xl border border-black/10">
            <select 
              value={activeTenant.slug} 
              onChange={(e) => setTenantBySlug(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase text-primary outline-none px-2 cursor-pointer"
            >
              {availableTenants.map(t => <option key={t.id} value={t.slug}>{t.logo}</option>)}
            </select>
            <div className="w-[1px] h-4 bg-black/10" />
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold uppercase text-black/40 dark:text-white/40 outline-none px-2 cursor-pointer"
            >
              <option value="GUEST">Guest</option>
              <option value="PARTNER">Partner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <Link href="/auth/register">
            <Button size="sm">{role === "GUEST" ? "Hemen Katıl" : "Profilim"}</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2"
    >
      {icon}
      {children}
    </Link>
  );
}

