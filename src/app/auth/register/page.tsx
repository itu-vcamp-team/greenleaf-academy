"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { RegistrationFlow } from "@/components/auth/RegistrationFlow";
import { ArrowLeft, ShieldCheck, UserPlus, Globe } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Info */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary/5 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
        
        <Link href="/">
          <BrandLogo />
        </Link>
        
        <div className="relative">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Dijital <span className="text-gradient">Kale'ye</span> Hoş Geldiniz.
          </h2>
          <p className="text-white/60 text-lg max-w-md mb-8">
            Global Hub ekosistemine katılarak işinizi profesyonel araçlar ve veri odaklı stratejilerle büyütmeye başlayın.
          </p>
          
          <div className="space-y-6">
            <InfoItem icon={<ShieldCheck className="text-primary" />} text="KVKK Uyumlu Güvenli Altyapı" />
            <InfoItem icon={<UserPlus className="text-primary" />} text="Partner ID ile Anında Eşleşme" />
            <InfoItem icon={<Globe className="text-primary" />} text="7 Dilde Global Büyüme Desteği" />
          </div>
        </div>
        
        <p className="text-white/40 text-sm italic">
          "Kervan sağlam bir yolda hızlı gider. Biz o yolu inşa ediyoruz."
        </p>
      </div>

      {/* Right Side: Flow */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative bg-surface/20">
        <div className="absolute top-0 right-0 p-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-white/40">
              <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
            </Button>
          </Link>
        </div>

        <RegistrationFlow />
      </div>
    </div>
  );
}

function InfoItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 italic">
        {icon}
      </div>
      <span className="text-white/80 font-medium">{text}</span>
    </div>
  );
}

