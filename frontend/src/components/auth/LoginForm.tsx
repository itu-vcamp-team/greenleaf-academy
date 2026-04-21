"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, User, Lock, Key, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [userId, setUserId] = useState("");
  
  const [captcha, setCaptcha] = useState<{ session_key: string; numbers: number[] } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [otpCode, setOtpCode] = useState("");

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const fetchCaptcha = async () => {
    try {
      const res = await apiClient.get("/auth/captcha");
      setCaptcha(res.data);
      setCaptchaAnswer("");
    } catch (err) {
      console.error("Captcha fetch failed", err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/login", {
        ...formData,
        session_key: captcha?.session_key,
        captcha_answer: parseInt(captchaAnswer),
      });

      if (res.data.requires_2fa) {
        setTempToken(res.data.temp_token);
        setUserId(res.data.user_id);
        setShow2FA(true);
      } else {
        const { tokens } = res.data;
        // Verify User profile via verify-global immediately after login
        const profileRes = await apiClient.get("/auth/verify-global", {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        
        setAuth(profileRes.data, tokens.access_token, tokens.refresh_token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Giriş başarısız. Bilgilerinizi kontrol edin.");
      fetchCaptcha(); // Refresh captcha on error
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
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Doğrulama kodu hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {!show2FA ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-8 border-white/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t("login")}</h1>
                <p className="text-white/40 text-sm italic">Giriş yaparak cephaneliğinize erişin.</p>
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
                <Input
                  label={t("password")}
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                {captcha && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-black uppercase tracking-widest text-white/40 italic">
                         {t("captcha_hint")}
                       </label>
                       <button type="button" onClick={fetchCaptcha} className="text-primary hover:rotate-180 transition-transform">
                         <RefreshCcw className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl font-black tracking-[0.5em] text-primary select-none">
                        {captcha.numbers.join(" + ")}
                      </div>
                      <div className="w-24">
                        <Input
                          placeholder="?"
                          type="number"
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          className="text-center h-14 text-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                  {loading ? "Giriş Yapılıyor..." : t("login")}
                </Button>

                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-xs text-white/30">
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
            <GlassCard className="p-8 border-white/5">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                  <Key className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold mb-2">2FA Doğrulama</h1>
                <p className="text-white/40 text-sm italic">E-posta adresinize gönderilen 6 haneli kodu girin.</p>
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
                  className="w-full text-xs text-white/20 hover:text-white/40 transition-colors"
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
