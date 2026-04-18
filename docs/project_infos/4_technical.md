# Güvenlik, Gizlilik ve Uyumluluk (4_technical.md)

## 1. Güvenlik Altyapısı
- **Kimlik Doğrulama**: 2 aşamalı doğrulama (2FA) mail üzerinden gelen kod ile sağlanacaktır.
- **Oturum Yönetimi**: Eşzamanlı oturum kontrolü; bir hesapla yeni bir giriş yapıldığında eski oturum sonlandırılır.
- **API Koruması**: Redis tabanlı Rate Limiting (5 hatalı denemede 15 dk IP bloklama).
- **Veri Güvenliği**: HSTS protokolü zorunlu, tüm bağlantılar HTTPS üzerinden sağlanır.

## 2. Veri Gizliliği ve Şifreleme
- **Görsel Veriler**: Profil fotoğrafları ve etkinlik görselleri Render'ın disk alanı üzerinde saklanacaktır.
- **Hassas Veriler**: Şifreler güvenli algoritmalarla hashlenerek saklanır.
- **Denetim Günlüğü**: Kritik idari işlemler (rol değişikliği, içerik silme vb.) `AuditLog` tablosunda kayıt altına alınır.

## 3. Yasal Uyumluluk (KVKK/GDPR)
- **Hesabımı Sil**: Kullanıcıların tüm verilerini sistemden kalıcı olarak silebileceği yasal buton mevcuttur.
- **Aydınlatma Metni**: Kayıt sırasında onaylanan metnin tarih, saat ve IP bilgisi veritabanında saklanır.
- **Veri İzolasyonu**: Multi-tenant mimari sayesinde her ülkenin (tenant) verisi mantıksal olarak birbirinden ayrılmıştır.
- **Veri Temizliği**: Aktif olmayan "Misafir" hesapları 1 yıl hareketsizlikten sonra otomatik olarak silinecektir.

## 4. Dağıtım ve Süreklilik
- **Platform**: Render.com (Auto-deploy via GitHub).
- **Yedekleme**: Render.com üzerinden günlük otomatik yedekleme ve PITR desteği.
- **E-posta**: Resend.com (SPF, DKIM, DMARC ayarları yapılmış şekilde).
- **Domain Yönetimi**: Tenant domainleri (tr.greenleafakademi.com vb.) Render.com ve Squarespace üzerinden manuel olarak yönetilecektir.
