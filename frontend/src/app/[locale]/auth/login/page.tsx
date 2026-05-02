"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { LoginForm } from "@/components/auth/LoginForm";
import { ArrowLeft, ShieldCheck, Globe, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Info */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary/5 border-r border-foreground/5 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
        
        <Link href="/">
          <BrandLogo />
        </Link>
        
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Cephaneliğe <br />
              <span className="text-gradient">Geri Dönün.</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-md mb-12 italic leading-relaxed">
              Global ticaretteki yerinizi koruyun, mühimmatlarınızı güncelleyin ve ekibinizi yönetmeye devam edin.
            </p>
            
            <div className="space-y-8">
              <InfoItem 
                icon={<ShieldCheck className="text-primary" />} 
                title="Güvenli Erişim" 
                desc="256-bit şifreleme ve 2FA korumalı oturumlar." 
              />
              <InfoItem 
                icon={<Zap className="text-primary" />} 
                title="Sıcak Veri" 
                desc="Ekibinizin ve adaylarınızın anlık performansı." 
              />
              <InfoItem 
                icon={<Globe className="text-primary" />} 
                title="Global Senkronizasyon" 
                desc="Greenleaf Global Office verilerinizle tam uyumlu." 
              />
            </div>
          </motion.div>
        </div>
        
        <p className="text-foreground/20 text-sm italic">
          "Bir mermi hedefi şaşırabilir ama bir sistem asla."
        </p>
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative bg-surface/20">
        <div className="absolute top-0 right-0 p-8 z-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-foreground/40 hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
            </Button>
          </Link>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

function InfoItem({ icon, title, desc }: { icon: React.ReactNode; title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-foreground/10 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-500">
        {icon}
      </div>
      <div>
        <h4 className="text-foreground font-bold mb-1">{title}</h4>
        <p className="text-foreground/40 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
