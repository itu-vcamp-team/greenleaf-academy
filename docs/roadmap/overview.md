# Proje Yol Haritası ve Kilometre Taşları (roadmap/overview.md)

## Faz 1: Altyapı ve "Dijital Kale" (Hafta 1-3)
**Hedef**: Greenleaf Global Hub için sağlam, güvenli ve çok kiracılı (multi-tenant) temel oluşturmak.
- **Kilometre Taşları**:
    - [ ] **Backend (Python/FastAPI)**: Multi-tenant veritabanı mimarisi ve temel API'ların kurulumu.
    - [ ] **Frontend (Next.js 15)**: Tenant duyarlı (subdomain tabanlı) landing page ve auth ekranları.
    - [ ] **Auth**: Referans kodu ve Partner ID tabanlı kayıt sistemi, Resend.com entegrasyonu.
    - [ ] **Güvenlik**: Redis tabanlı Rate Limiting ve Eşzamanlı Oturum Kontrolü.
- **KPI'lar**: Başarılı tenant izolasyonu, güvenli kayıt akışı.

## Faz 2: Reels Akademi ve Dinamik Takvim (Hafta 4-6)
**Hedef**: Mikro-öğrenme platformunu ve operasyonel araçları devreye almak.
- **Kilometre Taşları**:
    - [ ] **Reels Academy**: YouTube embed tabanlı dikey video oynatıcı ve ilerleme takibi.
    - [ ] **Döküman Yönetimi**: Google Drive entegrasyonu (view-only PDF'ler).
    - [ ] **Dinamik Takvim**: Admin kontrollü etkinlik yönetimi ve Apple/Google takvim senkronizasyonu.
    - [ ] **Aday Takibi**: Partnerler için aday ilerleme dashboard'u.
- **KPI'lar**: > %80 video izlenme oranı, takvim kullanım aktifliği.

## Faz 3: Küresel Genişleme ve SaaS Operasyonu (Hafta 7-9)
**Hedef**: Sistemi farklı bölgelere (Almanya, Fransa vb.) açmak ve operasyonu ölçeklemek.
- **Kilometre Taşları**:
    - [ ] **Çok Dilli İçerik**: 7 dilde içerik yönetim altyapısının admin paneline entegrasyonu.
    - [ ] **Süper Admin Paneli**: Yeni tenant oluşturma ve global ayarların yönetimi.
    - [ ] **Gelişmiş Analitik**: Tenant bazlı büyüme ve etkileşim raporları.
    - [ ] **Performans Optimizasyonu**: Render.com üzerinde tam ölçekli dağıtım ve CDN optimizasyonu.
- **KPI'lar**: Yeni tenant açılış süresi < 1 saat, %99.9 uptime.
