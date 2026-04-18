# Olay Tetikleyicileri ve Bildirimler (trigger_modes.md)

## 1. Kimlik Doğrulama Olayları
| Olay | Eylem | Kanal |
| --- | --- | --- |
| `USER_REGISTERED` | Referans Kodu Doğrula -> Aktivasyon Kodu Gönder | Resend.com |
| `USER_ACTIVATED` | Karşılama E-postası + Akademi Rehberi | Resend.com |
| `LOGIN_FAILED_5X` | IP Engelleme (15 dk) + Redis Kaydı | Redis / Log |
| `NEW_SESSION_DETECTED` | Eski Oturumu Sonlandır (Kick-out) | WebSocket / Session |

## 2. Akademi ve Etkileşim Tetikleyicileri
| Olay | Eylem | Kanal |
| --- | --- | --- |
| `VIDEO_COMPLETED` | Sonraki İçeriğin Kilidini Aç + İlerleme Kaydet | UI / DB |
| `EVENT_15MIN_START` | Takvim Bildirimi (Kullanıcı Takvimi Üzerinden) | Apple/Google Cal |

## 3. Aday Yönetimi
| Olay | Eylem | Kanal |
| --- | --- | --- |
| `ADAY_PROGRESS_UPDATE` | Partner Paneline İlerleme Bilgisi Yansıt | UI / DB |

## 4. İdari ve Altyapı Tetikleyicileri
| Olay | Eylem | Kanal |
| --- | --- | --- |
| `BACKUP_COMPLETED` | S3'e Doğrulama Hash'i Kaydedildi | CloudWatch |
| `BACKUP_FAILED` | Geliştirici Ekibine Acil Teknik Uyarı | Sentry / PagerDuty |
| `CONTENT_UPDATED` | Kamu Sayfalarının Anlık ISR Re-validasyonu | Next.js API |
