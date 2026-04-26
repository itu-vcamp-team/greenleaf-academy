"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Lock, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * lockReason variants:
 * - "guest"       : user is not logged in — lock is due to role, not prerequisite.
 *                   Navigation to the detail page IS allowed (metadata visible).
 * - "prerequisite": content is locked because the user hasn't completed a required
 *                   prior lesson. Navigation is blocked (href="#").
 * - undefined     : not locked, no reason needed.
 */
export type LockReason = "guest" | "prerequisite";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: "SHORT" | "MASTERCLASS";
  isLocked: boolean;
  isNew?: boolean;
  lockReason?: LockReason;
  progress?: {
    status: "not_started" | "in_progress" | "completed";
    completion_percentage: number;
  };
}

const DESC_MAX_CHARS = 110;

function truncateDesc(text: string): string {
  if (text.length <= DESC_MAX_CHARS) return text;
  return text.slice(0, DESC_MAX_CHARS).trimEnd() + "…";
}

export default function ContentCard({
  id, title, description, thumbnailUrl, type, isLocked, isNew, lockReason, progress,
}: ContentCardProps) {
  const t = useTranslations("academy");

  const href = type === "SHORT" ? "/academy/shorts/" + id : "/academy/masterclass/" + id;

  // Guests can navigate to detail pages (they'll see metadata but no video).
  // Prerequisite-locked items are not navigable.
  const resolvedHref = isLocked && lockReason !== "guest" ? "#" : href;

  const cardClassName = [
    "block rounded-xl overflow-hidden border border-foreground/5 transition-all hover:shadow-md bg-surface",
    isLocked && lockReason !== "guest"
      ? "cursor-not-allowed opacity-75"
      : isLocked
      ? "hover:border-primary/20"          // guest-locked: navigable, subtle hover
      : "hover:border-primary/30",         // unlocked
  ].join(" ");

  // Lock hint message based on reason
  const lockHintText = lockReason === "guest"
    ? t("locked_hint_guest")
    : t("locked_hint");

  return (
    <Link href={resolvedHref} className={cardClassName}>
      {/* Thumbnail */}
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

      {/* Card Body */}
      <div className="p-3">
        <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight h-9">{title}</h3>

        {/* Description — always shown when available, truncated */}
        {description && (
          <p className="text-foreground/40 text-[11px] mt-1 italic leading-snug">
            {truncateDesc(description)}
          </p>
        )}

        {/* Lock hint — shown below description for locked items */}
        {isLocked && (
          <p className="text-foreground/30 text-[10px] mt-1.5 italic leading-tight">
            {lockHintText}
          </p>
        )}

        {/* Progress bar — only for unlocked + in-progress/completed */}
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
