"use client";

import { useState, useRef } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

// Pydantic v2 + FastAPI 422 validation hatalarını düz string'e çevirir.
function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { detail?: unknown } } };
  const detail = e?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; message?: string };
    const raw = first?.msg || first?.message || fallback;
    // Pydantic "Value error, ..." prefix'ini temizle
    return raw.replace(/^Value error,\s*/i, "");
  }
  return fallback;
}

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ShieldCheck, UserPlus, CheckCircle2, Globe, Key, Mail, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, Link } from "@/i18n/navigation";
import apiClient from "@/lib/api-client";

export function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Step 1: Global Account
  const [glData, setGlData] = useState({
    gl_username: "",
    gl_password: "",
  });

  // Step 2: Partner / Reference
  const [referenceCode, setReferenceCode] = useState("");

  // Step 3: Account Details
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Real-time username validation
  const [usernameError, setUsernameError] = useState<string>("");
  const [usernameOk, setUsernameOk] = useState(false);

  const validateUsernameLocal = (val: string): string => {
    if (!val) return "";
    if (val.length < 3) return "En az 3 karakter olmalıdır.";
    if (val.length > 50) return "En fazla 50 karakter olabilir.";
    if (/\s/.test(val)) return "Boşluk kullanılamaz.";
    if (!/^[a-zA-Z0-9_.-]+$/.test(val))
      return "Yalnızca harf, rakam, _, . ve - kullanılabilir.";
    if (/^[._-]/.test(val)) return "Harf veya rakamla başlamalıdır.";
    return "";
  };

  const handleUsernameChange = (val: string) => {
    setFormData((f) => ({ ...f, username: val }));
    const err = validateUsernameLocal(val);
    setUsernameError(err);
    setUsernameOk(val.length >= 3 && !err);
  };

  // Step 3: Consent checkboxes (must both be checked)
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [aydinlatmaChecked, setAydinlatmaChecked] = useState(false);

  // Step 4: OTP
  const [otpCode, setOtpCode] = useState("");
  const [regStatus, setRegStatus] = useState<"pending_approval" | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const router = useRouter();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/register/step1", {
        ...glData,
        captcha_token: turnstileToken,
      });
      setSessionId(res.data.session_id);
      setStep(2);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Global hesap doğrulanamadı."));
      // Reset Turnstile so the next attempt uses a fresh token
      turnstileRef.current?.reset();
      setTurnstileToken(null);
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
        has_partner_id: true,
        reference_code: referenceCode,
        supervisor_name: null,
      });
      setStep(3);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Referans kodu geçersiz veya daha önce kullanılmış."));
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (!kvkkChecked) {
      setError("KVKK Aydınlatma Metni'ni okuduğunuzu onaylamanız gerekmektedir.");
      return;
    }
    if (!aydinlatmaChecked) {
      setError("Aydınlatma Metni'ni okuduğunuzu onaylamanız gerekmektedir.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/register/step3", {
        session_id: sessionId,
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        phone: formData.phone,
        kvkk_accepted: kvkkChecked,
        aydinlatma_accepted: aydinlatmaChecked,
      });
      setStep(4);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Hesap bilgileri kaydedilemedi."));
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/register/verify-otp", {
        session_id: sessionId,
        code: otpCode,
      });
      setRegStatus(res.data.status);
      setStep(5); // Success state
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Doğrulama kodu hatalı veya süresi dolmuş."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Progress Indicator */}
      {step < 5 && (
        <div className="flex justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((s) => (
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
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Global Doğrulama */}
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
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Global Doğrulama</h1>
                <p className="text-foreground/40 text-sm italic leading-relaxed">
                  Greenleaf Global (Office) hesabınızı doğrulayarak başlayın.
                </p>
              </div>
              <form onSubmit={handleStep1Submit} className="space-y-4">
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
                  required
                />
                {error && <p className="text-red-400 text-xs italic">{error}</p>}
                <div className="flex justify-center py-1">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADDnJNGyXUKu4w1k"}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    options={{ theme: "light" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading || !turnstileToken}
                >
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Devam Et"}
                </Button>
                <p className="text-[10px] text-foreground/20 text-center leading-relaxed italic">
                  Şifreniz sadece doğrulama için kullanılır ve asla kaydedilmez.
                </p>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Partner / Referral */}
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
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Referans Kodu</h1>
                <p className="text-foreground/40 text-sm italic leading-relaxed">
                  Kayıt olabilmek için bir partnerden aldığınız referans kodunu girmeniz gerekmektedir.
                </p>
              </div>
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <Input
                  label="Referans Kodu"
                  placeholder="GL-XXXXX"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  required
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs italic">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "İşleniyor..." : "Devam Et"}
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Account Details */}
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
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Hesap Detayları</h1>
                <p className="text-foreground/40 text-sm italic">Akademi kullanıcı bilgilerinizi belirleyin.</p>
              </div>
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <Input
                  label="Ad Soyad"
                  placeholder="Ahmet Yılmaz"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Kullanıcı Adı"
                      placeholder="ahmet_y"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      required
                    />
                    {usernameError && (
                      <p className="text-red-400 text-[10px] mt-1 leading-tight">{usernameError}</p>
                    )}
                    {usernameOk && (
                      <p className="text-emerald-500 text-[10px] mt-1">✓ Uygun format</p>
                    )}
                    {!usernameError && !formData.username && (
                      <p className="text-foreground/30 text-[9px] mt-1 italic">Boşluk kullanmayın. Örn: ahmet_y</p>
                    )}
                  </div>
                  <Input
                    label="E-Posta"
                    type="email"
                    placeholder="ahmet@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Şifre"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Input
                    label="Şifre Tekrar"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                {/* Phone */}
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
                </div>
                {/* KVKK — separate tick */}
                <div className="p-4 bg-foreground/5 rounded-xl border border-foreground/10 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={kvkkChecked}
                      onChange={(e) => setKvkkChecked(e.target.checked)}
                      className="mt-0.5 accent-primary w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-foreground/50 leading-relaxed select-none">
                      <Link
                        href="/legal/kvkk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        KVKK Aydınlatma Metni
                      </Link>
                      &apos;ni okudum ve anladım.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={aydinlatmaChecked}
                      onChange={(e) => setAydinlatmaChecked(e.target.checked)}
                      className="mt-0.5 accent-primary w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-foreground/50 leading-relaxed select-none">
                      <Link
                        href="/legal/aydinlatma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni
                      </Link>
                      &apos;ni okudum ve kabul ediyorum.
                    </span>
                  </label>
                </div>
                {error && <p className="text-red-400 text-xs italic">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Kod Gönderiliyor..." : "Kod Gönder ve Devam Et"}
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 4: OTP Verification */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">E-Posta Doğrulama</h1>
                <p className="text-foreground/40 text-sm leading-relaxed italic">
                  {formData.email} adresine gönderilen 6 haneli kodu girin.
                </p>
              </div>
              <form onSubmit={handleStep4Submit} className="space-y-6">
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-48 h-16 text-center text-3xl font-black tracking-[0.5em] bg-foreground/5 border border-foreground/10 rounded-2xl outline-none focus:border-primary/50 transition-all text-primary"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-400 text-xs text-center italic">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Kaydı Tamamla"}
                </Button>
                <p className="text-[10px] text-foreground/30 text-center leading-relaxed italic">
                  Kod gelmedi mi? Gereksiz (Spam) kutusunu kontrol edin.
                </p>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 5: Final Success */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-10 border-foreground/5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Kaydınız Alındı!</h1>
              <p className="text-foreground/40 text-sm leading-relaxed mb-8">
                Hesabınız oluşturuldu. Danışmanınız ve Admin onayından sonra giriş yapabileceksiniz.
              </p>
              <Button onClick={() => router.push("/")} className="w-full rounded-2xl py-6 h-auto font-black text-xs uppercase tracking-widest">
                Ana Sayfaya Dön
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
