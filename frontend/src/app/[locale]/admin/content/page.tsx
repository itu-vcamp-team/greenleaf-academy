"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  MessageSquare, Files, Plus, Trash2, 
  MapPin, Link2, Type, AlignLeft, 
  CheckCircle2, XCircle, Loader2, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<"announcements" | "resources">("announcements");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "announcements" ? "/announcements/admin" : "/resources/admin";
      const res = await apiClient.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpoint = activeTab === "announcements" ? "/announcements/" : "/resources/";
      await apiClient.post(endpoint, formData);
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
       const endpoint = activeTab === "announcements" 
        ? `/announcements/${id}` 
        : `/resources/${id}`;
       await apiClient.patch(endpoint, { is_active: !currentStatus });
       fetchData();
    } catch (err) {
       console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu içeriği kaldırmak istediğinize emin misiniz? (Soft delete)")) return;
    try {
       const endpoint = activeTab === "announcements" 
        ? `/announcements/${id}` 
        : `/resources/${id}`;
       await apiClient.delete(endpoint);
       fetchData();
    } catch (err) {
       console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-orange-500 mb-2">
              <MessageSquare className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">İçerik Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Akademi <span className="text-orange-500 italic">Destek</span></h1>
        </div>

        <div className="flex bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
           <TabButton 
            active={activeTab === "announcements"} 
            onClick={() => setActiveTab("announcements")}
            label="Duyurular"
           />
           <TabButton 
            active={activeTab === "resources"} 
            onClick={() => setActiveTab("resources")}
            label="Kaynaklar"
           />
        </div>
      </header>

      <div className="flex justify-end">
        <Button 
          onClick={() => setShowModal(true)}
          className="rounded-2xl px-8 py-6 gap-3 shadow-xl shadow-orange-500/10 bg-orange-500 hover:bg-orange-600 text-white font-black"
        >
          <Plus size={18} /> Yeni {activeTab === "announcements" ? "Duyuru" : "Kaynak"}
        </Button>
      </div>

      <GlassCard className="border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Başlık / Detay</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Durum</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                       <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto opacity-20" />
                    </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="group hover:bg-orange-50/30 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-black text-gray-900 mb-1">{item.title}</p>
                       <p className="text-xs text-gray-400 font-medium truncate max-w-md">
                         {activeTab === "announcements" ? item.body : item.url}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <button onClick={() => handleToggleActive(item.id, item.is_active)}>
                         {item.is_active ? (
                           <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                             <CheckCircle2 size={12} /> AKTİF
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-gray-100">
                             <XCircle size={12} /> PASİF
                           </span>
                         )}
                       </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                       >
                          <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Manual Modal (Simplified for speed) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                      {activeTab === "announcements" ? <MessageSquare size={24}/> : <Files size={24}/>}
                   </div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">Yeni İçerik Ekle</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Başlık</label>
                      <div className="relative">
                         <Type className="absolute left-4 top-4 text-gray-300" size={18} />
                         <input 
                           required
                           className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-orange-500/20 transition-all font-medium"
                           placeholder="İçerik başlığı..."
                           onChange={e => setFormData({...formData, title: e.target.value})}
                         />
                      </div>
                   </div>

                   {activeTab === "announcements" ? (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">İçerik Metni</label>
                        <div className="relative">
                           <AlignLeft className="absolute left-4 top-4 text-gray-300" size={18} />
                           <textarea 
                             required
                             rows={4}
                             className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-orange-500/20 transition-all"
                             placeholder="Duyuru detayları..."
                             onChange={e => setFormData({...formData, body: e.target.value})}
                           />
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">URL / Link</label>
                        <div className="relative">
                           <Link2 className="absolute left-4 top-4 text-gray-300" size={18} />
                           <input 
                             required
                             className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-orange-500/20 transition-all font-medium"
                             placeholder="https://..."
                             onChange={e => setFormData({...formData, url: e.target.value})}
                           />
                        </div>
                     </div>
                   )}

                   <div className="pt-4 flex gap-4">
                      <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl py-6 font-bold text-gray-400">İptal</Button>
                      <Button disabled={saving} className="flex-2 rounded-2xl py-6 px-12 bg-gray-900 text-white font-black uppercase tracking-widest gap-2">
                         {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                         Kaydet
                      </Button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? "bg-gray-900 text-white shadow-xl shadow-black/10" 
          : "text-gray-400 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}
