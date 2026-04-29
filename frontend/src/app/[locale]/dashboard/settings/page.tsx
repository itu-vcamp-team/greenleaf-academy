"use client";

import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User, Mail, Phone, Camera, Shield, Lock,
  ChevronRight, CheckCircle2, AlertCircle, FileText,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { RankBadge, type RankKey } from "@/components/ui/RankBadge";

interface RankData {
  rank: RankKey;
  rank_label: string;
  rank_emoji: string;
  rank_color: string;
  earned_points: number;
  max_points: number;
  rank_percentage: number;
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: ""
  });
  const [rankData, setRankData] = useState<RankData | null>(null);

  // Password Change State
  const [pwdStep, setPwdStep] = useState(0); // 0: Idle, 1: Verify Current, 2: OTP, 3: New Password
  const [pwdData, setPwdData] = useState({
    current_password: "",
    otp_code: "",
    new_password: "",
    confirm_new_password: ""
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  useEffect(() => {
    apiClient.get("/progress/my-rank")
      .then(res => setRankData(res.data))
      .catch(() => {/* ignore */});
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiClient.patch("/auth/profile", profileData);
      toast.success("Profil bilgileriniz güncellendi.");
      await refreshUser();
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Güncelleme başarısız.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setProfileLoading(true);
    try {
      await apiClient.post("/auth/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profil fotoğrafınız güncellendi.");
      await refreshUser();
    } catch {
      toast.error("Fotoğraf yüklenemedi.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Flow
  const startPwdReset = async () => {
    if (!pwdData.current_password) {
      toast.error("Lütfen mevcut şifrenizi girin.");
      return;
    }
    setPwdLoading(true);
    try {
      await apiClient.post("/auth/profile/password-reset/request", {
        current_password: pwdData.current_password
      });
      setPwdStep(2);
      toast.success("Doğrulama kodu e-postanıza gönderildi.");
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Hata oluştu.");
    } finally {
      setPwdLoading(false);
    }
  };

  const verifyAndChangePwd = async () => {
    if (pwdData.new_password !== pwdData.confirm_new_password) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setPwdLoading(true);
    try {
      await apiClient.post("/auth/profile/password-reset/verify", {
        otp_code: pwdData.otp_code,
        new_password: pwdData.new_password,
        confirm_new_password: pwdData.confirm_new_password
      });
      toast.success("Şifreniz güncellendi. Yeniden giriş yapmalısınız.");
      logout();
      router.push("/auth/login");
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Doğrulama hatası.");
    } finally {
      setPwdLoading(false);
    }
  };

  if (!user) return null;

  const profileImageUrl = user.profile_image_path 
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${user.profile_image_path}`
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-5xl mx-auto pt-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Side: Navigation / Summary */}
          <div className="md:col-span-4 space-y-6">
            <GlassCard className="p-8 text-center border-none shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              
              <div className="relative inline-block group mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-border shadow-xl overflow-hidden bg-surface flex items-center justify-center relative transition-transform group-hover:scale-105 duration-300">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-foreground/20" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all border-2 border-white"
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-black text-foreground">{user.full_name}</h2>
              <p className="text-sm text-foreground/50 font-medium mb-3">@{user.username}</p>

              {/* Rank badge */}
              {rankData && (
                <div className="flex justify-center mb-5">
                  <RankBadge
                    rank={rankData.rank}
                    rankLabel={rankData.rank_label}
                    rankEmoji={rankData.rank_emoji}
                    earnedPoints={rankData.earned_points}
                    size="md"
                    showPoints
                  />
                </div>
              )}

              <div className="pt-6 border-t border-border flex flex-col gap-2">
                <Link href="/legal/kvkk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-foreground/60 transition-all group">
                  <Shield size={18} className="text-primary/60 group-hover:text-primary" />
                  <span className="text-sm font-bold">KVKK Politikası</span>
                  <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100" />
                </Link>
                <Link href="/legal/aydinlatma" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-foreground/60 transition-all group">
                  <FileText size={18} className="text-blue-500/60 group-hover:text-blue-500" />
                  <span className="text-sm font-bold">Aydınlatma Metni</span>
                  <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100" />
                </Link>
              </div>
            </GlassCard>

            <Button 
              variant="outline" 
              className="w-full rounded-2xl py-6 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold gap-3"
              onClick={logout}
            >
              <LogOut size={18} />
              Oturumu Kapat
            </Button>
          </div>

          {/* Right Side: Forms */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Profile Info */}
            <GlassCard className="p-10 border-none shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <User size={20} />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Kişisel Bilgiler</h3>
              </div>

              <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground/40 uppercase tracking-widest pl-1">Ad Soyad</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      className="pl-12 rounded-2xl bg-surface border-transparent transition-all h-14"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground/40 uppercase tracking-widest pl-1">E-Posta (Değiştirilemez)</label>
                  <div className="relative opacity-60">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <Input
                      disabled
                      className="pl-12 rounded-2xl bg-surface border-transparent h-14 cursor-not-allowed"
                      value={user.email}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-black text-foreground/40 uppercase tracking-widest pl-1">Telefon</label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="+905XXXXXXXXX"
                      className="pl-12 rounded-2xl bg-surface border-transparent transition-all h-14"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-4">
                  <Button 
                    disabled={profileLoading}
                    type="submit"
                    className="rounded-2xl h-14 px-10 font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                  >
                    {profileLoading ? "GÜNCELLENİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
                  </Button>
                </div>
              </form>
            </GlassCard>

            {/* Security / Password */}
            <GlassCard className="p-10 border-none shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Güvenlik ve Şifre</h3>
              </div>

              <div className="space-y-6">
                {pwdStep === 0 && (
                  <div className="flex items-center justify-between p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-600 shadow-sm">
                        <Shield size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">Şifre Güvenliği</p>
                        <p className="text-xs text-foreground/50 font-medium">Şifrenizi düzenli aralıklarla değiştirmeniz önerilir.</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
                      onClick={() => setPwdStep(1)}
                    >
                      Değiştir
                    </Button>
                  </div>
                )}

                {pwdStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <p className="text-sm text-foreground/60 font-medium mb-4">
                      Şifrenizi değiştirmek için lütfen mevcut şifrenizi girin. E-postanıza bir doğrulama kodu gönderilecektir.
                    </p>
                    <Input 
                      type="password"
                      placeholder="Mevcut Şifre"
                      className="rounded-2xl h-14 bg-surface border-transparent"
                      value={pwdData.current_password}
                      onChange={(e) => setPwdData({...pwdData, current_password: e.target.value})}
                    />
                    <div className="flex gap-3">
                      <Button className="rounded-xl h-12 bg-primary text-white px-8 font-bold" onClick={startPwdReset} disabled={pwdLoading}>
                        {pwdLoading ? "GÖNDERİLİYOR..." : "DOĞRULAMA KODU GÖNDER"}
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-12 font-bold" onClick={() => setPwdStep(0)}>İptal</Button>
                    </div>
                  </motion.div>
                )}

                {pwdStep === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl flex items-center gap-3 text-primary">
                      <AlertCircle size={18} />
                      <div>
                        <p className="text-xs font-bold">Lütfen e-postanıza gelen 6 haneli kodu ve yeni şifrenizi girin.</p>
                        <p className="text-[10px] opacity-70">Spam/Gereksiz klasörünü kontrol etmeyi unutmayın.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Doğrulama Kodu</label>
                        <Input 
                          id="security_verify_code"
                          name="security_verify_code"
                          autoComplete="one-time-code"
                          placeholder="000000"
                          maxLength={6}
                          className="rounded-2xl h-14 bg-surface border-transparent text-center tracking-[0.5em] font-black text-xl"
                          value={pwdData.otp_code}
                          onChange={(e) => setPwdData({...pwdData, otp_code: e.target.value})}
                        />
                      </div>
                      <div className="hidden sm:block" />
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Yeni Şifre</label>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="rounded-2xl h-14 bg-surface border-transparent"
                          value={pwdData.new_password}
                          onChange={(e) => setPwdData({...pwdData, new_password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Yeni Şifre (Tekrar)</label>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="rounded-2xl h-14 bg-surface border-transparent"
                          value={pwdData.confirm_new_password}
                          onChange={(e) => setPwdData({...pwdData, confirm_new_password: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="rounded-xl h-12 bg-primary text-white px-8 font-bold" onClick={verifyAndChangePwd} disabled={pwdLoading}>
                        {pwdLoading ? "İŞLENİYOR..." : "ŞİFREYİ GÜNCELLE"}
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-12 font-bold" onClick={() => setPwdStep(0)}>İptal</Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </GlassCard>
            
          </div>
        </div>
      </main>
    </div>
  );
}
