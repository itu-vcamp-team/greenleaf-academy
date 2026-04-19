"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, Users, MessageSquare, Files, 
  Settings, LogOut, ChevronLeft, ShieldCheck,
  MousePointer2
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { icon: BarChart3, label: "Statistikler", href: "/admin", color: "text-blue-500" },
  { icon: Users, label: "Kullanıcılar", href: "/admin/users", color: "text-emerald-500" },
  { icon: MessageSquare, label: "Duyurular", href: "/admin/content", color: "text-orange-500" },
  { icon: MousePointer2, label: "Waitlist", href: "/admin/waitlist", color: "text-purple-500" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-50">
      {/* Brand Header */}
      <div className="p-8 pb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
           <h2 className="text-xl font-black text-gray-900 tracking-tight">GL Academy</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Admin Command Center</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.endsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group relative overflow-hidden ${
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/20" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary z-0"
                />
              )}
              <item.icon size={20} className={`relative z-10 transition-colors ${isActive ? "text-white" : item.color}`} />
              <span className="relative z-10">{item.label}</span>
              
              {!isActive && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft size={16} className="rotate-180" />
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
          className="flex items-center gap-4 px-6 py-4 rounded-xl text-xs font-black text-gray-400 hover:text-primary transition-all uppercase tracking-widest"
        >
          <LogOut size={16} className="rotate-180" />
          Panele Dön
        </Link>
        
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Status: OK</span>
           </div>
           <p className="text-[9px] text-gray-300 font-medium">Last Login: 2 min ago</p>
        </div>
      </div>
    </aside>
  );
}
