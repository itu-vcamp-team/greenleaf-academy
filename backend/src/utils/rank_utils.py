"""
Partner rank calculation utilities.

Rank thresholds are based on % of total possible points earned:
  earned_points = (completed_shorts × 1000) + (completed_masterclasses × 4000)
  max_points    = (total_shorts × 1000) + (total_masterclasses × 4000)
  rank_pct      = earned / max × 100  (0 if max == 0)

Ranks:
  👤 Partner   0  – 9.99%   (Sistemi tanıma ve öğrenme aşaması)
  ⭐ Uzman     10 – 24.99%  (Temel ürün ve kazanç planı eğitimlerini yutmuş)
  💼 Mentor    25 – 49.99%  (Artık kendi bilgisini alt ekibine aktarabilecek seviye)
  💎 Lider     50 – 74.99%  (Sahada inisiyatif alan ve ağı yöneten)
  🔥 Master    75 – 89.99%  (Eğitimlerin tamamına yakınına hakim, işin üstadı)
  💠 Mimar     90 – 100%    (Sistemi kopyalayan, kopyalatan ve o elit altyapıyı tasarlayan zirve)
"""
from __future__ import annotations
from enum import Enum


POINTS_PER_SHORT: int = 1_000
POINTS_PER_MASTERCLASS: int = 4_000


class PartnerRank(str, Enum):
    PARTNER = "PARTNER"
    UZMAN = "UZMAN"
    MENTOR = "MENTOR"
    LIDER = "LIDER"
    MASTER = "MASTER"
    MIMAR = "MIMAR"


RANK_META: dict[PartnerRank, dict] = {
    PartnerRank.PARTNER: {
        "label": "Partner",
        "emoji": "👤",
        "color": "gray",
        "min_pct": 0,
    },
    PartnerRank.UZMAN: {
        "label": "Uzman",
        "emoji": "⭐",
        "color": "blue",
        "min_pct": 10,
    },
    PartnerRank.MENTOR: {
        "label": "Mentor",
        "emoji": "💼",
        "color": "purple",
        "min_pct": 25,
    },
    PartnerRank.LIDER: {
        "label": "Lider",
        "emoji": "💎",
        "color": "cyan",
        "min_pct": 50,
    },
    PartnerRank.MASTER: {
        "label": "Master",
        "emoji": "🔥",
        "color": "orange",
        "min_pct": 75,
    },
    PartnerRank.MIMAR: {
        "label": "Mimar",
        "emoji": "💠",
        "color": "teal",
        "min_pct": 90,
    },
}


def compute_rank(percentage: float) -> PartnerRank:
    """Return the PartnerRank that corresponds to the given percentage."""
    if percentage >= 90:
        return PartnerRank.MIMAR
    if percentage >= 75:
        return PartnerRank.MASTER
    if percentage >= 50:
        return PartnerRank.LIDER
    if percentage >= 25:
        return PartnerRank.MENTOR
    if percentage >= 10:
        return PartnerRank.UZMAN
    return PartnerRank.PARTNER


def rank_response(rank: PartnerRank, earned: int, maximum: int, pct: float) -> dict:
    meta = RANK_META[rank]
    return {
        "rank": rank.value,
        "rank_label": meta["label"],
        "rank_emoji": meta["emoji"],
        "rank_color": meta["color"],
        "earned_points": earned,
        "max_points": maximum,
        "rank_percentage": pct,
    }
