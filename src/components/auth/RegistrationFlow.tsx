"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import { useRouter } from "next/navigation";

export function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const { setRole } = useUserRole();
  const router = useRouter();

  const handlePartnerVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Simulating the "1-second verification" requirement
    setTimeout(() => {
      if (partnerId.startsWith("TR-")) {
        setStep(2);
      } else {
        setError("Geçersiz veya yetkisiz Partner ID. Lütfen davet eden ortağınızdan doğrulayın.");
      }
      setLoading(false);
    }, 1000);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate encryption and consent logging
    const consentLog = {
      timestamp: new Date().toISOString(),
      version: "KVKK-2024-V2",
      ip: "127.0.0.1 (Mocked)"
    };
    
    setTimeout(() => {
      console.log("Consent Recorded:", consentLog);
      setRole("PARTNER");
      router.push("/academy");
      setLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 1 ? (
        <motion.div
          key="step1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <GlassCard className="w-full max-w-md p-8 border-white/5" animate>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Partner Doğrulaması</h1>
              <p className="text-white/40 text-sm">Sisteme girmek için geçerli bir Partner ID gereklidir.</p>
            </div>

            <form onSubmit={handlePartnerVerify} className="space-y-4">
              <Input 
                label="Referans Partner ID" 
                placeholder="Örn: TR-2024-X" 
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                error={error}
                required 
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Doğrula ve Devam Et
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <GlassCard className="w-full max-w-md p-8 border-white/5" animate>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-6 w-fit mx-auto">
              Partner ID Doğrulandı
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Profilini Tamamla</h1>
              <p className="text-white/40 text-sm">Dijital cephaneliğine erişmek için son adımlar.</p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ad" placeholder="Ahmet" required />
                <Input label="Soyad" placeholder="Yılmaz" required />
              </div>
              <Input label="Şifre" type="password" required />
              <Input 
                label="Davetiye Kodu (Opsiyonel)" 
                placeholder="Örn: G-PRO-XXXX" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 mt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required className="mt-1 accent-primary" />
                  <span className="text-[11px] text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                    <span className="text-primary underline">KVKK Aydınlatma Metni</span> ve <span className="text-primary underline">Kullanım Şartları</span>'nı okudum, kabul ediyorum.
                  </span>
                </label>
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
                Akademiye Giriş Yap
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
