"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
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
  const href = type === "SHORT" ? "/academy/shorts/" + id : "/academy/masterclass/" + id;

  const cardClassName = [
    "block rounded-xl overflow-hidden border border-foreground/5 transition-all hover:shadow-md bg-surface",
    isLocked ? "cursor-not-allowed opacity-75" : "hover:border-primary/30"
  ].join(" ");

  return (
    <Link
      href={isLocked ? "#" : href}
      className={cardClassName}
    >
      <div className="relative aspect-video bg-foreground/5 text-foreground">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className={isLocked ? "object-cover blur-sm" : "object-cover"}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-primary/20 rounded-full flex items-center justify-center text-primary/30 font-black italic">G</div>
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <Lock size={32} className="text-foreground/40 mb-2" />
            <span className="text-foreground/60 text-sm font-medium">{t("locked")}</span>
          </div>
        )}

        {isNew && !isLocked && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            YENİ
          </span>
        )}

        {progress?.status === "completed" && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-sm border border-white/20">
            <CheckCircle size={14} className="text-white" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight h-9">{title}</h3>
        
        {!isLocked && description ? (
          <p className="text-foreground/40 text-[11px] mt-1 line-clamp-1 italic">{description}</p>
        ) : isLocked ? (
          <p className="text-foreground/30 text-[10px] mt-1 italic leading-tight">
            {t("locked_hint")}
          </p>
        ) : null}

        {progress && !isLocked && progress.status !== "not_started" && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-foreground/40 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Clock size={10} /> {t("progress")}
              </span>
              <span className="font-bold">%{Math.round(progress.completion_percentage)}</span>
            </div>
            <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: Math.round(progress.completion_percentage) + "%" }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
