"use client";

import { useUserRole } from "@/context/UserRoleContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = useUserRole();
  const router = useRouter();

  // Simple client-side guard
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  useEffect(() => {
    // Note: In a real app, we'd also check server-side sessions
    // but here we rely on the context for UI protection.
    if (!isAdmin && role !== undefined) {
      // Small delay to allow state hydration
      const timer = setTimeout(() => {
        if (!isAdmin) router.push("/dashboard");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role, isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 border border-primary/20"
        >
          <Lock className="text-primary" size={32} />
        </motion.div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Yetkisiz Erişim</h1>
        <p className="text-gray-500 max-w-sm mb-8 font-medium leading-relaxed">
          Bu alan yalnızca yönetici rütbesine sahip kullanıcılara özeldir. Yönlendiriliyorsunuz...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-72 p-12 min-h-screen">
        {children}
      </main>
    </div>
  );
}
