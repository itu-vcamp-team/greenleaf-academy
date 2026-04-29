"use client";

import { useState } from "react";
import { Code2, Copy, Check, Loader2, Sparkles, History } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export default function ReferenceCodeGenerator() {
  const t = useTranslations("academy");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post("/reference-codes/generate");
      setCode(res.data.code);
      setCopied(false);
    } catch (err) {
      console.error("Code generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[2rem] p-8 shadow-xl shadow-black/[0.04] relative overflow-hidden group transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={16} className="animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-widest">{t("invite_code")}</h3>
          </div>
          <p className="text-foreground/50 text-sm font-medium max-w-sm leading-relaxed">
            {t("invite_code_hint") || "Yeni bir aday kaydetmek için tek kullanımlık referans kodu oluşturun."}
          </p>
        </div>

        <button
          onClick={generateCode}
          disabled={loading}
          className="relative inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest
                     hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all shadow-2xl shadow-black/10"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Code2 size={18} />
          )}
          {loading ? t("generating") : t("generate_new_code")}
        </button>
      </div>

      <AnimatePresence>
        {code && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            className="mt-8 pt-8 border-t border-border"
          >
            <div className="bg-background border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-1">
                  Referans Kodunuz
                </span>
                <code className="text-3xl font-black text-primary tracking-[0.2em]">{code}</code>
              </div>

              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  copied
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                    : "bg-foreground/5 text-foreground border border-border hover:border-primary/30 hover:shadow-lg"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t("copied") : t("copy")}
              </button>
            </div>

            <p className="flex items-center justify-center sm:justify-start gap-2 text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-4 pl-2 opacity-60">
              <History size={12} /> {t("one_time_code_warning") || "Bu kod yalnızca bir kez kullanılabilir."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
