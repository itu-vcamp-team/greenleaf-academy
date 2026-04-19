"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: "SHORT" | "MASTERCLASS";
  isLocked: boolean;
  isNew?: boolean;
  progress?: {
    status: "not_started" | "in_progress" | "completed";
    completion_percentage: number;
  };
}

export default function ContentCard({
  id, title, description, thumbnailUrl, type, isLocked, isNew, progress,
}: ContentCardProps) {
  const t = useTranslations("academy");
  const href = type === "SHORT" ? `/academy/shorts/${id}` : `/academy/masterclass/${id}`;

  return (
    <Link
      href={isLocked ? "#" : href}
      className={`block rounded-xl overflow-hidden border border-gray-200 transition-all
        hover:shadow-md bg-white ${isLocked ? "cursor-not-allowed opacity-75" : "hover:border-primary/30"}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className={`object-cover ${isLocked ? "blur-sm" : ""}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
             <Image src="/images/logo_icon.png" alt="logo" width={40} height={40} className="opacity-20" />
          </div>
        )}

        {/* Kilitli overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Lock size={32} className="text-white mb-2" />
            <span className="text-white text-sm font-medium">{t("locked")}</span>
          </div>
        )}

        {/* NEW rozeti */}
        {isNew && !isLocked && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold
                           px-2 py-0.5 rounded-full shadow-sm">
            YENİ
          </span>
        )}

        {/* Tamamlandı rozeti */}
        {progress?.status === "completed" && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-sm border border-white/20">
            <CheckCircle size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* İçerik bilgileri */}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight h-9">{title}</h3>
        
        {!isLocked ? (
          description && (
            <p className="text-gray-500 text-[11px] mt-1 line-clamp-1 italic">{description}</p>
          )
        ) : (
          <p className="text-gray-400 text-[10px] mt-1 italic leading-tight">
            {t("locked_hint")}
          </p>
        )}

        {/* İlerleme barı */}
        {progress && !isLocked && progress.status !== "not_started" && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Clock size={10} /> {t("progress")}
              </span>
              <span className="font-bold">{Math.round(progress.completion_percentage)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress.completion_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
