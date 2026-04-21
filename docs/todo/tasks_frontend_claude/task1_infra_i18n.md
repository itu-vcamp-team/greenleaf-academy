# Task 1: Altyapı, Dil & Tenant Yönetimi

Bu görev, frontend projesinin temel navigasyon ve veri katmanını backend iie tam uyumlu ve standartlara uygun hale getirmeyi hedefler.

## 🎯 Hedefler

- [ ] **Dil Yapısı Standardizasyonu (I18n):**
    - `next-intl` içindeki `tr`, `en` gibi kısa kodların `tr-TR`, `en-US` gibi standartlara dönüştürülmesi.
    - URL yapısının `/[locale]/[page]` şeklinde standartlaştırılması.
- [ ] **Dinamik Tenant Entegrasyonu:**
    - `TenantContext` içindeki hardcoded verilerin kaldırılması.
    - Uygulama başlarken `/tenants` API'si üzerinden aktif kiracı konfigürasyonunun (renkler, logo, isim) çekilmesi.
- [ ] **API Client (Axios) Güçlendirme:**
    - `X-Tenant-ID` header'ının tüm isteklere dinamik olarak eklenmesi (Zustand store'dan).
    - Dile duyarlı (`/[locale]/login`) yönlendirme mantığının interceptor'lara eklenmesi.

## 🛠️ Teknik Detaylar

- `src/i18n/routing.ts` güncellenecek.
- `src/store/tenant.store.ts` içindeki mock veriler temizlenecek.
- `next-intl/navigation` kütüphanesinden gelen `Link` bileşeni tüm projeye yayılacak (404 çözümü).

## ✅ Doğrulama

- `/academy`, `/calendar` gibi linklere tıklandığında 404 hatası alınmadığının teyidi.
- Network loglarında tüm isteklerin `X-Tenant-ID` taşıdığının kontrolü.

## Implementasyon Summary
- Dil kodları tr-TR ve en-US olarak standardize edildi.
- Mesaj dosyaları (tr-TR.json, en-US.json) güncellendi.
- next-intl middleware eklenerek 404 yönlendirmeleri çözüldü.
- Navigasyon bileşenleri (@/i18n/navigation) localized hale getirildi.
- Tenant yönetimi backend'den dinamik veri çekecek şekilde refaktör edildi.
