"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Phone, Plus, Trash2, Type, Link2, AlignLeft,
  CheckCircle2, XCircle, Loader2, Save, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

type ContactType = "EMAIL" | "PHONE" | "WHATSAPP" | "INSTAGRAM" | "YOUTUBE" | "WEBSITE" | "OTHER";

interface ContactEntry {
  id: string;
  owner_name: string;
  label?: string | null;
  type: ContactType;
  value: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "EMAIL",     label: "📧 E-posta" },
  { value: "PHONE",     label: "📞 Telefon" },
  { value: "WHATSAPP",  label: "💬 WhatsApp" },
  { value: "INSTAGRAM", label: "📸 Instagram" },
  { value: "YOUTUBE",   label: "▶️ YouTube" },
  { value: "WEBSITE",   label: "🌐 Web Sitesi" },
  { value: "OTHER",     label: "🔗 Diğer" },
];

const TYPE_LABELS: Record<ContactType, string> = {
  EMAIL: "E-posta", PHONE: "Telefon", WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram", YOUTUBE: "YouTube", WEBSITE: "Web", OTHER: "Diğer",
};

interface FormState {
  owner_name: string;
  label: string;
  type: ContactType;
  value: string;
  order: number;
}

const EMPTY_FORM: FormState = {
  owner_name: "",
  label: "",
  type: "EMAIL",
  value: "",
  order: 0,
};

export default function AdminContactPage() {
  const [data, setData] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/contact-info/admin");
      setData(res.data);
    } catch (err) {
      console.error("Contact info fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/contact-info", {
        owner_name: form.owner_name,
        label: form.label || null,
        type: form.type,
        value: form.value,
        order: form.order,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      console.error("Create error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.patch(`/contact-info/${id}`, { is_active: !current });
      fetchData();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu iletişim kaydını kaldırmak istediğinize emin misiniz? (Soft delete)")) return;
    try {
      await apiClient.delete(`/contact-info/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-teal-500 mb-2">
            <Phone className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">İletişim Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            İletişim <span className="text-teal-500 italic">Bilgileri</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-lg">
            Burada eklediğiniz aktif kayıtlar guest ve partner kullanıcıların navbar&apos;ında{" "}
            <strong>İletişim</strong> bölümünde görünür. Hiç aktif kayıt yoksa bölüm gizlenir.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-2xl px-8 py-6 gap-3 shadow-xl shadow-teal-500/10 bg-teal-600 hover:bg-teal-700 text-white font-black"
        >
          <Plus size={18} /> Yeni Kayıt Ekle
        </Button>
      </header>

      {/* Table */}
      <GlassCard className="border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Sahip / Etiket</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Tür</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Değer</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Sıra</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Durum</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto opacity-20" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    Henüz iletişim kaydı eklenmemiş.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="group hover:bg-teal-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-gray-900 text-sm">{item.owner_name}</p>
                      {item.label && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{item.label}</p>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest border border-gray-100">
                        {TYPE_LABELS[item.type]}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-gray-600 font-medium truncate max-w-xs">{item.value}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-gray-400 font-bold">{item.order}</span>
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

      {/* Add Modal */}
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
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                  <Phone size={24} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Yeni İletişim Kaydı</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                    Sahip Adı <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-gray-300" size={16} />
                    <input
                      required
                      value={form.owner_name}
                      onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-11 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500/20 transition-all"
                      placeholder="Satış Ekibi, Ahmet Bey..."
                    />
                  </div>
                </div>

                {/* Label (optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                    Etiket <span className="text-gray-300">(isteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <Type className="absolute left-4 top-4 text-gray-300" size={16} />
                    <input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-11 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500/20 transition-all"
                      placeholder="WhatsApp Destek Hattı, Genel Bilgi..."
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                    Tür <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none"
                  >
                    {CONTACT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                    Değer <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-4 text-gray-300" size={16} />
                    <input
                      required
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-11 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500/20 transition-all"
                      placeholder={
                        form.type === "EMAIL" ? "ornek@email.com"
                        : form.type === "PHONE" || form.type === "WHATSAPP" ? "+90 5XX XXX XX XX"
                        : form.type === "INSTAGRAM" ? "@kullanici_adi"
                        : form.type === "YOUTUBE" ? "https://youtube.com/@kanal"
                        : "https://..."
                      }
                    />
                  </div>
                </div>

                {/* Order */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                    Sıralama
                  </label>
                  <div className="relative">
                    <AlignLeft className="absolute left-4 top-4 text-gray-300" size={16} />
                    <input
                      type="number"
                      min={0}
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-11 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500/20 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                    className="flex-1 rounded-2xl py-6 font-bold text-gray-400"
                  >
                    İptal
                  </Button>
                  <Button
                    disabled={saving}
                    className="flex-1 rounded-2xl py-6 px-10 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest gap-2"
                  >
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
