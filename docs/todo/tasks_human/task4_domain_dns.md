# Task 4: Domain ve DNS Yönetimi (Human)

## 🎯 Hedef
`greenleafakademi.com` domain'ini Render.com deployment'larına yönlendirmek, alt domain (subdomain) yapılandırmasını tamamlamak ve SSL sertifikasının aktif olduğunu doğrulamak.

## ⚠️ Bu Task Ne Zaman Yapılmalı?
Render.com üzerindeki servisler deploy edilip çalıştıktan sonra (Task 12 Claude tamamlandıktan sonra).

---

## 🧠 DNS Yapısına Genel Bakış

```
greenleafakademi.com          → Frontend (Next.js)
tr.greenleafakademi.com       → TR tenant frontend
api.greenleafakademi.com      → Backend (FastAPI) – opsiyonel
```

Render.com her servis için bir `.onrender.com` URL'si atar. Bizim domain'imizi bu URL'lere yönlendireceğiz.

---

## 📋 Adım 1: Render.com'dan CNAME Değerlerini Al

1. render.com → Dashboard → `greenleaf-frontend` servisine tıkla
2. Sol menüden **"Settings"** → **"Custom Domains"**
3. **"Add Custom Domain"** → `greenleafakademi.com` yaz → Devam et
4. Render, sana bir **CNAME** veya **A kaydı** değeri verir. Bu değeri kopyala:
   ```
   CNAME Target: greenleaf-frontend.onrender.com
   ```
5. Aynı işlemi TR subdomain için tekrar yap:
   - **"Add Custom Domain"** → `tr.greenleafakademi.com`
   ```
   CNAME Target: greenleaf-frontend.onrender.com  (aynı frontend servisi)
   ```

---

## 📋 Adım 2: Squarespace DNS Ayarları

1. **squarespace.com** → Giriş yap → Sol menüden **"Domains"**
2. `greenleafakademi.com` üzerine tıkla → **"DNS Settings"**
3. **"Custom Records"** bölümüne git

### Eklenecek DNS Kayıtları:

**Ana domain (greenleafakademi.com → Frontend):**

| Tür | Host | Değer | TTL |
|-----|------|-------|-----|
| CNAME | www | greenleaf-frontend.onrender.com | 3600 |
| A | @ | (Render'dan gelen IP) | 3600 |

> 💡 Render bazı durumlarda CNAME yerine A kaydı isteyebilir. Render panelinde hangisinin istendiğini kontrol et.

**TR subdomain:**

| Tür | Host | Değer | TTL |
|-----|------|-------|-----|
| CNAME | tr | greenleaf-frontend.onrender.com | 3600 |

**DE subdomain (ileride DE tenant eklenirse):**

| Tür | Host | Değer | TTL |
|-----|------|-------|-----|
| CNAME | de | greenleaf-frontend.onrender.com | 3600 |

4. Her kaydı ekledikten sonra **"Save"** tıkla

---

## 📋 Adım 3: SSL Sertifikası Doğrulama

DNS kayıtları yayıldıktan sonra (genellikle 15 dk – 24 saat arası):

1. Render Dashboard → `greenleaf-frontend` → **"Custom Domains"**
2. Her domain'in yanında **yeşil kilit ikonu** ve "SSL Active" yazısını bekle
3. Tarayıcıda `https://tr.greenleafakademi.com` adresi `🔒` ikonuyla açılıyorsa SSL aktif

**SSL doğrulama kontrolü:**
```bash
# Terminal'de test et:
curl -I https://tr.greenleafakademi.com
# Response'da "HTTP/2 200" ve "x-frame-options: DENY" görünmeli
```

---

## 📋 Adım 4: Yeni Tenant Subdomain Ekleme Rehberi

İleride yeni bir ülke (tenant) açıldığında (örn: Almanya için `de`):

**Adım 1 – Render'da Domain Ekle:**
- Render → `greenleaf-frontend` → Settings → Custom Domains
- "Add Custom Domain" → `de.greenleafakademi.com`
- Verilen CNAME değerini kopyala

**Adım 2 – Squarespace'e CNAME Ekle:**
- DNS Settings → Custom Records
- Type: CNAME | Host: `de` | Value: `greenleaf-frontend.onrender.com`

**Adım 3 – Veritabanına Tenant Kaydı Ekle:**
- Geliştirici (veya SuperAdmin paneli hazırsa admin) yeni tenant'ı DB'ye ekler:
  ```sql
  INSERT INTO tenants (slug, name, is_active, config, ...)
  VALUES ('de', 'Greenleaf Deutschland', true, '{"primary_color": "#2D6A4F"}', ...);
  ```

**Adım 4 – SSL Doğrula:**
- Render otomatik SSL sertifikası oluşturur (24 saat içinde)

---

## ✅ Kontrol Listesi

- [ ] Render'dan frontend CNAME değeri alındı
- [ ] Squarespace'e `@` veya `www` kaydı eklendi (ana domain)
- [ ] Squarespace'e `tr` CNAME kaydı eklendi
- [ ] DNS yayılması beklendi (15 dk – 24 saat)
- [ ] `https://tr.greenleafakademi.com` tarayıcıda açılıyor (🔒 görünüyor)
- [ ] Render panelinde SSL "Active" yazıyor
- [ ] `https://tr.greenleafakademi.com/health` `{"status": "ok"}` döndürüyor

---

## 🔧 Sorun Giderme

**DNS kayıtları eklendi ama site açılmıyor:**
- DNS yayılması 24 saate kadar sürebilir
- Terminal'de `nslookup tr.greenleafakademi.com` çalıştır → CNAME değeri görünüyor mu?
- Squarespace'de kaydın doğru girildiğini kontrol et (nokta ve büyük/küçük harf)

**SSL "Pending" takılı kaldı:**
- DNS henüz yayılmamış olabilir, 1 saat bekle
- Render panelinde "Verify" butonuna bas
- Sorun devam ederse Render destek ekibine bildir

**"ERR_NAME_NOT_RESOLVED" hatası:**
- DNS kaydı henüz yayılmamış. Bekle.
- Eğer 12 saatten fazla geçtiyse Squarespace kaydını kontrol et

---

## ⚠️ Önemli Notlar

> **Squarespace varsayılan A kaydı:** Squarespace kendi A kaydını otomatik oluşturur. Render için eklediğin `@` (ana domain) A kaydı bununla çakışabilir. Squarespace'in varsayılan A kaydını **silmeden** Render'ın kaydını ekle — Squarespace genellikle custom kaydı önceliklendirir.
>
> **`www` vs `@`:** `@` ana domain'i (`greenleafakademi.com`), `www` ise `www.greenleafakademi.com`'u temsil eder. İkisini de ekle.
>
> **Wildcard SSL (`*.greenleafakademi.com`):** Render Professional planında wildcard SSL desteklenir. Her yeni subdomain için ayrıca domain eklemen ve Render'ın SSL oluşturması gerekir (otomatik ama sürebilir).
