"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ShieldCheck, UserPlus, CheckCircle2, Globe, Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import apiClient from "@/lib/api-client";

export function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Step 1: Base Info
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone: "",   // stored as "+90XXXXXXXXXX"
  });

  // Step 2: Global Account
  const [glData, setGlData] = useState({
    gl_username: "",
    gl_password: "",
  });

  // Step 3: Finalize
  const [hasPartnerId, setHasPartnerId] = useState(true);
  const [referenceCode, setReferenceCode] = useState("");
  const [supervisorName, setSupervisorName] = useState("");

  const router = useRouter();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/register/step1", formData);
      setSessionId(res.data.session_id);
      setStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Kayıt başlatılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/register/step2", {
        session_id: sessionId,
        ...glData,
      });
      setStep(3);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Global hesap doğrulanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/register/step3", {
        session_id: sessionId,
        has_partner_id: hasPartnerId,
        reference_code: hasPartnerId ? referenceCode : null,
        supervisor_name: !hasPartnerId ? supervisorName : null,
      });
      if (res.data.status === "pending_email_verification") {
        setStep(4);
      } else {
        router.push("/academy");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Kayıt tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Progress Indicator */}
      <div className="flex justify-between mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-foreground/5 text-foreground/20 border border-foreground/5"
              }`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Temel Bilgiler */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Hesap Oluştur</h1>
                <p className="text-foreground/40 text-sm italic">Akademi yolculuğuna ilk adımı atın.</p>
              </div>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <Input
                  label="Ad Soyad"
                  placeholder="Ahmet Yılmaz"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                <Input
                  label="E-Posta"
                  type="email"
                  placeholder="ahmet@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Kullanıcı Adı"
                  placeholder="ahmet_yilmaz"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <Input
                  label="Şifre"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                {/* Phone input with +90 prefix */}
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 italic mb-1">
                    Telefon
                  </label>
                  <div className="flex items-stretch">
                    <span className="flex items-center px-3 bg-foreground/5 border border-foreground/10 border-r-0 rounded-l-xl text-sm text-foreground/60 font-mono select-none">
                      +90
                    </span>
                    <input
                      type="tel"
                      placeholder="5XX XXX XXXX"
                      maxLength={10}
                      value={formData.phone.replace(/^\+90/, "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, phone: digits ? `+90${digits}` : "" });
                      }}
                      className="flex-1 h-12 px-3 bg-foreground/5 border border-foreground/10 rounded-r-xl text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-foreground/30 italic">Örnek: +905551234567</p>
                </div>
                {error && <p className="text-red-400 text-xs italic">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                >
                  {loading ? "İşleniyor..." : "Devam Et"}
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Global Doğrulama */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Global Doğrulama</h1>
                <p className="text-foreground/40 text-sm italic">
                  Greenleaf Global (Office) hesabınızı doğrulayın.
                </p>
              </div>
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <Input
                  label="Office Kullanıcı Adı"
                  placeholder="Kullanıcı adınız"
                  value={glData.gl_username}
                  onChange={(e) => setGlData({ ...glData, gl_username: e.target.value })}
                  required
                />
                <Input
                  label="Office Şifresi"
                  type="password"
                  placeholder="••••••••"
                  value={glData.gl_password}
                  onChange={(e) => setGlData({ ...glData, gl_password: e.target.value })}
                  error={error}
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                >
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Devam Et"}
                </Button>
                <p className="text-[10px] text-foreground/20 text-center leading-relaxed">
                  Şifreniz sadece doğrulama için kullanılır ve asla kaydedilmez.
                </p>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Finalize */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Üyeliği Tamamla</h1>
                <p className="text-foreground/40 text-sm">
                  Partner referans kodunuzu girin veya danışmanınızı belirtin.
                </p>
              </div>
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setHasPartnerId(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      hasPartnerId
                        ? "bg-primary text-white border-primary"
                        : "bg-foreground/5 text-foreground/40 border-foreground/10"
                    }`}
                  >
                    Referans Kodum Var
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPartnerId(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      !hasPartnerId
                        ? "bg-primary text-white border-primary"
                        : "bg-foreground/5 text-foreground/40 border-foreground/10"
                    }`}
                  >
                    Danışmanım Var
                  </button>
                </div>
                {hasPartnerId ? (
                  <Input
                    label="Referans Kodu"
                    placeholder="GL-XXXXX"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    required
                  />
                ) : (
                  <Input
                    label="Danışman / Üst Kol Adı"
                    placeholder="Danışmanınızın adı"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    required
                  />
                )}
                <div className="p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required className="mt-1 accent-primary" />
                    <span className="text-[11px] text-foreground/50 leading-relaxed">
                      <span className="text-primary underline">KVKK Aydınlatma Metni</span> ve Kullanım
                      Şartları&apos;nı okudum, kabul ediyorum.
                    </span>
                  </label>
                </div>
                {error && <p className="text-red-400 text-xs italic">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                >
                  {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 4: Email Verification Notice */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-10 border-foreground/5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Kaydınız Alındı!</h1>
              <p className="text-foreground/40 text-sm leading-relaxed mb-8">
                Başvurunuz incelemeye alındı. Onaylandıktan sonra e-posta ile bilgilendirileceksiniz.
                Doğrulama sonrası tüm eğitimlere erişebileceksiniz.
              </p>
              <Button onClick={() => router.push("/")} className="w-full rounded-2xl py-6 h-auto">
                Ana Sayfaya Dön
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
