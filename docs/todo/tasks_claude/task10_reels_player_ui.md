# Task 10: Akademi UI – Shorts Player, Masterclass ve İçerik Sayfaları

## 🎯 Hedef
Akademi içeriklerini tüketeceği frontend sayfalarını geliştirmek: Shorts (dikey format) ve Masterclass player sayfaları, içerik listesi, arama çubuğu, breadcrumb, kilitli içerik blur görünümü, ilerleme barı ve kaynak link butonu.

## ⚠️ Ön Koşullar
- Task 5 (Frontend Kurulum) tamamlanmış olmalı
- Task 6 (Akademi API) çalışıyor olmalı
- Task 7 (Progress Tracking) backend endpoint'leri hazır

---

## 🧠 Akademi Sayfa Yapısı

```
/academy                         → Akademi ana sayfası (iki sekme)
  /academy/shorts                → Shorts listesi (dikey video kartları)
  /academy/shorts/[id]           → Shorts oynatıcı (9:16 oranında)
  /academy/masterclass           → Masterclass listesi
  /academy/masterclass/[id]      → Masterclass oynatıcı (geniş ekran)

Breadcrumb örnekleri:
  Akademi / Shorts / İkna Yöntemleri
  Akademi / Masterclass / Satış Stratejisi Eğitimi
```

---

## 📄 Adım 1: Akademi Ana Sayfası – `src/app/[locale]/(dashboard)/academy/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Zap, Star } from "lucide-react";
import MyProgressStats from "@/components/academy/MyProgressStats";
import SearchBar from "@/components/academy/SearchBar";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";

type Tab = "shorts" | "masterclass";

export default function AcademyPage() {
  const t = useTranslations("academy");
  const [activeTab, setActiveTab] = useState<Tab>("shorts");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Akademi başlık metni */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Kullanıcının genel ilerleme istatistikleri */}
      <MyProgressStats />

      {/* Arama barı */}
      <SearchBar className="my-4" />

      {/* Sekme navigasyonu */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <TabButton
          active={activeTab === "shorts"}
          onClick={() => setActiveTab("shorts")}
          icon={<Zap size={16} />}
          label="Shorts"
        />
        <TabButton
          active={activeTab === "masterclass"}
          onClick={() => setActiveTab("masterclass")}
          icon={<Star size={16} />}
          label="Masterclass"
        />
      </div>

      {/* İçerik listesi */}
      {activeTab === "shorts" ? (
        <Link href="/academy/shorts">
          <ShortsPreviewList />
        </Link>
      ) : (
        <Link href="/academy/masterclass">
          <MasterclassPreviewList />
        </Link>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
```

---

## 📄 Adım 2: İçerik Listesi Bileşeni – `src/components/academy/ContentCard.tsx`

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, CheckCircle, Clock } from "lucide-react";

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
  const href = type === "SHORT" ? `/academy/shorts/${id}` : `/academy/masterclass/${id}`;

  return (
    <Link
      href={isLocked ? "#" : href}
      className={`block rounded-xl overflow-hidden border border-gray-200 transition-all
        hover:shadow-md bg-white ${isLocked ? "cursor-not-allowed opacity-75" : ""}`}
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
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200" />
        )}

        {/* Kilitli overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Lock size={32} className="text-white mb-2" />
            <span className="text-white text-sm font-medium">Kilitli</span>
          </div>
        )}

        {/* NEW rozeti */}
        {isNew && !isLocked && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold
                           px-2 py-1 rounded-full">
            YENİ
          </span>
        )}

        {/* Tamamlandı rozeti */}
        {progress?.status === "completed" && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <CheckCircle size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* İçerik bilgileri */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{title}</h3>
        {description && !isLocked && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{description}</p>
        )}
        {isLocked && (
          <p className="text-gray-400 text-xs mt-1 italic">
            Önceki içeriği tamamlayarak bu içeriğin kilidini aç.
          </p>
        )}

        {/* İlerleme barı */}
        {progress && !isLocked && progress.status !== "not_started" && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <Clock size={10} /> İlerleme
              </span>
              <span>{Math.round(progress.completion_percentage)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress.completion_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
```

---

## 📄 Adım 3: Shorts Oynatıcı Sayfası – `src/app/[locale]/(dashboard)/academy/shorts/[id]/page.tsx`

```typescript
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, CheckCircle, BookmarkPlus } from "lucide-react";
import YouTubePlayer from "@/components/academy/YouTubePlayer";
import apiClient from "@/lib/api-client";

interface ContentDetail {
  id: string;
  title: string;
  description: string;
  video_url: string;
  resource_link: string | null;
  resource_link_label: string | null;
  is_locked: boolean;
  progress: {
    status: string;
    last_position_seconds: number | null;
  } | null;
}

export default function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    apiClient.get(`/academy/contents/${id}`)
      .then((res) => {
        setContent(res.data);
        setIsCompleted(res.data.progress?.status === "completed");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleMarkComplete = async () => {
    await apiClient.post("/progress/complete", { content_id: id });
    setIsCompleted(true);
  };

  const handleAddFavorite = async () => {
    await apiClient.post("/favorites", { content_id: id });
  };

  if (loading) return <ShortsPlayerSkeleton />;
  if (!content || content.is_locked) return <LockedContent />;

  return (
    <div className="max-w-xl mx-auto px-4 py-4">

      {/* Breadcrumb: Akademi / Shorts / [Başlık] */}
      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <Link href="/academy" className="hover:text-primary">Akademi</Link>
        <ChevronRight size={12} />
        <Link href="/academy/shorts" className="hover:text-primary">Shorts</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium line-clamp-1">{content.title}</span>
      </nav>

      {/* Video Oynatıcı – 9:16 dikey format */}
      <div className="relative mx-auto" style={{ maxWidth: "360px" }}>
        <div className="relative bg-black rounded-2xl overflow-hidden"
             style={{ aspectRatio: "9/16" }}>
          <YouTubePlayer
            videoUrl={content.video_url}
            contentId={content.id}
            initialPosition={content.progress?.last_position_seconds ?? 0}
          />
        </div>
      </div>

      {/* İçerik Bilgileri */}
      <div className="mt-4">
        <h1 className="text-xl font-bold text-gray-900">{content.title}</h1>
        {content.description && (
          <p className="text-gray-600 text-sm mt-2">{content.description}</p>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex flex-col gap-3 mt-4">
        {/* Google Drive kaynak linki (varsa) */}
        {content.resource_link && (
          <a
            href={content.resource_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4
                       border-2 border-primary text-primary rounded-xl font-medium
                       hover:bg-green-50 transition-colors"
          >
            <ExternalLink size={16} />
            {content.resource_link_label || "Kaynak Dosyasını Görüntüle"}
          </a>
        )}

        {/* Tamamlandı butonu */}
        <button
          onClick={handleMarkComplete}
          disabled={isCompleted}
          className={`flex items-center justify-center gap-2 w-full py-3 px-4
                     rounded-xl font-medium transition-colors ${
            isCompleted
              ? "bg-green-100 text-green-700 cursor-default"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          <CheckCircle size={16} />
          {isCompleted ? "Tamamlandı ✓" : "Tamamlandı Olarak İşaretle"}
        </button>

        {/* Favori butonu */}
        <button
          onClick={handleAddFavorite}
          className="flex items-center justify-center gap-2 w-full py-2 text-gray-500
                     hover:text-primary text-sm transition-colors"
        >
          <BookmarkPlus size={16} />
          Favorilerime Ekle
        </button>
      </div>
    </div>
  );
}

function ShortsPlayerSkeleton() {
  return (
    <div className="max-w-xl mx-auto px-4 py-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
      <div className="mx-auto bg-gray-200 rounded-2xl" style={{ maxWidth: "360px", aspectRatio: "9/16" }} />
      <div className="mt-4 space-y-2">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

function LockedContent() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Bu içerik kilitli</h2>
      <p className="text-gray-500">
        Bu içeriğe erişmek için önce önceki içeriği tamamlamalısınız.
      </p>
      <Link
        href="/academy/shorts"
        className="mt-4 inline-block text-primary hover:underline"
      >
        Listeye Dön
      </Link>
    </div>
  );
}
```

---

## 📄 Adım 4: Masterclass Player – `src/app/[locale]/(dashboard)/academy/masterclass/[id]/page.tsx`

Shorts'tan farkı: video 16:9 geniş ekran, daha büyük başlık ve açıklama alanı.

```typescript
"use client";
// Shorts sayfasına benzer yapı, fakat video 16:9 format:

// Video container'ı:
// <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>

// Breadcrumb:
// Akademi / Masterclass / [Başlık]

// Aynı aksiyon butonları: resource_link, tamamlandı, favori
// Ayrıca açıklama alanı daha geniş tutulur (Masterclass = uzun format = daha fazla içerik)
```

---

## 📄 Adım 5: Arama Bileşeni – `src/components/academy/SearchBar.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import ContentCard from "./ContentCard";

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const search = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.get(`/academy/contents/search?q=${q}&locale=tr`);
        setResults(res.data);
        setShowResults(true);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    search(value);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Arama input'u */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2
                      bg-white focus-within:border-primary transition-colors">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="İçerik ara... (başlık, açıklama)"
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {query && (
          <button onClick={clearSearch}>
            <X size={14} className="text-gray-400 hover:text-gray-700" />
          </button>
        )}
      </div>

      {/* Arama sonuçları dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white
                        border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Aranıyor...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              "{query}" için sonuç bulunamadı.
            </div>
          ) : (
            <div className="p-2 grid grid-cols-2 gap-2">
              {results.map((item) => (
                <ContentCard key={item.id} {...item} isLocked={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Basit debounce yardımcısı
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
```

---

## 📄 Adım 6: İlerleme İstatistikleri Bileşeni – `src/components/academy/MyProgressStats.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Stats {
  shorts: { completed: number; total: number; percentage: number };
  masterclass: { completed: number; total: number; percentage: number };
}

export default function MyProgressStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiClient.get("/progress/my-stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="h-16 bg-gray-100 rounded-xl animate-pulse mb-4" />;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <StatCard label="Shorts" color="blue" {...stats.shorts} />
      <StatCard label="Masterclass" color="green" {...stats.masterclass} />
    </div>
  );
}

function StatCard({ label, completed, total, percentage, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            color === "blue" ? "bg-blue-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{completed}/{total} tamamlandı</p>
    </div>
  );
}
```

---

## ✅ Kabul Kriterleri

- [ ] `/academy` sayfasında Shorts ve Masterclass sekmeleri çalışıyor
- [ ] `ContentCard` kilitli içerikte thumbnail bulanık, kilit ikonu görünüyor
- [ ] Video kilitli içeriğe tıklanınca kilitli ekran gösteriyor (yönlendirme yok)
- [ ] Shorts player 9:16 dikey formatta görünüyor
- [ ] Masterclass player 16:9 geniş ekran formatta görünüyor
- [ ] Breadcrumb `Akademi / Shorts / [Başlık]` şeklinde görünüyor
- [ ] Google Drive kaynak linki varsa "Kaynak Dosyasını Görüntüle" butonu görünüyor
- [ ] "Tamamlandı Olarak İşaretle" butonu basılınca yeşile dönüyor
- [ ] Arama barı 2+ karakter sonrası sonuçları dropdown'da listeli gösteriyor
- [ ] İlerleme yüzdesi barı `MyProgressStats` bileşeninde doğru gösteriliyor
- [ ] Skeleton iskelet yüklenirken gösteriliyor

---

## 📝 Junior Developer Notları

> **`resource_link` yerine neden "Google Drive" butonu?** Eski tasarımda PDF indirme butonu vardı. Proje kararına göre PDF dosyası sunucuya yüklenmeyecek, sadece Google Drive linki verilecek. Bu link yeni sekmede açılır, görüntüleme yetki seviyesinde Drive üzerinde gösterilir.
>
> **Arama neden debounce?** Her tuş basışında API'ye istek atmak gereksiz. 400ms bekleyip son değeri gönderiyoruz.
>
> **Shorts için 9:16 aspect ratio neden?** Dikey video formatı (TikTok/Reels tarzı). `aspectRatio: "9/16"` ile CSS'de belirtilir.
>
> **`line-clamp-2` nedir?** Tailwind'in uzun metni 2 satırdan keserek `...` ile gösteren utility sınıfı. İçerik kartlarında düzgün görünüm için gerekli.
