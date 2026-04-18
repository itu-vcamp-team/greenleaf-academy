# Task 3: İçerik Hazırlığı (Human)

## 🎯 Hedef
Akademi sistemine girilecek ilk test ve gerçek eğitim içeriklerini (YouTube videoları + Google Drive dökümanları) hazırlamak, metadatalarını düzenlemek.

## ⚠️ Bu Task Ne Zaman Yapılmalı?
Akademi API'si (Task 6 Claude) tamamlandıktan sonra, admin panelinden içerik girilmeye başlamadan önce.

---

## 📋 1. YouTube Video Yükleme

### Kısa Video (Shorts Formatı – Dikey 9:16)
Akademideki "Shorts" bölümü için kısa, öğretici videolar:

- [ ] Minimum **3 adet** Shorts videosu hazırla
- [ ] Her video: **2-5 dakika** arası
- [ ] Video formatı: **Dikey (9:16 oran)** – telefon çekimi veya düzenleme
- [ ] İçerik önerileri:
  - "Greenleaf'e giriş – 3 dakikada neden buradayız"
  - "Başarı için ilk 3 adım"
  - "Partner nasıl olunur – hızlı anlatım"

**YouTube'a Yükleme Adımları:**
1. youtube.com'a gir → Studio → "İçerik Oluştur" → "Video Yükle"
2. Videoyu seç
3. **Başlık ve açıklama** gir (Türkçe)
4. **Görünürlük:** **"Liste Dışı"** (Unlisted) seç – çok önemli, Public yapma!
5. Yükle → "Paylaş" butonundaki URL'yi kopyala: `https://youtu.be/XXXXXXX`
6. Bu URL'i aşağıdaki tabloya ekle

### Uzun Video (Masterclass Formatı – Yatay 16:9)
- [ ] Minimum **1 adet** Masterclass videosu hazırla
- [ ] Süre: **15-60 dakika** arası (daha uzun ve detaylı eğitim)
- [ ] Standart yatay (16:9) format
- [ ] İçerik önerisi: "Satış temelleri – tam eğitim"

---

## 📋 2. Google Drive Döküman Yükleme

Her videoyla ilişkilendirilecek destek dökümanları:

- [ ] Google Drive → `Greenleaf Akademi – Materyaller` klasörüne yükle
- [ ] Her video için bir ZIP veya PDF (sunum, özet, kaynak)

**Drive Linki Alma:**
1. Drive → Dosyaya sağ tık → "Paylaş"
2. **"Bağlantıya sahip herkes"** → **"Görüntüleyici"** seç
3. "Bağlantıyı Kopyala" → URL'yi kopyala
4. URL formatı: `https://drive.google.com/file/d/XXXXXXX/view`

---

## 📋 3. İçerik Metadata Tablosu

Her içerik için aşağıdaki tabloyu doldur ve geliştiriciye ilet. Admin paneli hazır olunca bu bilgilerle içerik girilecek:

### Shorts İçerikleri

| # | Tür | Başlık | Açıklama (max 500 karakter) | YouTube URL | Google Drive URL | Sıra |
|---|-----|--------|----------------------------|-------------|-----------------|------|
| 1 | SHORT | | | https://youtu.be/... | https://drive.google.com/... | 1 |
| 2 | SHORT | | | https://youtu.be/... | — (yok) | 2 |
| 3 | SHORT | | | https://youtu.be/... | https://drive.google.com/... | 3 |

### Masterclass İçerikleri

| # | Tür | Başlık | Açıklama (max 1000 karakter) | YouTube URL | Google Drive URL | Sıra |
|---|-----|--------|------------------------------|-------------|-----------------|------|
| 1 | MASTERCLASS | | | https://youtu.be/... | https://drive.google.com/... | 1 |

---

## 📋 4. İçerik Kilitleme Planı (Prerequisite)

Hangi içerik hangi içerikten sonra açılsın? Örnek:

```
Short 1 → Kilitsiz (herkes girebilir)
Short 2 → Short 1 tamamlandıktan sonra açılır
Short 3 → Short 2 tamamlandıktan sonra açılır
Masterclass 1 → Kilitsiz (herkes girebilir)
```

Bu planı gözden geçir ve uygunsa onayla ya da değiştir.

---

## 📋 5. Kaynak Merkezi Linkleri

Partnerların faydalanabileceği genel kaynaklar (video ile ilişkili olmayan):

| Başlık | Açıklama | Google Drive / Harici URL | Kategori |
|--------|----------|--------------------------|----------|
| Kurumsal Sunum | Greenleaf nedir? | https://drive.google.com/... | Tanıtım |
| İlk Adımlar Rehberi | Yeni partner kılavuzu | https://drive.google.com/... | Eğitim |

---

## 📋 6. İlk Duyurular

Sistem açıldığında ana sayfada görünecek başlangıç duyuruları:

| Başlık | İçerik | Öne Çıkar mı? |
|--------|--------|---------------|
| "Greenleaf Akademi'ye Hoş Geldiniz!" | Platform tanıtım mesajı | ✅ Evet |
| "İlk Eğitim Yayında!" | Shorts ve Masterclass hazır | Hayır |

---

## ✅ Kontrol Listesi

- [ ] En az 3 Shorts videosu YouTube'a "Liste Dışı" yüklendi
- [ ] En az 1 Masterclass videosu YouTube'a "Liste Dışı" yüklendi
- [ ] İlgili Drive dökümanları yüklendi ve "görüntüleyici" paylaşıma açıldı
- [ ] Metadata tablosu dolduruldu (başlık, açıklama, URL'ler)
- [ ] Kilitleme planı onaylandı
- [ ] Kaynak merkezi dökümanları hazır
- [ ] Açılış duyuruları yazıldı

---

## ⚠️ Önemli Notlar

> **"Liste Dışı" (Unlisted) neden şart?** Public yapılırsa YouTube aramasında çıkar ve sistemi kullanmaksızın herkes izleyebilir. "Liste Dışı" yalnızca linki bilen kişilerin erişimini sağlar.
>
> **Google Drive "görüntüleyici" vs "indirilebilir":** "Görüntüleyici" ayarı dosyayı indirilemez yapar; sadece tarayıcıda önizlenir. Bu projenin temel güvenlik kararlarından biridir.
>
> **Açıklama metinleri önemli:** Akademi arama özelliği, başlık ve açıklama üzerinden çalışır. Açıklamayı detaylı yaz ki arama daha iyi sonuç versin.
