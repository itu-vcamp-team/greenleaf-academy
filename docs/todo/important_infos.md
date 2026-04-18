# Önemli Bilgiler (todo/important_infos.md)

## Kullanıcı Rolleri ve Erişim
1. **Süper Admin**: Yeni tenant (bölge) oluşturur, global ayarları yönetir.
2. **Admin**: Kendi tenant'ına ait içerikleri, partnerleri ve etkinlikleri yönetir.
3. **Editor**: Admin'in kısıtlı versiyonu (sadece içerik yönetimi odaklı).
4. **Partner**: Akademiye tam erişim sağlayan, kendi adaylarını takip edebilen üye.
5. **Misafir (Guest)**: Sadece tanıtım içeriklerini görebilen aday.

## Teknik Altyapı Kararları
- **Backend**: Python 3.12+ / FastAPI.
- **Frontend**: Next.js 15+ / Tailwind 4.
- **Veritabanı**: PostgreSQL (Render.com).
- **Önbellek**: Redis (Render Key Value).
- **Depolama**: Render Disk (Ücretli plan) - Görseller için.
- **Video**: YouTube Embed (Liste dışı).
- **Dökümanlar**: Google Drive (Sadece link, indirilemez).
- **Mail**: Resend.com.

## İş Mantığı
- **Kayıt**: Admin tarafından oluşturulan tek seferlik referans kodu + Partner ID (veya supervisor bilgisi) ile başvuru. Admin onayı şart.
- **Multi-tenancy**: Subdomain tabanlı ayrım (`tr.greenleafakademi.com`, `de.greenleafakademi.com`).
- **Oturum**: Eşzamanlı oturum engelleme (Kick-out mekanizması).
- **Akademi**: Reels (Shorts) ve Masterclass formatında video eğitimler.
