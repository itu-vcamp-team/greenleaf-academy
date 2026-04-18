# Task 1: Hesapların Açılması ve Konfigürasyonlar (Human)

## 🎯 Hedef
Projenin geliştirme ve deployment sürecinde kullanılacak tüm 3. parti servis hesaplarını açmak, yapılandırmak ve geliştirici (Claude/AI) ile paylaşılacak bilgileri hazırlamak.

## ⚠️ Bu Task Ne Zaman Yapılmalı?
Backend geliştirmeye başlanmadan **önce** tamamlanmalıdır.

---

## 📋 1. GitHub Repo Kurulumu

- [ ] **Yeni bir private GitHub reposu oluştur:** `greenleaf-website`
- [ ] **Repo yapısı:**
  ```
  greenleaf-website/
  ├── backend/
  ├── frontend/
  ├── docs/
  └── .github/workflows/
  ```
- [ ] **Branch stratejisi:**
  - `main` → Production (canlı site)
  - `staging` → Test ortamı (isteğe bağlı)
  - `dev` → Geliştirme ortamı
- [ ] **`.gitignore`** dosyasına aşağıdakilerin eklendiğinden emin ol:
  ```
  .env
  .env.local
  __pycache__/
  *.pyc
  .next/
  node_modules/
  ```

---

## 📋 2. Render.com Hesabı ve Servisleri

- [ ] **render.com** adresine git, GitHub hesabınla kayıt ol
- [ ] **Plan:** Professional (aylık ~$25) → Persistent Disk için zorunlu
- [ ] **GitHub Integration:** "Connect GitHub" ile `greenleaf-website` reposuna erişim ver
- [ ] **Şimdi servis oluşturma** (Claude bunu `render.yaml` ile yapacak)
- [ ] Ancak aşağıdaki bilgileri not et; daha sonra gerekecek:
  - Render hesap email adresi
  - Render API Key (hesap ayarlarından)

---

## 📋 3. Resend.com Hesabı ve Domain Doğrulama

Bu servis kayıt onayı, şifre sıfırlama ve tüm sistem maillerini gönderir.

- [ ] **resend.com** adresine git, hesap oluştur (ücretsiz plan başlangıç için yeterli)
- [ ] Giriş yaptıktan sonra sol menüden **"Domains"** sekmesine tıkla
- [ ] **"Add Domain"** → `greenleafakademi.com` yaz → Devam et
- [ ] Resend sana 3 DNS kaydı verecek:

  | Tür | Host | Değer |
  |-----|------|-------|
  | TXT | @ | `v=spf1 include:amazonses.com ~all` (örnek) |
  | CNAME | resend._domainkey | `xxxxxx.dkim.resend.dev` (örnek) |
  | TXT | _dmarc | `v=DMARC1; p=none;` (örnek) |

- [ ] Bu kayıtları Squarespace DNS paneline ekle (adımlar aşağıda)
- [ ] Resend panelinde "Verify" butonuna bas → Yeşil tik çıkana kadar bekle (5-15 dk sürebilir)
- [ ] **"API Keys"** → **"Create API Key"** → İsim: `greenleaf-prod`
- [ ] Oluşturulan API Key'i güvenli bir yere not al (bir daha gösterilmez!)

  ```
  API KEY: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

---

## 📋 4. Squarespace DNS Ayarları (Resend için)

- [ ] squarespace.com → Domains → `greenleafakademi.com` → DNS Settings
- [ ] **"Custom Records"** bölümüne her Resend kaydını ekle:
  - "Add Record" → Type: TXT → Host: @ → Value: (Resend'den gelen SPF değeri)
  - "Add Record" → Type: CNAME → Host: `resend._domainkey` → Value: (Resend'den gelen DKIM değeri)
  - "Add Record" → Type: TXT → Host: `_dmarc` → Value: (Resend'den gelen DMARC değeri)
- [ ] **Kaydet** → 5-15 dakika bekle → Resend'de "Verify" yap

---

## 📋 5. YouTube Kanalı Kurulumu

Akademi videoları YouTube üzerinden "Liste Dışı" (Unlisted) yayınlanacak.

- [ ] **youtube.com** → Google hesabınla giriş yap
- [ ] Sağ üst köşe → profil → **"YouTube Kanalı Oluştur"**
- [ ] Kanal adı: **"Greenleaf Akademi"** (veya kurumsal isim)
- [ ] **Kanal Ayarları:**
  - Profil fotoğrafı: Greenleaf logosu
  - Banner: Kurumsal banner görseli (görsel yoksa boş bırak)
- [ ] **Şimdi video yükleme** (Task 3'te yapılacak)
- [ ] Bu kanalın **URL'sini** not al: `https://youtube.com/@GreenleafAkademi`

---

## 📋 6. Google Drive Klasör Yapısı

Akademi dökümanları (sunumlar, PDF'ler) Drive'da tutulacak, sadece linki sisteme girilecek.

- [ ] **drive.google.com** → Kurumsal Google hesabıyla giriş yap
- [ ] Ana klasör oluştur: **"Greenleaf Akademi – Materyaller"**
- [ ] Alt klasörler:
  ```
  📁 Greenleaf Akademi – Materyaller
  ├── 📁 Shorts – Teknik Detaylar
  ├── 📁 Masterclass – Sunumlar
  └── 📁 Kaynak Merkezi – Genel
  ```
- [ ] **Paylaşım ayarları:**
  - Klasöre sağ tık → Paylaş → **"Bağlantıya sahip herkes"** → **"Görüntüleyici"**
  - ⚠️ **"Düzenleyici" veya "Yorumcu" YAPMA** – sadece görüntüleme yetki ver
  - Bu sayede link bilen herkes önizleyebilir ama indiremez/düzenleyemez

---

## 📋 7. Geliştirici ile Paylaşılacak Bilgiler

Tüm hesaplar açıldıktan sonra aşağıdakileri geliştirme ortamına ekle:

```env
# .env dosyasına eklenecekler:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@greenleafakademi.com
MAIL_FROM_NAME=Greenleaf Akademi
GREENLEAF_GLOBAL_API_URL=https://greenleaf-global.com/office/login
FRONTEND_URL=https://tr.greenleafakademi.com
```

---

## ✅ Kontrol Listesi

Aşağıdakilerin hepsi tamamlandığında bu task biter:

- [ ] GitHub repo oluşturuldu, branch yapısı hazır
- [ ] Render.com hesabı Professional plan
- [ ] Resend.com domain doğrulandı (DNS kayıtları eklendi, yeşil tik)
- [ ] Resend API Key kopyalandı ve güvenli yerde saklandı
- [ ] YouTube kanalı oluşturuldu
- [ ] Google Drive klasör yapısı ve paylaşım ayarları hazır
- [ ] `.env` değerleri geliştirme ortamına girildi

---

## ⚠️ Önemli Notlar

> **Resend ücretsiz plan limitleri:** Aylık 3,000 e-posta ücretsiz. İlk aşamada yeterli. Partner sayısı arttığında Pro plana geç.
>
> **YouTube "Liste Dışı" (Unlisted) nedir?** Video arama sonuçlarında çıkmaz ama linke sahip olan herkes izleyebilir. Sistem içinde sadece link gösterildiği için bu yeterince güvenlidir. 100% private değil, ancak kabul edilebilir.
>
> **Google Drive "görüntüleyici" neden?** İndirme ve düzenlemeyi engellemek için. Ancak kullanıcı ekran görüntüsü alabilir; bu kabul edilmiş bir risk.
