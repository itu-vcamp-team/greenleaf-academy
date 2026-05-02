"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  UserCheck, UserX, Shield, Mail, Calendar,
  Loader2, BadgeCheck, Users, ToggleLeft, ToggleRight,
  UserPlus, X, Eye, EyeOff, Search, ArrowUpDown, ArrowUp, ArrowDown,
  CalendarCheck, UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserRole } from "@/context/UserRoleContext";

type Tab = "pending" | "all" | "guests";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  partner_id: string | null;
  created_at: string;
}

// ─── Event Guest (RSVP) row ───────────────────────────────────────────────────
interface EventGuestRow {
  id: string;
  event_id: string;
  email: string;
  full_name: string | null;
  is_member: boolean;
  created_at: string;
}

interface CreateUserForm {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: "ADMIN" | "PARTNER";
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [pendingData, setPendingData] = useState<PaginatedData<UserRow>>({ items: [], total: 0, page: 1, size: 50, pages: 0 });
  const [allData, setAllData] = useState<PaginatedData<UserRow>>({ items: [], total: 0, page: 1, size: 50, pages: 0 });
  const [guestsData, setGuestsData] = useState<PaginatedData<EventGuestRow>>({ items: [], total: 0, page: 1, size: 50, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserRow; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const size = 50;
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "PARTNER",
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter, sortConfig, activeTab]);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPending();
    } else if (activeTab === "guests") {
      fetchGuests();
    } else {
      fetchAll();
    }
  }, [activeTab, debouncedSearchTerm, statusFilter, sortConfig, page]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      params.append("sort_by", sortConfig.key);
      params.append("sort_dir", sortConfig.direction);
      params.append("page", String(page));
      params.append("size", String(size));

      const res = await apiClient.get(`/admin/users/pending?${params.toString()}`);
      setPendingData(res.data);
    } catch {
      console.error("Fetch pending error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter === "active") params.append("is_active", "true");
      if (statusFilter === "inactive") params.append("is_active", "false");
      params.append("sort_by", sortConfig.key);
      params.append("sort_dir", sortConfig.direction);
      params.append("page", String(page));
      params.append("size", String(size));

      const res = await apiClient.get(`/admin/users/all?${params.toString()}`);
      setAllData(res.data);
    } catch {
      console.error("Fetch all users error");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      params.append("sort_by", sortConfig.key === "created_at" ? "created_at" : "created_at");
      params.append("sort_dir", sortConfig.direction);
      params.append("page", String(page));
      params.append("size", String(size));
      const res = await apiClient.get(`/admin/users/event-guests?${params.toString()}`);
      setGuestsData(res.data);
    } catch {
      console.error("Fetch event guests error");
    } finally {
      setLoading(false);
    }
  };

  // Silent background re-sync without loading flash
  const silentRefreshPending = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      params.append("sort_by", sortConfig.key);
      params.append("sort_dir", sortConfig.direction);
      params.append("page", String(page));
      params.append("size", String(size));
      const res = await apiClient.get(`/admin/users/pending?${params.toString()}`);
      setPendingData(res.data);
    } catch { /* silently ignore */ }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    // Optimistic removal: row disappears immediately without loading flash
    setPendingData((prev) => ({
      ...prev,
      items: prev.items.filter((u) => u.id !== userId),
      total: Math.max(0, prev.total - 1),
    }));
    try {
      await apiClient.post(`/admin/users/${userId}/approve`);
      // Background sync to ensure data accuracy
      silentRefreshPending();
    } catch (err) {
      console.error("Onaylama hatası:", err);
      alert("Kullanıcı onaylanırken bir hata oluştu.");
      // Restore correct state on error
      fetchPending();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı reddetmek istediğinize emin misiniz?")) return;
    setActionLoading(userId);
    // Optimistic removal
    setPendingData((prev) => ({
      ...prev,
      items: prev.items.filter((u) => u.id !== userId),
      total: Math.max(0, prev.total - 1),
    }));
    try {
      await apiClient.post(`/admin/users/${userId}/reject`);
      silentRefreshPending();
    } catch (err) {
      console.error("Reddetme hatası:", err);
      alert("Kullanıcı reddedilirken bir hata oluştu.");
      fetchPending();
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await apiClient.post(`/admin/users/${userId}/toggle-active`);
      setAllData((prev) => ({
        ...prev,
        items: prev.items.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      }));
    } catch (err) {
      console.error("Durum değiştirme hatası:", err);
      alert("Kullanıcı durumu değiştirilirken bir hata oluştu.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const payload = {
        ...createForm,
        phone: createForm.phone ? `+90${createForm.phone.replace(/\D/g, "").slice(0, 10)}` : null,
      };
      const res = await apiClient.post("/admin/users/create", payload);
      setCreateSuccess(res.data.message || "Kullanıcı başarıyla oluşturuldu.");
      // Reset form
      setCreateForm({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "PARTNER",
      });
      // Refresh list after creation
      if (activeTab === "all") fetchAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setCreateError(e?.response?.data?.detail || "Kullanıcı oluşturulamadı.");
    } finally {
      setCreateLoading(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCreateError("");
    setCreateSuccess("");
  };

  const handleSort = (key: keyof UserRow) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const currentData = activeTab === "pending" ? pendingData : allData;
  const currentProcessedUsers = currentData.items;

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 text-emerald-500 mb-3">
            <Shield className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Kullanıcı Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Partner <span className="text-emerald-500 italic">Yönetimi</span>
          </h1>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100 px-5 py-3 h-auto"
        >
          <UserPlus size={16} />
          <span className="text-xs font-black uppercase tracking-widest">Kullanıcı Oluştur</span>
        </Button>
      </header>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 bg-surface rounded-2xl w-fit flex-wrap">
        <TabButton
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          icon={<UserCheck size={14} />}
          label={`Onay Bekleyenler (${pendingData.total})`}
        />
        <TabButton
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          icon={<Users size={14} />}
          label="Tüm Kullanıcılar"
        />
        <TabButton
          active={activeTab === "guests"}
          onClick={() => setActiveTab("guests")}
          icon={<CalendarCheck size={14} />}
          label={`Etkinlik Misafirleri (${guestsData.total})`}
          color="blue"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-surface p-3 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="İsim, e-posta, username ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {activeTab === "all" && (
          <div className="flex gap-1.5 p-1 bg-background rounded-xl border border-border">
            <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="Tümü" />
            <FilterButton active={statusFilter === "active"} onClick={() => setStatusFilter("active")} label="Aktifler" color="emerald" />
            <FilterButton active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} label="Pasifler" color="red" />
          </div>
        )}
      </div>

      {/* ── Event Guests List ─────────────────────────────────────────── */}
      {activeTab === "guests" ? (
        <GlassCard className="border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-blue-50/40">
            <p className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
              <CalendarCheck size={14} />
              Etkinlik Takvim Davetlerini Dolduran Misafir Ziyaretçiler
            </p>
            <p className="text-[11px] text-foreground/40 mt-0.5 italic">
              Bu kişiler sistemde kayıtlı değil; etkinliğe katılmak için ad/e-posta dolduranlar.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/60 border-b border-border">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                    Misafir
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                    E-posta
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                    Kayıt Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-30" />
                    </td>
                  </tr>
                ) : guestsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-foreground/40 font-medium italic">
                      {searchTerm ? "Aramanıza uygun misafir bulunamadı." : "Henüz etkinlik misafiri yok."}
                    </td>
                  </tr>
                ) : (
                  guestsData.items.map((guest) => (
                    <tr key={guest.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <UserRound size={16} className="text-blue-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">
                            {guest.full_name || <span className="text-foreground/30 italic">İsim yok</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-foreground/60">
                          <Mail size={11} /> {guest.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/40">
                          <Calendar size={12} />
                          {new Date(guest.created_at).toLocaleDateString("tr-TR")}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {guestsData.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/30">
              <span className="text-xs font-bold tracking-widest text-foreground/40 uppercase">
                Toplam {guestsData.total} Misafir
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={guestsData.page === 1} className="rounded-xl">
                  Önceki
                </Button>
                <span className="text-sm font-bold text-foreground">
                  {guestsData.page} <span className="text-foreground/40 font-normal">/ {guestsData.pages}</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(guestsData.pages, p + 1))} disabled={guestsData.page === guestsData.pages} className="rounded-xl">
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
      <GlassCard className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/60 border-b border-border">
                <SortableHeader
                  label="Kullanıcı"
                  sortKey="full_name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                {/* Task 2: Rol/Durum column is non-sortable */}
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  Rol / Durum
                </th>
                <SortableHeader
                  label="Kayıt Tarihi"
                  sortKey="created_at"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">
                  Eylemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr key="loading">
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto opacity-30" />
                    </td>
                  </tr>
                ) : currentProcessedUsers.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={4} className="px-6 py-20 text-center text-foreground/40 font-medium italic">
                      {searchTerm ? "Aramanıza uygun kullanıcı bulunamadı." : activeTab === "pending" ? "Onay bekleyen kullanıcı yok." : "Kullanıcı bulunamadı."}
                    </td>
                  </tr>
                ) : (
                  currentProcessedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      mode={activeTab as "pending" | "all"}
                      isActing={actionLoading === user.id}
                      onApprove={() => handleApprove(user.id)}
                      onReject={() => handleReject(user.id)}
                      onToggleActive={() => handleToggleActive(user.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {currentData.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/30">
            <span className="text-xs font-bold tracking-widest text-foreground/40 uppercase">
              Toplam {currentData.total} Kayıt
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentData.page === 1}
                className="rounded-xl"
              >
                Önceki
              </Button>
              <span className="text-sm font-bold text-foreground">
                {currentData.page} <span className="text-foreground/40 font-normal">/ {currentData.pages}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(currentData.pages, p + 1))}
                disabled={currentData.page === currentData.pages}
                className="rounded-xl"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
      )}

      {/* ── Create User Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            key="create-user-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Kullanıcı Oluştur</h2>
                    <p className="text-[11px] text-foreground/40 font-medium">
                      Yeni Admin veya Partner ekle
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-surface text-foreground/40 hover:text-foreground/60 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                {createSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <BadgeCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-2">Başarılı!</h3>
                   <p className="text-sm text-foreground/50 leading-relaxed mb-6">{createSuccess}</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setCreateSuccess("")}
                        className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600"
                      >
                        Yeni Kullanıcı Ekle
                      </Button>
                      <Button
                        onClick={closeModal}
                        className="flex-1 rounded-2xl bg-surface text-foreground/70 hover:bg-foreground/10"
                      >
                        Kapat
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    {/* Role Select */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Rol
                      </label>
                      <div className="flex gap-2">
                        {(["PARTNER", "ADMIN"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setCreateForm({ ...createForm, role: r })}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                              createForm.role === r
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100"
                                : "bg-surface text-foreground/40 border-border hover:border-foreground/30"
                            }`}
                          >
                            {r === "ADMIN" ? "🛡 Admin" : "👤 Partner"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      label="Ad Soyad"
                      placeholder="Ahmet Yılmaz"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                      required
                    />

                    <Input
                      label="Kullanıcı Adı"
                      placeholder="ahmet_yilmaz"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      required
                    />

                    <Input
                      label="E-Posta"
                      type="email"
                      placeholder="ahmet@example.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Telefon <span className="text-foreground/20 font-normal normal-case tracking-normal">(opsiyonel)</span>
                      </label>
                      <div className="flex items-stretch">
                        <span className="flex items-center px-3 bg-surface border border-border border-r-0 rounded-l-xl text-sm text-foreground/50 font-mono select-none">
                          +90
                        </span>
                        <input
                          type="tel"
                          placeholder="5XX XXX XXXX"
                          maxLength={10}
                          value={createForm.phone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setCreateForm({ ...createForm, phone: digits });
                          }}
                          className="flex-1 h-12 px-3 bg-surface border border-border rounded-r-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* Password with toggle */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Geçici Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="En az 8 karakter, 1 büyük harf, 1 rakam"
                          value={createForm.password}
                          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                          required
                          className="w-full h-12 px-4 pr-10 bg-surface border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-foreground/40 italic">
                        Kullanıcıya e-posta ile gönderilecek. Giriş sonrası değiştirmesi önerilir.
                      </p>
                    </div>

                    {createError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 font-medium">
                        {createError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 rounded-2xl bg-surface text-foreground/70 hover:bg-foreground/10 h-12"
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        disabled={createLoading}
                        className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-100 h-12 gap-2"
                      >
                        {createLoading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <UserPlus size={15} />
                        )}
                        {createLoading ? "Oluşturuluyor..." : "Hesap Oluştur"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: "default" | "blue";
}

function TabButton({ active, onClick, icon, label, color = "default" }: TabButtonProps) {
  const activeClass = color === "blue"
    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
    : "bg-surface text-foreground shadow-sm";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
        active ? activeClass : "text-foreground/40 hover:text-foreground/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface UserRowProps {
  user: UserRow;
  mode: "pending" | "all" | "guests";
  isActing: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleActive?: () => void;
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: "emerald" | "red" | "default";
}

function FilterButton({ active, onClick, label, color = "default" }: FilterButtonProps) {
  let colorClasses = "text-foreground/50 hover:text-foreground";
  if (active) {
    if (color === "emerald") colorClasses = "bg-emerald-50 text-emerald-600 font-bold shadow-sm";
    else if (color === "red") colorClasses = "bg-red-50 text-red-500 font-bold shadow-sm";
    else colorClasses = "bg-surface text-foreground font-bold shadow-sm";
  } else {
    if (color === "emerald") colorClasses += " hover:text-emerald-600";
    if (color === "red") colorClasses += " hover:text-red-500";
  }

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${colorClasses}`}
    >
      {label}
    </button>
  );
}

interface SortableHeaderProps {
  label: string;
  sortKey: keyof UserRow;
  currentSort: { key: keyof UserRow; direction: "asc" | "desc" };
  onSort: (key: keyof UserRow) => void;
}

function SortableHeader({ label, sortKey, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 cursor-pointer hover:text-foreground/70 transition-colors select-none group"
    >
      <div className="flex items-center gap-1.5">
        {label}
        <div className="flex flex-col text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
          {isActive ? (
            currentSort.direction === "asc" ? (
              <ArrowUp className="w-3 h-3 text-primary" />
            ) : (
              <ArrowDown className="w-3 h-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </div>
      </div>
    </th>
  );
}

function UserRow({ user, mode, isActing, onApprove, onReject, onToggleActive }: UserRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group hover:bg-surface/50 transition-colors"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center font-black text-foreground/50 text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-black text-foreground text-sm leading-tight">{user.full_name}</p>
            <div className="flex items-center gap-1 text-xs text-foreground/40 mt-0.5">
              <Mail size={11} /> {user.email}
            </div>
            {user.partner_id && (
              <span className="text-[10px] font-bold text-foreground/40">PID: {user.partner_id}</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-foreground/50 bg-surface px-2 py-0.5 rounded-full w-fit">
            {user.role}
          </span>
          {user.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <BadgeCheck size={11} /> Doğrulandı
            </span>
          )}
          {mode === "all" && (
            <span
              className={`text-[10px] font-bold ${
                user.is_active ? "text-emerald-500" : "text-red-400"
              }`}
            >
              {user.is_active ? "● Aktif" : "○ Pasif"}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/40">
          <Calendar size={12} />
          {new Date(user.created_at).toLocaleDateString("tr-TR")}
        </div>
      </td>

      <td className="px-6 py-5 text-right">
        {mode === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onReject}
              disabled={isActing}
              className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
            >
              <UserX size={16} />
            </button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isActing}
              className="gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-100"
            >
              {isActing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserCheck size={13} />
              )}
              Onayla
            </Button>
          </div>
        ) : (
          <button
            onClick={onToggleActive}
            disabled={isActing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-40 ${
              user.is_active
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {isActing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : user.is_active ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
            {user.is_active ? "Pasif Yap" : "Aktif Et"}
          </button>
        )}
      </td>
    </motion.tr>
  );
}
