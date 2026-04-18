"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, UserPlus, CheckCircle2, AlertCircle, Loader2, Globe, Key, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import { useRouter } from "next/navigation";

export function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Step 1: Global Account
  const [globalLogin, setGlobalLogin] = useState("");
  const [globalPassword, setGlobalPassword] = useState("");
  
  // Step 2: Academy Profile
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mockId, setMockId] = useState("");
  
  // Step 3: Local Password
  const [academyPassword, setAcademyPassword] = useState("");
  
  const { setRole } = useUserRole();
  const router = useRouter();

  // Generate Mock ID on component mount or at step transition
  useEffect(() => {
    if (step === 2 && !mockId) {
      const randomId = "GL-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      setMockId(randomId);
    }
  }, [step, mockId]);

  const handleGlobalVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/auth/verify-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: globalLogin, password: globalPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || "Geçersiz Greenleaf Global hesabı.");
      }
    } catch (err) {
      setError("Doğrulama servisine ulaşılamıyor. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate encryption and account creation
    setTimeout(() => {
      setRole("PARTNER");
      router.push("/academy");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md">
      {/* Progress Indicator */}
      <div className="flex justify-between mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/20 border border-white/5"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-white/5" animate>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Global Doğrulama</h1>
                <p className="text-white/40 text-sm italic">Greenleaf Global (Office) hesabınızı doğrulayarak başlayın.</p>
              </div>

              <form onSubmit={handleGlobalVerify} className="space-y-4">
                <Input 
                  label="Office Kullanıcı Adı" 
                  placeholder="Kullanıcı adınız" 
                  value={globalLogin}
                  onChange={(e) => setGlobalLogin(e.target.value)}
                  required 
                />
                <Input 
                  label="Office Şifresi" 
                  type="password"
                  placeholder="••••••••" 
                  value={globalPassword}
                  onChange={(e) => setGlobalPassword(e.target.value)}
                  error={error}
                  required 
                />
                <Button type="submit" className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest" size="lg" loading={loading}>
                  Doğrula ve Devam Et
                </Button>
                <p className="text-[10px] text-white/20 text-center leading-relaxed">
                  Şifreniz sadece doğrulama için kullanılır ve asla kaydedilmez.
                </p>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-white/5" animate>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                  <UserPlus className="w-6 h-6 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Profilini Oluştur</h1>
                <p className="text-white/40 text-sm">Akademi kimliğinizi tanımlayın.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Partner ID (Atandı)</p>
                    <p className="text-lg font-black text-white">{mockId}</p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-primary opacity-40" />
                </div>

                <Input 
                  label="E-Posta" 
                  type="email"
                  placeholder="ahmet@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <Input 
                  label="Akademi Kullanıcı Adı" 
                  placeholder="ahmet_yılmaz" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
                
                <Button type="submit" className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest" size="lg">
                  Son Adıma Geç
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-8 border-white/5" animate>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Şifre Belirle</h1>
                <p className="text-white/40 text-sm">Akademi platformu için giriş şifrenizi oluşturun.</p>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <Input 
                  label="Yeni Şifre" 
                  type="password"
                  placeholder="••••••••" 
                  value={academyPassword}
                  onChange={(e) => setAcademyPassword(e.target.value)}
                  required 
                />
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" required className="mt-1 accent-primary" />
                    <span className="text-[11px] text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                      <span className="text-primary underline">KVKK Aydınlatma Metni</span> ve Kullanım Şartları'nı okudum, kabul ediyorum.
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest" size="lg" loading={loading}>
                  Kaydı Tamamla ve Giriş Yap
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
