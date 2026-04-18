# Uygulama Sıralaması ve Entegrasyon Planı (todo/execution_order.md)

Bu döküman, Claude (AI) ve İnsan (Gaffar) arasındaki görev dağılımını ve bu görevlerin hangi sırayla yapılacağını gösterir.

## 1. Hafta: Temel Kurulum ve Altyapı
1. **[İnsan]**: [Task 1: Hesapların Açılması](tasks_human/task1_accounts_setup.md)
2. **[Claude]**: [Task 1: Backend Kurulumu](tasks_claude/task1_backend_setup.md) & [Task 5: Frontend Kurulumu](tasks_claude/task5_frontend_setup.md)
3. **[Claude]**: [Task 2: Veritabanı Modelleri](tasks_claude/task2_database_models.md)
4. **[Claude]**: [Task 3: Multi-tenancy Logic](tasks_claude/task3_multi_tenancy_logic.md)
5. **[İnsan]**: [Task 2: Başlangıç Verileri](tasks_human/task2_initial_data.md)

## 2. Hafta: Kimlik Doğrulama ve Güvenlik
6. **[Claude]**: [Task 4: Auth Sistemi](tasks_claude/task4_auth_system.md) & [Task 9: Mailing](tasks_claude/task9_mailing_service.md)
7. **[Claude]**: [Task 12: Güvenlik (Rate Limit/Kick-out)](tasks_claude/task12_security_deployment.md)
8. **[İnsan]**: [Task 3: İçerik Hazırlığı (YouTube/Drive)](tasks_human/task3_content_preparation.md)

## 3. Hafta: Akademi ve Operasyonel Araçlar
9. **[Claude]**: [Task 6: Akademi API](tasks_claude/task6_academy_api.md) & [Task 7: Progress Tracking](tasks_claude/task7_progress_tracking.md)
10. **[Claude]**: [Task 8: Dinamik Takvim](tasks_claude/task8_calendar_api.md)
11. **[Claude]**: [Task 10: Reels Player UI](tasks_claude/task10_reels_player_ui.md)
12. **[Claude]**: [Task 11: Dashboards](tasks_claude/task11_admin_partner_dashboards.md)

## 4. Hafta: Dağıtım ve Final Testler
13. **[Claude]**: [Task 12: Deployment (Render/GitHub Actions)](tasks_claude/task12_security_deployment.md)
14. **[İnsan]**: [Task 4: Domain/DNS](tasks_human/task4_domain_dns.md)
15. **[İnsan]**: [Task 5: Final Test ve Onay](tasks_human/task5_testing_feedback.md)
