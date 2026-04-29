"use client";

/**
 * RankBadge – Partner rank display component
 *
 * Ranks:
 *  👤 Partner  PARTNER   0 –  9 %
 *  ⭐ Uzman    UZMAN    10 – 24 %
 *  💼 Mentor   MENTOR   25 – 49 %
 *  💎 Lider    LIDER    50 – 74 %
 *  🔥 Master   MASTER   75 – 89 %
 *  💠 Mimar    MIMAR    90 – 100%
 */

export type RankKey =
  | "PARTNER"
  | "UZMAN"
  | "MENTOR"
  | "LIDER"
  | "MASTER"
  | "MIMAR";

export interface RankInfo {
  rank: RankKey;
  rank_label: string;
  rank_emoji: string;
  rank_color: string;
  earned_points: number;
  max_points: number;
  rank_percentage: number;
}

interface RankBadgeProps {
  rank: RankKey;
  rankLabel: string;
  rankEmoji: string;
  earnedPoints?: number;
  maxPoints?: number;
  rankPercentage?: number;
  /** sm = compact pill, md = default badge, lg = full card */
  size?: "sm" | "md" | "lg";
  showPoints?: boolean;
  showProgress?: boolean;
}

const RANK_STYLES: Record<
  RankKey,
  { bg: string; border: string; text: string; glow: string; bar: string }
> = {
  PARTNER: {
    bg: "bg-foreground/10",
    border: "border-foreground/20",
    text: "text-foreground/40",
    glow: "",
    bar: "bg-foreground/40",
  },
  UZMAN: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    glow: "",
    bar: "bg-blue-400",
  },
  MENTOR: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    glow: "",
    bar: "bg-purple-400",
  },
  LIDER: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
    bar: "bg-cyan-400",
  },
  MASTER: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
    bar: "bg-orange-400",
  },
  MIMAR: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-400",
    glow: "shadow-teal-500/30",
    bar: "bg-gradient-to-r from-teal-400 to-cyan-400",
  },
};

export function RankBadge({
  rank,
  rankLabel,
  rankEmoji,
  earnedPoints,
  maxPoints,
  rankPercentage,
  size = "md",
  showPoints = false,
  showProgress = false,
}: RankBadgeProps) {
  const styles = RANK_STYLES[rank] ?? RANK_STYLES.PARTNER;

  /* ── Small pill ── */
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide
          ${styles.bg} ${styles.border} ${styles.text}`}
      >
        <span>{rankEmoji}</span>
        <span>{rankLabel}</span>
      </span>
    );
  }

  /* ── Large card ── */
  if (size === "lg") {
    const pct = rankPercentage ?? 0;
    return (
      <div
        className={`rounded-2xl border p-6 ${styles.bg} ${styles.border} ${styles.glow ? `shadow-lg ${styles.glow}` : ""}`}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{rankEmoji}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">
              Rütbe
            </p>
            <p className={`text-2xl font-black ${styles.text}`}>{rankLabel}</p>
          </div>
        </div>

        {showPoints && earnedPoints !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-foreground/40 mb-1">
              <span>Eğitim Puanı</span>
              <span>
                {earnedPoints.toLocaleString("tr-TR")}
                {maxPoints ? ` / ${maxPoints.toLocaleString("tr-TR")}` : ""}
              </span>
            </div>
          </div>
        )}

        {showProgress && (
          <div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-foreground/30 mb-2">
              <span>Havuz Tamamlama</span>
              <span className={styles.text}>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${styles.bar} transition-all duration-1000`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Default (md) badge ── */
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border
        ${styles.bg} ${styles.border} ${styles.glow ? `shadow-md ${styles.glow}` : ""}`}
    >
      <span className="text-base leading-none">{rankEmoji}</span>
      <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>
          {rankLabel}
        </span>
        {showPoints && earnedPoints !== undefined && (
          <span className="text-[9px] text-foreground/30 font-medium">
            {earnedPoints.toLocaleString("tr-TR")} puan
          </span>
        )}
      </div>
    </div>
  );
}
