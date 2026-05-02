"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, User, Lock, Key, CheckCircle2, AlertCircle, RefreshCcw, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export function LoginForm() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [userId, setUserId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Separate Turnstile state for the forgot-password form
  const [forgotTurnstileToken, setForgotTurnstileToken] = useState<string | null>(null);
  const forgotTurnstileRef = useRef<TurnstileInstance>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [otpCode, setOtpCode] = useState("");
  
  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code & New Pwd
  const [forgotData, setForgotData] = useState({ email: "", code: "", new_password: "", confirm_password: "" });

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Math captcha removed
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/login", {
        ...formData,
        captcha_token: turnstileToken,
      });

      if (res.data.requires_2fa) {
        setTempToken(res.data.temp_token);
        setUserId(res.data.user_id);
        setMaskedEmail(res.data.masked_email || "");
        setShow2FA(true);
      } else {
        const { tokens } = res.data;
        const profileRes = await apiClient.get("/auth/verify-global", {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        
        setAuth(profileRes.data, tokens.access_token, tokens.refresh_token);
        const isAdmin = ["ADMIN", "EDITOR"].includes(profileRes.data.role);
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Giriş başarısız. Bilgilerinizi kontrol edin.");
      // Reset Turnstile so the next attempt gets a fresh, valid token.
      // Turnstile tokens are single-use; reusing a consumed token causes a 400.
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/login/verify-2fa", {
        temp_token: tempToken,
        user_id: userId,
        code: otpCode,
      });

      const { access_token, refresh_token } = res.data;
      const profileRes = await apiClient.get("/auth/verify-global", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setAuth(profileRes.data, access_token, refresh_token);
      const isAdmin = ["ADMIN", "EDITOR"].includes(profileRes.data.role);
      router.push(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Doğrulama kodu hatalı.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/forgot-password", {
        email: forgotData.email,
        captcha_token: forgotTurnstileToken,
      });
      setForgotStep(2);
      toast.success("Sıfırlama kodu e-postanıza gönderildi.");
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Hata oluştu.");
      forgotTurnstileRef.current?.reset();
      setForgotTurnstileToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotData.new_password !== forgotData.confirm_password) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/reset-password", {
        email: forgotData.email,
        code: forgotData.code,
        new_password: forgotData.new_password
      });
      toast.success("Şifreniz başarıyla sıfırlandı.");
      setShowForgot(false);
      setForgotStep(1);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Sıfırlama başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {showForgot ? (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-amber-500">
                  <Key className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Şifremi Unuttum</h1>
                <p className="text-foreground/40 text-sm italic">Güvenli bir şekilde yeni şifre belirleyin.</p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-6">
                  <Input
                    label="E-posta Adresi"
                    type="email"
                    placeholder="ornek@mail.com"
                    icon={<Mail size={16} className="text-foreground/40" />}
                    value={forgotData.email}
                    onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                    required
                  />
                  <div className="flex justify-center py-1">
                    <Turnstile
                      ref={forgotTurnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADDnJNGyXUKu4w1k"}
                      onSuccess={(token) => setForgotTurnstileToken(token)}
                      onExpire={() => { setForgotTurnstileToken(null); forgotTurnstileRef.current?.reset(); }}
                      onError={() => { setForgotTurnstileToken(null); forgotTurnstileRef.current?.reset(); }}
                      options={{ theme: "light", retry: "auto", retryInterval: 3000 }}
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 font-black" disabled={loading || !forgotTurnstileToken}>
                    {loading ? "GÖNDERİLİYOR..." : "SIFIRLAMA KODU GÖNDER"}
                  </Button>
                  <button type="button" onClick={() => setShowForgot(false)} className="w-full text-xs text-foreground/40 hover:text-foreground transition-colors">Vazgeç</button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-xl flex items-center gap-3 text-primary mb-4">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold">E-postanıza gelen 6 haneli kodu ve yeni şifrenizi girin.</p>
                  </div>
                  <Input
                    label="Doğrulama Kodu"
                    placeholder="000000"
                    id="forgot-verification-code"
                    name="forgot-verification-code"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="text-center tracking-widest font-black"
                    value={forgotData.code}
                    onChange={(e) => setForgotData({ ...forgotData, code: e.target.value })}
                    required
                  />
                  <Input
                    label="Yeni Şifre"
                    type="password"
                    placeholder="••••••••"
                    value={forgotData.new_password}
                    onChange={(e) => setForgotData({ ...forgotData, new_password: e.target.value })}
                    required
                  />
                  <Input
                    label="Yeni Şifre (Tekrar)"
                    type="password"
                    placeholder="••••••••"
                    value={forgotData.confirm_password}
                    onChange={(e) => setForgotData({ ...forgotData, confirm_password: e.target.value })}
                    required
                  />
                  <Button type="submit" className="w-full h-14 font-black" disabled={loading}>
                    {loading ? "ŞİFREYİ SIFIRLA..." : "ŞİFREYİ GÜNCELLE"}
                  </Button>
                  <button type="button" onClick={() => setForgotStep(1)} className="w-full text-xs text-foreground/40 hover:text-foreground transition-colors">Geri Dön</button>
                </form>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs italic mt-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ) : !show2FA ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t("login")}</h1>
                <p className="text-foreground/40 text-sm italic">{t("login_hint")}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label={t("username")}
                  placeholder="kullaniciadiniz"
                  icon={<User className="w-4 h-4" />}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <div className="relative">
                  <Input
                    label={t("password")}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(true)}
                    className="absolute right-1 top-0 text-[10px] font-black uppercase tracking-tighter text-primary/40 hover:text-primary transition-colors"
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                <div className="flex justify-center py-2">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADDnJNGyXUKu4w1k"}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onExpire={() => { setTurnstileToken(null); turnstileRef.current?.reset(); }}
                      onError={() => { setTurnstileToken(null); turnstileRef.current?.reset(); }}
                      options={{ theme: "light", retry: "auto", retryInterval: 3000 }}
                    />
                  </div>


                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs italic">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading || !turnstileToken}
                >
                  {loading ? t("logging_in") : t("login")}
                </Button>

                <div className="text-center pt-4 border-t border-foreground/5">
                  <p className="text-xs text-foreground/30">
                    Henüz hesabınız yok mu?{" "}
                    <button 
                      type="button" 
                      onClick={() => router.push("/auth/register")}
                      className="text-primary font-bold hover:underline"
                    >
                      {t("register")}
                    </button>
                  </p>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard className="p-8 border-foreground/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                  <Key className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold mb-2">2FA Doğrulama</h1>
                <p className="text-foreground/40 text-sm italic">
                  {maskedEmail ? (
                    <><strong>{maskedEmail}</strong> adresinize gönderilen 6 haneli kodu girin.</>
                  ) : (
                    "E-posta adresinize gönderilen 6 haneli kodu girin."
                  )}
                </p>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-6">
                <Input
                  label="Doğrulama Kodu"
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-black"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs italic">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Giriş Yap"}
                </Button>

                <button 
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full text-xs text-foreground/20 hover:text-foreground/40 transition-colors"
                >
                  Vazgeç ve Başa Dön
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
