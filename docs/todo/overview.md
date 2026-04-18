# Proje Genel Görev Özeti (todo/overview.md)

Bu döküman, Greenleaf Akademi projesinin tüm geliştirme görevlerinin üst düzey durumunu gösterir.
Detaylar için her task'ın kendi dosyasına gidin.

---

## 📦 Ön Hazırlık (Tamamlandı)

| Görev | Sorumlu | Durum |
|-------|---------|-------|
| Ham dökümanları analiz et ve çıkar (`docs-raw/` → `docs/`) | Claude | ✅ Tamamlandı |
| Proje bilgilerini rafine et, yol haritasını çıkar | Claude | ✅ Tamamlandı |
| Teknoloji yığınını finalleştir (Next.js 15, FastAPI, Render) | Claude | ✅ Tamamlandı |
| Veritabanı şeması tasarımı | Claude | ✅ Tamamlandı |
| Açık soruları konsolide et ve yanıtla | Claude | ✅ Tamamlandı |

---

## 🏗️ Faz 1 – Altyapı ve "Dijital Kale" (Hafta 1-3)

**Hedef:** Multi-tenant backend, güvenli auth sistemi, guest landing page.
Referans: [`roadmap/overview.md`](../roadmap/overview.md)

### Claude Görevleri

| # | Görev | Durum | Detay |
|---|-------|-------|-------|
| 1 | Backend proje kurulumu (FastAPI, Docker, config, health check) | ⬜ Bekliyor | [`task1_backend_setup.md`](tasks_claude/task1_backend_setup.md) |
| 2 | Veritabanı modelleri ve Alembic migration (13 model) | ⬜ Bekliyor | [`task2_database_models.md`](tasks_claude/task2_database_models.md) |
| 3 | Multi-tenancy middleware, subdomain çözümleme, Redis cache | ⬜ Bekliyor | [`task3_multi_tenancy_logic.md`](tasks_claude/task3_multi_tenancy_logic.md) |
| 4 | Auth sistemi: 3 adımlı kayıt, GL Global doğrulama, 2FA, kick-out | ⬜ Bekliyor | [`task4_auth_system.md`](tasks_claude/task4_auth_system.md) |
| 5 | Frontend kurulumu: Next.js 15, i18n, tenant tema, mobil nav | ⬜ Bekliyor | [`task5_frontend_setup.md`](tasks_claude/task5_frontend_setup.md) |
| 9 | Mailing servisi: Resend, 8 mail şablonu, broadcast | ⬜ Bekliyor | [`task9_mailing_service.md`](tasks_claude/task9_mailing_service.md) |
| 12 | Güvenlik: Rate limit middleware, CSP/HSTS header'ları, GitHub Actions, Render deploy | ⬜ Bekliyor | [`task12_security_deployment.md`](tasks_claude/task12_security_deployment.md) |

### Human (Gaffar) Görevleri

| # | Görev | Durum | Detay |
|---|-------|-------|-------|
| 1 | Hesapları aç: Render, Resend DNS, YouTube, Google Drive | ⬜ Bekliyor | [`task1_accounts_setup.md`](tasks_human/task1_accounts_setup.md) |
| 2 | Başlangıç verileri: logo, renkler, tenant SQL, KVKK metni | ⬜ Bekliyor | [`task2_initial_data.md`](tasks_human/task2_initial_data.md) |

---

## 🎓 Faz 2 – Akademi ve Operasyonel Araçlar (Hafta 4-6)

**Hedef:** Mikro-öğrenme platformu, takvim, partner dashboard, admin paneli.
Referans: [`roadmap/overview.md`](../roadmap/overview.md)

### Claude Görevleri

| # | Görev | Durum | Detay |
|---|-------|-------|-------|
| 6 | Akademi API: node/kilit sistemi, ILIKE search, guest preview | ⬜ Bekliyor | [`task6_academy_api.md`](tasks_claude/task6_academy_api.md) |
| 7 | İlerleme takibi: YouTube IFrame, manuel tamamlama, favoriler | ⬜ Bekliyor | [`task7_progress_tracking.md`](tasks_claude/task7_progress_tracking.md) |
| 8 | Takvim API: etkinlik CRUD, .ics, WebP görsel, toplu bildirim | ⬜ Bekliyor | [`task8_calendar_api.md`](tasks_claude/task8_calendar_api.md) |
| 10 | Akademi UI: Shorts 9:16 player, Masterclass, breadcrumb, arama | ⬜ Bekliyor | [`task10_reels_player_ui.md`](tasks_claude/task10_reels_player_ui.md) |
| 11 | Yönetim panelleri: Admin, Partner, Duyuru, Kaynak Merkezi, Waitlist | ⬜ Bekliyor | [`task11_admin_partner_dashboards.md`](tasks_claude/task11_admin_partner_dashboards.md) |

### Human (Gaffar) Görevleri

| # | Görev | Durum | Detay |
|---|-------|-------|-------|
| 3 | İçerik hazırlığı: YouTube videoları, Drive dökümanları, metadata tablosu | ⬜ Bekliyor | [`task3_content_preparation.md`](tasks_human/task3_content_preparation.md) |

---

## 🌐 Faz 3 – Küresel Genişleme ve SaaS Operasyonu (Hafta 7-9)

**Hedef:** Çok dilli tenant'lar, SuperAdmin UI, gelişmiş analitik.
Referans: [`roadmap/overview.md`](../roadmap/overview.md)

> ⚠️ **Bu faz için henüz task dosyası oluşturulmamıştır.** Faz 2 tamamlandıktan sonra planlanacak.

### Planlanan Claude Görevleri

| Görev | Açıklama | Durum |
|-------|----------|-------|
| Çok Dilli İçerik Yönetimi | Admin panelinde 7 dil (TR/EN/DE/FR/RU/ES/CN) içerik ekleme, "Güncel Değil" senkronizasyon | 📋 Planlandı |
| SuperAdmin Paneli UI | Yeni tenant oluşturma, global konfigürasyon, tenant listesi ve düzenleme ekranı | 📋 Planlandı |
| Gelişmiş Analitik | Tenant bazlı büyüme grafikleri, etkileşim raporları, içerik tamamlama istatistikleri | 📋 Planlandı |
| Performans Optimizasyonu | Next.js SSR/ISR, Redis cache stratejisi, Render CDN yapılandırması | 📋 Planlandı |
| Worker / Cron Servisi | Hareketsiz GUEST hesap temizleme, scheduled e-posta bildirimleri | 📋 Planlandı |

### Planlanan Human Görevleri

| Görev | Açıklama | Durum |
|-------|----------|-------|
| Yeni Tenant Kurulumu (DE/FR vb.) | DNS ekleme, DB kaydı, ilk içerik | 📋 Planlandı |
| Çeviri İçerikleri | Her dilin video + metadata'sını hazırlama | 📋 Planlandı |

---

## 🚀 Canlıya Geçiş (Faz 2 Sonunda)

| # | Görev | Sorumlu | Durum | Detay |
|---|-------|---------|-------|-------|
| 4 | Domain ve DNS: Squarespace → Render CNAME, SSL | Gaffar | ⬜ Bekliyor | [`task4_domain_dns.md`](tasks_human/task4_domain_dns.md) |
| 5 | Final test: 7 test senaryosu, mobil + desktop | Gaffar | ⬜ Bekliyor | [`task5_testing_feedback.md`](tasks_human/task5_testing_feedback.md) |

---

## 📊 Özet İlerleme

| Faz | Toplam Görev | Tamamlanan | Durum |
|-----|-------------|------------|-------|
| Ön Hazırlık | 5 | 5 | ✅ Tamamlandı |
| Faz 1 – Altyapı | 9 (7 Claude + 2 Human) | 0 | ⬜ Başlanmadı |
| Faz 2 – Akademi | 6 (5 Claude + 1 Human) | 0 | ⬜ Başlanmadı |
| Canlıya Geçiş | 2 (Human) | 0 | ⬜ Başlanmadı |
| Faz 3 – Global | Planlanacak | — | 📋 Planlandı |

---

## 🔗 Faydalı Bağlantılar

| Döküman | Açıklama |
|---------|----------|
| [`execution_order.md`](execution_order.md) | Haftalık görev yürütme sırası |
| [`database_design.md`](database_design.md) | Tüm veritabanı modelleri |
| [`../roadmap/overview.md`](../roadmap/overview.md) | 3 fazlı proje yol haritası |
| [`../roadmap/backend/overview.md`](../roadmap/backend/overview.md) | Backend detay yol haritası |
| [`../roadmap/frontend/overview.md`](../roadmap/frontend/overview.md) | Frontend detay yol haritası |
| [`../project_infos/2_architecture.md`](../project_infos/2_architecture.md) | Sistem mimarisi |
| [`../project_infos/6_tech_stack.md`](../project_infos/6_tech_stack.md) | Teknoloji yığını |
| [`../project_infos/7_project_structure.md`](../project_infos/7_project_structure.md) | Klasör yapısı |
