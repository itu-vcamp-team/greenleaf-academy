"use client";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Shield, Trash2, ShieldCheck, History, Bell, Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <h1 className="text-3xl font-bold mb-8">Hesap Ayarları</h1>

        <div className="space-y-6">
          {/* Compliance & Privacy Section */}
          <GlassCard className="p-0 overflow-hidden border-white/5">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Gizlilik ve KVKK</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Consent Audit Log */}
              <div>
                <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-white/40" /> Onay Geçmişi (Audit Log)
                </h3>
                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                  <AuditRow 
                    event="KVKK Aydınlatma Metni Onayı" 
                    timestamp="08.04.2026 14:24" 
                    ip="176.234.xx.xx" 
                    version="v2.4.1" 
                  />
                  <AuditRow 
                    event="Ticari İleti İzni" 
                    timestamp="08.04.2026 14:24" 
                    ip="176.234.xx.xx" 
                    version="v1.0.0" 
                  />
                </div>
              </div>

              {/* Data Portability */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-primary/30 transition-colors">
                <div>
                  <h4 className="font-bold text-sm">Verilerimi Dışa Aktar</h4>
                  <p className="text-xs text-white/40 mt-1">Tüm hesap verilerinizi JSON formatında indirin.</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary"><ChevronRight className="w-4 h-4" /></Button>
              </div>

              {/* Hard Delete */}
              <div className="pt-6 border-t border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-red-400">Hesabı Kalıcı Olarak Sil</h4>
                    <p className="text-xs text-white/40 mt-1 max-w-md">
                      Hesabınız silindiğinde tüm eğitim ilerlemeniz, kazanç verileriniz ve kişisel bilgileriniz 
                      <span className="text-red-400/60 font-bold"> geri döndürülemez şekilde</span> sunucularımızdan temizlenecektir.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Hesabımı Sil
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Other Settings Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingCard icon={<Bell />} title="Bildirimler" desc="E-posta ve anlık uyarı yönetimi." />
            <SettingCard icon={<Globe />} title="Bölge ve Dil" desc="Arayüz ve içerik dili tercihi." />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass border-red-500/30 p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Emin misiniz?</h2>
            <p className="text-white/60 mb-8">
              Bu işlem durdurulamaz. Tüm verileriniz GDPR/KVKK standartlarına uygun olarak 
              <span className="text-white font-bold"> anında ve kalıcı olarak</span> silinecektir.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Vazgeç</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 border-none">Evet, Her Şeyi Sil</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ event, timestamp, ip, version }: { event: string, timestamp: string, ip: string, version: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors">
      <div>
        <p className="text-sm font-bold text-white/90">{event}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{version}</p>
      </div>
      <div className="text-right mt-2 sm:mt-0">
        <p className="text-xs text-white/60 font-medium">{timestamp}</p>
        <p className="text-[10px] text-white/20 tabular-nums">{ip}</p>
      </div>
    </div>
  );
}

function SettingCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <GlassCard className="flex items-center gap-4 hover:border-primary/20 cursor-pointer transition-all">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-white/90">{title}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
    </GlassCard>
  );
}
