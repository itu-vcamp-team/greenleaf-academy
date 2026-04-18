# Task 7: İlerleme Takibi, YouTube Entegrasyonu ve Favoriler

## 🎯 Hedef
Kullanıcının akademi içeriklerindeki ilerlemesini takip eden backend endpoint'lerini ve frontend YouTube IFrame entegrasyonunu yazmak. Partner manuel olarak içeriği "tamamlandı" olarak işaretler; YouTube IFrame API izlenme yüzdesi bilgisi ayrıca kaydedilir.

## ⚠️ Ön Koşullar
- Task 6 (Akademi API) tamamlanmış olmalı
- `UserProgress`, `Favorite` modelleri DB'de hazır

---

## 🧠 İlerleme Mantığı

```
İlerleme iki kaynaktan güncellenir:

1. YouTube IFrame API (otomatik):
   → Video oynatılırken her 15 saniyede bir frontend backend'e
     "completion_percentage" ve "last_position_seconds" gönderir.
   → Bu BİTİRME SAYILMAZ, sadece "kaldığın yerden devam et" için.

2. Manuel Tamamlama (partner tarafından):
   → Partner "Tamamlandı Olarak İşaretle" butonuna basar.
   → status = "completed", completed_at = şimdiki zaman
   → Bu aksiyonla prerequisite sistemi tetiklenir (bir sonraki içerik açılır).

Dikkat: Kullanıcı videoyu ileri sarabilir, bu engellenmez.
Tamamlanma butonu kullanıcının beyanına dayanır.
```

---

## 📄 Adım 1: `src/datalayer/repository/progress_repository.py`

```python
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db import UserProgress, AcademyContent


class ProgressRepository:
    def __init__(self, session: AsyncSession, user_id: uuid.UUID):
        self.session = session
        self.user_id = user_id

    async def get_progress(self, content_id: uuid.UUID) -> Optional[UserProgress]:
        """Belirli bir içerik için mevcut progress kaydını getirir."""
        result = await self.session.execute(
            select(UserProgress).where(
                UserProgress.user_id == self.user_id,
                UserProgress.content_id == content_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_progress(self, content_ids: List[uuid.UUID]) -> List[UserProgress]:
        """Birden fazla içerik için toplu progress getir."""
        result = await self.session.execute(
            select(UserProgress).where(
                UserProgress.user_id == self.user_id,
                UserProgress.content_id.in_(content_ids),
            )
        )
        return result.scalars().all()

    async def upsert_watch_progress(
        self,
        content_id: uuid.UUID,
        completion_percentage: float,
        last_position_seconds: float,
    ) -> UserProgress:
        """
        YouTube IFrame'den gelen izlenme verisiyle progress'i günceller.
        Kayıt yoksa oluşturur (INSERT), varsa günceller (UPDATE).
        Bu çağrı status'ü "completed" yapmaz, sadece yüzdeyi günceller.
        """
        progress = await self.get_progress(content_id)

        if not progress:
            progress = UserProgress(
                user_id=self.user_id,
                content_id=content_id,
                status="in_progress",
                completion_percentage=completion_percentage,
                last_position_seconds=last_position_seconds,
                last_watched_at=datetime.now(timezone.utc),
            )
            self.session.add(progress)
        else:
            # Mevcut yüzdeden daha yüksekse güncelle (ileri sarma durumunu engelle)
            if completion_percentage > progress.completion_percentage:
                progress.completion_percentage = completion_percentage
            progress.last_position_seconds = last_position_seconds
            progress.last_watched_at = datetime.now(timezone.utc)
            if progress.status == "not_started":
                progress.status = "in_progress"

        await self.session.flush()
        return progress

    async def mark_as_completed(self, content_id: uuid.UUID) -> UserProgress:
        """
        Partner "Tamamlandı" butonuna bastığında çağrılır.
        Status'ü "completed" yapar ve completed_at'i set eder.
        """
        progress = await self.get_progress(content_id)

        if not progress:
            progress = UserProgress(
                user_id=self.user_id,
                content_id=content_id,
                status="completed",
                completion_percentage=100.0,
                completed_at=datetime.now(timezone.utc),
                last_watched_at=datetime.now(timezone.utc),
            )
            self.session.add(progress)
        else:
            progress.status = "completed"
            progress.completion_percentage = 100.0
            progress.completed_at = datetime.now(timezone.utc)

        await self.session.flush()
        return progress

    async def mark_as_uncompleted(self, content_id: uuid.UUID) -> Optional[UserProgress]:
        """
        Partner yanlışlıkla tamamlandı işaretlediyse geri alabilir.
        """
        progress = await self.get_progress(content_id)
        if progress:
            progress.status = "in_progress"
            progress.completion_percentage = min(progress.completion_percentage, 90.0)
            progress.completed_at = None
        return progress

    async def get_overall_completion_percentage(
        self,
        tenant_id: uuid.UUID,
        content_type: Optional[str] = None,
    ) -> dict:
        """
        Kullanıcının genel tamamlama yüzdesini hesaplar.
        Admin/Partner dashboard'u için kullanılır.
        """
        from src.datalayer.model.db import AcademyContent, ContentStatus
        from sqlmodel import func

        # Toplam yayınlanan içerik sayısı
        total_query = select(func.count(AcademyContent.id)).where(
            AcademyContent.tenant_id == tenant_id,
            AcademyContent.status == ContentStatus.PUBLISHED,
        )
        if content_type:
            total_query = total_query.where(AcademyContent.type == content_type)

        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0

        if total == 0:
            return {"completed": 0, "total": 0, "percentage": 0.0}

        # Kullanıcının tamamladığı içerik sayısı
        completed_result = await self.session.execute(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == self.user_id,
                UserProgress.status == "completed",
            )
        )
        completed = completed_result.scalar() or 0

        return {
            "completed": completed,
            "total": total,
            "percentage": round((completed / total) * 100, 1),
        }
```

---

## 📄 Adım 2: `src/routes/progress.py` – Backend Endpoint'leri

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, confloat
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_user, get_current_partner
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import User, UserRole
from src.datalayer.repository.progress_repository import ProgressRepository

router = APIRouter(prefix="/progress", tags=["Progress"])


class WatchProgressSchema(BaseModel):
    content_id: uuid.UUID
    completion_percentage: confloat(ge=0.0, le=100.0)
    last_position_seconds: float


class MarkCompleteSchema(BaseModel):
    content_id: uuid.UUID


@router.post("/watch")
async def update_watch_progress(
    data: WatchProgressSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """
    YouTube IFrame API'den gelen periyodik (her 15 sn) izlenme verisi.
    Bu endpoint çok sık çağrılır; hızlı olmalı.
    Sadece 'in_progress' durumunu günceller, 'completed' yapmaz.
    """
    repo = ProgressRepository(db, current_user.id)
    progress = await repo.upsert_watch_progress(
        data.content_id,
        data.completion_percentage,
        data.last_position_seconds,
    )
    return {"status": progress.status, "percentage": progress.completion_percentage}


@router.post("/complete")
async def mark_complete(
    data: MarkCompleteSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """
    Partner "Tamamlandı Olarak İşaretle" butonuna bastığında çağrılır.
    status = "completed" olur; sonraki içeriğin kilidi açılır.
    """
    repo = ProgressRepository(db, current_user.id)
    progress = await repo.mark_as_completed(data.content_id)
    return {"status": progress.status, "completed_at": progress.completed_at}


@router.post("/uncomplete")
async def mark_uncomplete(
    data: MarkCompleteSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Partner yanlışlıkla tamamlandı işaretlediyse geri alabilir."""
    repo = ProgressRepository(db, current_user.id)
    progress = await repo.mark_as_uncompleted(data.content_id)
    if not progress:
        raise HTTPException(status_code=404, detail="İlerleme kaydı bulunamadı.")
    return {"status": progress.status}


@router.get("/my-stats")
async def get_my_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Kullanıcının genel ilerleme istatistiklerini döner.
    Dashboard'daki ilerleme barı için kullanılır.
    """
    repo = ProgressRepository(db, current_user.id)
    shorts_stats = await repo.get_overall_completion_percentage(
        uuid.UUID(tenant_id), "SHORT"
    )
    masterclass_stats = await repo.get_overall_completion_percentage(
        uuid.UUID(tenant_id), "MASTERCLASS"
    )
    return {
        "shorts": shorts_stats,
        "masterclass": masterclass_stats,
    }
```

---

## 📄 Adım 3: `src/routes/favorites.py` – Favori Endpoint'leri

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_partner
from src.datalayer.model.db import Favorite, User

router = APIRouter(prefix="/favorites", tags=["Favorites"])


class FavoriteSchema(BaseModel):
    content_id: uuid.UUID


@router.get("/")
async def get_my_favorites(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Kullanıcının favori içeriklerini döner."""
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id)
    )
    favorites = result.scalars().all()
    return [str(f.content_id) for f in favorites]


@router.post("/")
async def add_favorite(
    data: FavoriteSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """İçeriği favorilere ekler. Zaten favorideyse hata vermez."""
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.content_id == data.content_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Zaten favorilerde."}

    favorite = Favorite(user_id=current_user.id, content_id=data.content_id)
    db.add(favorite)
    return {"message": "Favorilere eklendi."}


@router.delete("/{content_id}")
async def remove_favorite(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """İçeriği favorilerden çıkarır."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.content_id == content_id,
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favori bulunamadı.")
    await db.delete(favorite)
    return {"message": "Favorilerden çıkarıldı."}
```

---

## 📄 Adım 4: Frontend – YouTube IFrame Entegrasyonu

`frontend/src/components/academy/YouTubePlayer.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import apiClient from "@/lib/api-client";

interface YouTubePlayerProps {
  videoUrl: string;
  contentId: string;
  initialPosition?: number;  // "Kaldığın yerden devam et" - saniye cinsinden
  onComplete?: () => void;   // Tamamlama butonu basıldıktan sonra trigger (opsiyonel)
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_\-]{11})/);
  return match ? match[1] : null;
}

export default function YouTubePlayer({
  videoUrl,
  contentId,
  initialPosition = 0,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoId = extractYouTubeId(videoUrl);

  useEffect(() => {
    if (!videoId) return;

    // YouTube IFrame API'yi yükle (zaten yüklüyse tekrar yükleme)
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = initPlayer;
    if (window.YT?.Player) {
      initPlayer();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy();
    };
  }, [videoId]);

  function initPlayer() {
    playerRef.current = new window.YT.Player(`yt-player-${contentId}`, {
      videoId,
      playerVars: {
        start: Math.floor(initialPosition),  // Kaldığın yerden başla
        autoplay: 0,
        rel: 0,          // İlgili video önerileri kapatılır (aynı kanal)
        modestbranding: 1,
      },
      events: {
        onStateChange: handleStateChange,
      },
    });
  }

  function handleStateChange(event: any) {
    const YT_PLAYING = 1;
    const YT_PAUSED = 2;

    if (event.data === YT_PLAYING) {
      // Video oynarken her 15 saniyede bir ilerleme gönder
      intervalRef.current = setInterval(sendProgress, 15000);
    } else {
      // Duraklatıldığında veya bittiğinde interval'ı durdur
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        sendProgress(); // Son pozisyonu hemen gönder
      }
    }
  }

  async function sendProgress() {
    if (!playerRef.current) return;
    const duration = playerRef.current.getDuration();
    const currentTime = playerRef.current.getCurrentTime();
    if (!duration || duration === 0) return;

    const percentage = (currentTime / duration) * 100;

    try {
      await apiClient.post("/progress/watch", {
        content_id: contentId,
        completion_percentage: Math.round(percentage * 10) / 10,
        last_position_seconds: currentTime,
      });
    } catch (e) {
      // Progress gönderilemedi; sessizce geç (kritik değil)
      console.warn("Progress gönderilemedi:", e);
    }
  }

  if (!videoId) {
    return <div className="text-red-500">Geçersiz YouTube URL'si</div>;
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      {/* 16:9 Aspect Ratio Container */}
      <div
        id={`yt-player-${contentId}`}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
```

---

## ✅ Kabul Kriterleri

- [ ] `POST /progress/watch` video oynarken her 15 sn çağrılıyor ve `completion_percentage` güncelleniyor
- [ ] `POST /progress/complete` ile `status = "completed"` oluyor
- [ ] Tamamlanan içeriğin prerequisite'i olan bir sonraki içeriğin kilidi açılıyor
- [ ] `GET /progress/my-stats` Shorts ve Masterclass için ayrı ayrı tamamlama yüzdesi döndürüyor
- [ ] Akademi sayfasına geri dönüldüğünde video `initialPosition` saniyesinden devam ediyor
- [ ] `POST /favorites` ve `DELETE /favorites/{id}` çalışıyor
- [ ] Favori ekleme tekrar çağrılırsa hata vermiyor ("Zaten favorilerde" mesajı geliyor)

---

## 📝 Junior Developer Notları

> **Neden sürekli backend'e gönderiyoruz?** "Kaldığın yerden devam et" özelliği için son izleme pozisyonunu (`last_position_seconds`) kaydetmemiz gerekiyor. Her 15 saniyede bir göndererek bu bilgiyi güncel tutuyoruz.
>
> **Neden YouTube API'yı kullanıyoruz ama tamamlama için değil?** YouTube API videoyu gerçekten izleyip izlemediğini kesin söyleyemez; kullanıcı ileri sarabilir. Bu yüzden "tamamlandı" butonu koyduk – kullanıcı kendi sorumluluğundadır.
>
> **`window.YT` guard neden?** `useEffect` birden fazla component mount/unmount döngüsünde çalışabilir. `window.YT` zaten yüklüyse tekrar `<script>` ekleme.
>
> **Favori endpoint'lerinde tenant kontrolü neden yok?** Favoriler `user_id` bazlı; kullanıcı sadece kendi favorilerini görebilir. Tenant izolasyonu içerik seviyesinde sağlanıyor (Task 6).
