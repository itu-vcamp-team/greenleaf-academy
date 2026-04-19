"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  UserCheck, UserX, Search, Filter, 
  ExternalLink, Shield, Mail, Calendar, 
  Loader2, BadgeCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  username: string;
  created_at: string;
  is_verified: boolean;
}

export default function AdminUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/users/pending");
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Fetch pending error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/approve`);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı reddetmek istediğinize emin misiniz?")) return;
    setActionLoading(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/reject`);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
              <Shield className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Kullanıcı Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Onay <span className="text-emerald-500 italic">Bekleyenler</span></h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder="Aday ara..." 
                className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium outline-none focus:border-emerald-500/50 transition-all shadow-sm w-64"
              />
           </div>
           <Button variant="outline" className="rounded-2xl border-gray-100 bg-white shadow-sm">
             <Filter size={18} className="mr-2" /> Filtrele
           </Button>
        </div>
      </header>

      <GlassCard className="border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Aday Bilgileri</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Durum</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Başvuru Tarihi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto opacity-20" />
                    </td>
                  </tr>
                ) : pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                      Şu an onay bekleyen aday bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400 border border-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-tight mb-1">{user.full_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                               <Mail size={12} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                           <BadgeCheck size={12} /> Email Doğrulandı
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-tighter">
                           <Calendar size={14} /> {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button 
                            onClick={() => handleReject(user.id)}
                            disabled={!!actionLoading}
                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                           >
                              <UserX size={18} />
                           </button>
                           <button 
                            onClick={() => handleApprove(user.id)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                           >
                              {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                              Onayla
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
