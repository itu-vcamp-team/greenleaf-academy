# Task 3: İçerik Hazırlığı (Human)

## 🎯 Hedef
Akademi sistemine girilecek ilk test ve gerçek eğitim içeriklerini (YouTube videoları + Google Drive dökümanları) hazırlamak, metadatalarını düzenlemek.

## ⚠️ Bu Task Ne Zaman Yapılmalı?
Akademi API'si (Task 6 Claude) tamamlandıktan sonra, admin panelinden içerik girilmeye başlamadan önce.

---

## 📋 1. YouTube Video Yükleme

### Kısa Video (Shorts Formatı – Dikey 9:16)
Akademideki "Shorts" bölümü için kısa, öğretici videolar:

- [x] Minimum **3 adet** Shorts videosu hazırla
- [x] Her video: **2-5 dakika** arası
- [x] Video formatı: **Dikey (9:16 oran)** – telefon çekimi veya düzenleme

### Uzun Video (Masterclass Formatı – Yatay 16:9)
- [x] Minimum **1 adet** Masterclass videosu hazırla
- [x] Süre: **15-60 dakika** arası (daha uzun ve detaylı eğitim)
- [x] Standart yatay (16:9) format

---

## 📋 2. Google Drive Döküman Yükleme

Her videoyla ilişkilendirilecek destek dökümanları:

- [ ] Google Drive → `Greenleaf Akademi – Materyaller` klasörüne yükle
- [ ] Her video için bir ZIP veya PDF (sunum, özet, kaynak)

---

## 📋 3. İçerik Metadata Tablosu

### Shorts İçerikleri

| # | Tür | Başlık | Açıklama (max 500 karakter) | YouTube URL | Google Drive URL | Sıra |
|---|-----|--------|----------------------------|-------------|-----------------|------|
| 1 | SHORT | Greenleaf Vizyonu: Neden Buradayız? | 3 dakikada Greenleaf Akademi'nin kuruluş felsefesi ve iş ortaklarımıza sunduğumuz dijital geleceğe kısa bir bakış. | https://youtube.com/shorts/hJTW3WMxAhc | — (yok) | 1 |
| 2 | SHORT | Başarı İçin İlk 3 Kritik Adım | Eğitime başlarken dikkat etmeniz gereken en önemli 3 kural. Hızlı aksiyon, sürekli öğrenme ve doğru kopyalama. | https://youtube.com/shorts/hJTW3WMxAhc | — (yok) | 2 |
| 3 | SHORT | Partnerlik Süreci ve Yol Haritası | Kayıt işleminden sonra sizi neler bekliyor? Partnerlik seviyeleri ve ilk kazanç planına giden en kısa yol. | https://youtube.com/shorts/hJTW3WMxAhc | — (yok) | 3 |

### Masterclass İçerikleri

| # | Tür | Başlık | Açıklama (max 1000 karakter) | YouTube URL | Google Drive URL | Sıra |
|---|-----|--------|------------------------------|-------------|-----------------|------|
| 1 | MASTERCLASS | Satışın Temelleri ve İtiraz Yönetimi | Müşteri adaylarıyla ilk temas, güven inşası ve en sık karşılaşılan itirazlara karşı profesyonel yaklaşımları içeren kapsamlı eğitim. | https://youtu.be/A8sze3bezaM | — (yok) | 1 |

---

## 📋 4. İçerik Kilitleme Planı (Prerequisite)

Aşağıdaki plan onaylanmıştır:

```
Short 1 → Kilitsiz (herkes girebilir)
Short 2 → Short 1 tamamlandıktan sonra açılır
Short 3 → Short 2 tamamlandıktan sonra açılır
Masterclass 1 → Kilitsiz (herkes girebilir)
```

---

## 📋 5. Kaynak Merkezi Linkleri

| Başlık | Açıklama | Google Drive / Harici URL | Kategori |
|--------|----------|--------------------------|----------|
| Kurumsal Sunum | Greenleaf nedir? | https://drive.google.com/... | Tanıtım |
| İlk Adımlar Rehberi | Yeni partner kılavuzu | https://drive.google.com/... | Eğitim |

---

## 📋 6. İlk Duyurular

| Başlık | İçerik | Öne Çıkar mı? |
|--------|--------|---------------|
| "Greenleaf Akademi'ye Hoş Geldiniz!" | Platform tanıtım mesajı: Dijital eğitim yolculuğumuz başlıyor! | ✅ Evet |
| "İlk Eğitimler Yayında!" | Shorts ve Masterclass serilerimizin ilk bölümleri yüklendi. Hemen izlemeye başlayın. | Hayır |

---

## ✅ Kontrol Listesi

- [x] En az 3 Shorts videosu hazırlandı
- [x] En az 1 Masterclass videosu hazırlandı
- [ ] İlgili Drive dökümanları yüklendi (Opsiyonel - Sonra eklenecek)
- [x] Metadata tablosu dolduruldu
- [x] Kilitleme planı onaylandı
- [ ] Kaynak merkezi dökümanları hazır (Sistem üzerinden eklenecek)
- [x] Açılış duyuruları yazıldı

---

## 📝 Implementation Summary (2026-04-19)
Kullanıcının sağladığı gerçek YouTube linkleri (Shorts1 ve Masterclass1) dökümana işlendi. Shorts 2 ve 3 için görsel linkler yer tutucu olarak kullanıldı. Metadata başlıkları ve açıklamaları onaylandığı şekilde dolduruldu. Bu veriler Akademi API geliştirmesinde test verisi olarak kullanılacaktır.
