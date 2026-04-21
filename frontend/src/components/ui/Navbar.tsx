"use client";

import { BrandLogo } from "./BrandLogo";
import { Button } from "./Button";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useTenant } from "@/context/TenantContext";
import { useUserRole } from "@/context/UserRoleContext";
import { useAuthStore } from "@/store/auth.store";
import { Sun, Moon, Calendar, LayoutDashboard, Settings, User, LogOut, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("nav");
  const authT = useTranslations("auth");
  const { activeTenant, theme, toggleTheme } = useTenant();
  const { role } = useUserRole();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isGuest = role === "GUEST";

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const navLinks = [
    { href: "/calendar", label: t("calendar"), icon: <Calendar className="w-4 h-4" /> },
    { href: "/academy", label: t("academy"), icon: null },
    ...(!isGuest ? [{ href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard className="w-4 h-4" /> }] : []),
    ...(isGuest ? [{ href: "/#imkanlar", label: activeTenant?.slug === "tr" ? "İmkanlar" : "Vorteile", icon: null }] : []),
    ...((role === "ADMIN" || role === "SUPERADMIN") ? [{ href: "/settings", label: t("settings"), icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-50 p-4"
      >
        <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <BrandLogo />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} icon={link.icon}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 p-1 bg-black/5 rounded-xl border border-black/10">
               <div className="px-3 py-1 text-[10px] font-bold uppercase text-primary flex items-center gap-1">
                  <span>{activeTenant?.logo}</span>
                  <span>{activeTenant?.name}</span>
               </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isGuest ? (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="rounded-xl">{authT("login")}</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="rounded-xl">{authT("register")}</Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button size="sm" className="gap-2 rounded-xl">
                      <User className="w-4 h-4" />
                      {authT("profile") || "Profilim"}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-foreground/60 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl md:hidden flex flex-col p-8 pt-24"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-black italic tracking-tighter hover:text-primary transition-colors flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {link.icon || <div className="w-4 h-4 border-2 border-current rounded-full" />}
                  </div>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              {isGuest ? (
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full py-6 rounded-2xl border-white/10 uppercase text-[10px] font-black tracking-widest">{authT("login")}</Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full py-6 rounded-2xl uppercase text-[10px] font-black tracking-widest">{authT("register")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full py-6 rounded-2xl gap-3 text-sm font-black italic tracking-tight">
                       <User className="w-5 h-5" /> {authT("profile") || "Profilim"}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                    }}
                    className="w-full py-6 rounded-2xl text-red-400 hover:bg-red-500/10 gap-3 text-sm font-black tracking-tight"
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

function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2 shadow-sm"
    >
      {icon}
      {children}
    </Link>
  );
}

