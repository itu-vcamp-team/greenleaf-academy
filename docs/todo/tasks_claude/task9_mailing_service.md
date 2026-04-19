# Task 9: Mailing Servisi ve Bildirimler

## 🎯 Hedef
Resend.com SDK'sını kullanarak sistemdeki tüm e-posta gönderimlerini tek bir servis üzerinden yönetmek. HTML şablonları hazırlamak, background task ile asenkron gönderim sağlamak.

## ⚠️ Ön Koşullar
- `RESEND_API_KEY` ve `MAIL_FROM_ADDRESS` `.env`'de tanımlı
- Resend.com panelinde `greenleafakademi.com` domain doğrulanmış (DNS SPF/DKIM kayıtları eklendi)

---

## 📋 Gönderilecek E-posta Listesi

| Mail Türü | Tetikleyici | Alıcı |
|-----------|-------------|-------|
| Aktivasyon Kodu | Kayıt Adım 3 tamamlandı | Yeni kullanıcı |
| Hoşgeldin | Admin onayladı | Yeni partner |
| Şifre Sıfırlama | "Şifremi Unuttum" formu | İlgili kullanıcı |
| Aylık 2FA | Geçen 30 gün, giriş yapıldı | Giriş yapan kullanıcı |
| Takvim Daveti (.ics) | "Takvime Ekle" butonu | Talep eden kullanıcı |
| Etkinlik Duyurusu | Admin "Partnerlere Duyur" basarsa | Tenant'taki tüm aktif partnerler |
| Waitlist Bildirimi | Yeni waitlist başvurusu | Tenant admin'leri |
| Hesap Onay Bildirimi | Admin onayladı/reddetti | İlgili kullanıcı |

---

## 📄 Adım 1: `src/services/mailing_service.py` – Ana Mail Servisi

```python
import resend
from src.config import get_settings
from src.logger import logger

settings = get_settings()
resend.api_key = settings.RESEND_API_KEY

FROM_ADDRESS = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM_ADDRESS}>"


async def _send_email(
    to: str | list[str],
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> bool:
    """
    Temel e-posta gönderimi. Tüm mail fonksiyonları bunu çağırır.
    
    Returns: True gönderim başarılıysa, False ise hata oluştu demektir.
    Hata durumunda exception fırlatmaz; sadece log yazar.
    """
    try:
        params = {
            "from": FROM_ADDRESS,
            "to": [to] if isinstance(to, str) else to,
            "subject": subject,
            "html": html,
        }
        if attachments:
            params["attachments"] = attachments

        resend.Emails.send(params)
        logger.info(f"Mail gönderildi → {to} | Konu: {subject}")
        return True
    except Exception as e:
        logger.error(f"Mail gönderilemedi → {to} | Hata: {e}")
        return False


# ─────────────────────────────────────────────
# 1. AKTİVASYON KODU
# ─────────────────────────────────────────────
async def send_activation_email(to_email: str, code: str, full_name: str) -> bool:
    """Kayıt sonrası e-posta doğrulama kodu gönderir."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Greenleaf Akademi – E-posta Doğrulama</h2>
      <p>Merhaba <strong>{full_name}</strong>,</p>
      <p>Hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
      <div style="background: #f0f9f4; border: 2px solid #2D6A4F; border-radius: 8px;
                  padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                     color: #2D6A4F;">{code}</span>
      </div>
      <p style="color: #666;">Bu kod <strong>10 dakika</strong> geçerlidir.</p>
      <p style="color: #666;">Bu e-postayı siz talep etmediyseniz, bu mesajı yok sayabilirsiniz.</p>
    </div>
    """
    return await _send_email(to_email, "E-posta Doğrulama Kodunuz", html)


# ─────────────────────────────────────────────
# 2. HOŞGELDİN (Admin Onayı Sonrası)
# ─────────────────────────────────────────────
async def send_welcome_email(to_email: str, full_name: str, partner_id: str) -> bool:
    """Admin hesabı onayladıktan sonra gönderilir."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Greenleaf Akademi'ye Hoş Geldiniz! 🌿</h2>
      <p>Merhaba <strong>{full_name}</strong>,</p>
      <p>Hesabınız onaylandı! Artık Greenleaf Akademi'ye tam erişiminiz var.</p>
      <div style="background: #f0f9f4; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Partner ID'niz:</strong>
          <span style="font-size: 18px; color: #2D6A4F; font-weight: bold;">{partner_id}</span>
        </p>
      </div>
      <p>Akademiye erişmek için giriş yapın ve öğrenmeye başlayın.</p>
      <a href="https://tr.greenleafakademi.com/login"
         style="background: #2D6A4F; color: white; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; display: inline-block;">
        Akademiye Git →
      </a>
    </div>
    """
    return await _send_email(to_email, "Hesabınız Onaylandı – Greenleaf Akademi", html)


# ─────────────────────────────────────────────
# 3. ŞİFRE SIFIRLAMA
# ─────────────────────────────────────────────
async def send_password_reset_email(to_email: str, code: str, full_name: str) -> bool:
    """Şifre sıfırlama kodu gönderir."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Şifre Sıfırlama İsteği</h2>
      <p>Merhaba <strong>{full_name}</strong>,</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;
                  padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                     color: #856404;">{code}</span>
      </div>
      <p style="color: #666;">Bu kod <strong>10 dakika</strong> geçerlidir.</p>
      <p style="color: #dc3545;"><strong>Bu isteği siz yapmadıysanız</strong>, hesabınız tehlikede olabilir.
        Hemen şifrenizi değiştirin.</p>
    </div>
    """
    return await _send_email(to_email, "Şifre Sıfırlama – Greenleaf Akademi", html)


# ─────────────────────────────────────────────
# 4. AYLIK 2FA KODU
# ─────────────────────────────────────────────
async def send_monthly_2fa_email(to_email: str, code: str, full_name: str) -> bool:
    """Aylık periyodik kimlik doğrulama kodu gönderir."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Kimlik Doğrulama Kodu</h2>
      <p>Merhaba <strong>{full_name}</strong>,</p>
      <p>Aylık güvenlik doğrulaması için hesabınızı onaylayın.</p>
      <div style="background: #f0f9f4; border: 2px solid #2D6A4F; border-radius: 8px;
                  padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                     color: #2D6A4F;">{code}</span>
      </div>
      <p style="color: #666;">Bu kod <strong>10 dakika</strong> geçerlidir.</p>
    </div>
    """
    return await _send_email(to_email, "Güvenlik Doğrulaması – Greenleaf Akademi", html)


# ─────────────────────────────────────────────
# 5. TAKVİM ETKİNLİK DAVETİ (.ics EKİ)
# ─────────────────────────────────────────────
async def send_calendar_invite_email(
    to_email: str,
    event_title: str,
    ics_content: str,
) -> bool:
    """
    Takvim etkinlik daveti gönderir.
    .ics dosyasını e-posta eki olarak ekler.
    iPhone/Android/Outlook tarafından tanınır.
    """
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Takvim Daveti: {event_title}</h2>
      <p>Etkinlik takviminize eklendi. E-posta ekindeki .ics dosyasını açarak
         takviminize ekleyebilirsiniz.</p>
      <p style="color: #666;">Greenleaf Akademi</p>
    </div>
    """

    # .ics dosyasını base64 ile encode et
    import base64
    ics_bytes = ics_content.encode("utf-8")
    ics_b64 = base64.b64encode(ics_bytes).decode("utf-8")

    attachments = [{
        "filename": f"{event_title}.ics",
        "content": ics_b64,
        "content_type": "text/calendar",
    }]

    return await _send_email(
        to_email,
        f"Takvim Daveti: {event_title}",
        html,
        attachments=attachments,
    )


# ─────────────────────────────────────────────
# 6. ETKİNLİK DUYURUSU (TOPLU)
# ─────────────────────────────────────────────
async def send_event_announcement_email(
    recipient_emails: list[str],
    event_title: str,
    event_description: str | None,
    start_time,
    meeting_link: str | None,
    location: str | None,
) -> bool:
    """
    Tenant'taki tüm aktif partnerlere etkinlik duyurusu gönderir.
    Resend toplu gönderim için "to" array'ini destekler.
    
    ÖNEMLİ: 50'den fazla alıcı varsa, Resend'in sınırlarını aşmamak için
    e-postaları batch'ler halinde gönder (her batch max 50 alıcı).
    """
    start_formatted = start_time.strftime("%d %B %Y, %H:%M")

    details_html = ""
    if location:
        details_html += f"<p>📍 <strong>Konum:</strong> {location}</p>"
    if meeting_link:
        details_html += f'<p>🔗 <strong>Bağlantı:</strong> <a href="{meeting_link}">{meeting_link}</a></p>'

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">📅 Yeni Etkinlik: {event_title}</h2>
      <p><strong>📆 Tarih:</strong> {start_formatted}</p>
      {details_html}
      {f'<p>{event_description}</p>' if event_description else ''}
      <p style="color: #666; font-size: 12px;">Greenleaf Akademi – Bu bildirimi durdurmak için ayarlarınızdan çıkabilirsiniz.</p>
    </div>
    """

    # 50'şer kişilik batch'ler halinde gönder
    BATCH_SIZE = 50
    success = True
    for i in range(0, len(recipient_emails), BATCH_SIZE):
        batch = recipient_emails[i:i + BATCH_SIZE]
        result = await _send_email(batch, f"Yeni Etkinlik: {event_title}", html)
        if not result:
            success = False

    return success


# ─────────────────────────────────────────────
# 7. WAİTLİST BİLDİRİMİ (Admin'e)
# ─────────────────────────────────────────────
async def send_waitlist_notification_to_admin(
    admin_emails: list[str],
    applicant_name: str,
    applicant_email: str,
    supervisor_name: str | None,
) -> bool:
    """Yeni waitlist başvurusu geldiğinde tenant admin'lerine bildirim gönderir."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">🔔 Yeni Üyelik Başvurusu</h2>
      <p>Sisteme yeni bir üyelik başvurusu geldi:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ad Soyad:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{applicant_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>E-posta:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{applicant_email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Supervisor:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{supervisor_name or '—'}</td>
        </tr>
      </table>
      <p>Admin panelinden başvuruyu inceleyebilirsiniz.</p>
    </div>
    """
    return await _send_email(admin_emails, "Yeni Üyelik Başvurusu – Greenleaf Akademi", html)


# ─────────────────────────────────────────────
# 8. HESAP ONAY/RED BİLDİRİMİ
# ─────────────────────────────────────────────
async def send_account_status_email(
    to_email: str,
    full_name: str,
    is_approved: bool,
    rejection_reason: str | None = None,
) -> bool:
    """Admin kullanıcıyı onayladı veya reddetti, kullanıcıya bildirilir."""
    if is_approved:
        subject = "Hesabınız Onaylandı – Greenleaf Akademi"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D6A4F;">✅ Hesabınız Onaylandı!</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Hesabınız onaylandı. Akademiye giriş yapabilirsiniz.</p>
        </div>
        """
    else:
        subject = "Hesap Başvurunuz Hakkında – Greenleaf Akademi"
        reason_text = f"<p><strong>Sebep:</strong> {rejection_reason}</p>" if rejection_reason else ""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Hesap Başvurunuz Değerlendiriliyor</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Başvurunuz şu an için onaylanamamıştır.</p>
          {reason_text}
          <p>Daha fazla bilgi için lütfen bir yetkiliye danışın.</p>
        </div>
        """
    return await _send_email(to_email, subject, html)
```

---

## 📄 Adım 2: Background Task Entegrasyonu

Tüm mail gönderimlerinde `BackgroundTasks` kullanılmalıdır:

```python
# Herhangi bir route'da kullanım örneği:
from fastapi import BackgroundTasks
from src.services.mailing_service import send_activation_email

@router.post("/register/step3")
async def register_step3(
    ...,
    background_tasks: BackgroundTasks,
):
    # ... kullanıcı oluşturma işlemleri ...

    # E-postayı arka planda gönder (response'u bekletme)
    background_tasks.add_task(
        send_activation_email,
        to_email=user.email,
        code=otp_code,
        full_name=user.full_name,
    )

    return {"message": "Kayıt tamamlandı. E-postanızı kontrol edin."}
```

---

## 📄 Adım 3: Resend Domain Doğrulama Adımları

> Bu adımlar **Gaffar tarafından** yapılacaktır (bkz. `tasks_human/task1_accounts_setup.md`).
> Ancak geliştirici olarak neyin yapıldığını bilmek önemlidir:

1. Resend.com → "Domains" → "Add Domain" → `greenleafakademi.com` gir
2. Resend'in verdiği DNS kayıtlarını Squarespace DNS panelinde ekle:
   - `TXT` kaydı: SPF (Spam engelleyici)
   - `CNAME` kaydı: DKIM (Mail imzalama)
   - `TXT` kaydı: DMARC (Politika)
3. "Verify" butonuna bas, DNS yayılması 5-15 dk sürebilir.
4. API Key'i `.env` dosyasına `RESEND_API_KEY` olarak ekle.

---

## ✅ Kabul Kriterleri

- [ ] Kayıt sonrası aktivasyon kodu maili geliyor (spam'e düşmüyor)
- [ ] Admin onayı sonrası hoşgeldin maili geliyor
- [ ] "Şifremi Unuttum" formunda şifre sıfırlama kodu geliyor
- [ ] 30 günlük giriş aralığı test edildiğinde `send_monthly_2fa_email` tetikleniyor
- [ ] "Takvime Ekle" butonunda `.ics` eki olan takvim daveti geliyor
- [ ] "Partnerlere Duyur" → 3 test kullanıcısı için 3 mail gidiyor
- [ ] Hata durumunda (yanlış API key) uygulama çökmüyor, sadece log yazıyor

---

## 📝 Junior Developer Notları

> **Neden BackgroundTasks?** E-posta gönderimi 1-3 saniye sürebilir. Kullanıcıya anında `200 OK` dönmek ve maili arka planda göndermek UX'i iyileştirir.
>
> **Resend için domain neden doğrulanmalı?** `from: noreply@greenleafakademi.com` adresinden mail gönderebilmek için Resend'e bu domainin sahibi olduğunu DNS ile kanıtlaman gerekir. Doğrulanmamış domain'den gönderilen mailler spam'e düşer.
>
> **Toplu mail neden batch'lere bölündü?** Resend API'nin tek seferlik gönderim limiti vardır. 50'şer kişilik gruplar güvenli bir yaklaşımdır.
>
> **HTML template neden inline CSS?** E-posta istemcileri (Gmail, Outlook) `<style>` etiketlerini desteklemez. Tüm CSS `style="..."` şeklinde inline olmalıdır.

---

## 📝 Implementation Summary (2026-04-19)

Mailing Servisi (Task 9) ve projenin genel OO Refactoring'i başarıyla tamamlandı:

### 1. Nesne Yönelimli Yapı
- Tüm backend servisleri (Password, Token, OTP, Captcha, Global, Session, Mailing) **Class (Sınıf)** yapısına taşındı.
- Bağımlılık yönetimi ve kod okunabilirliği iyileştirildi.

### 2. Mailing Entegrasyonu
- **Resend SDK:** sisteme entegre edildi.
- **8 Şablon:** Kayıt aktivasyonundan takvim davetine kadar tüm temel senaryolar için HTML şablonları (inline CSS ile) hazırlandı.
- **Background Tasks:** Mail gönderimleri kullanıcıyı bekletmeyecek şekilde asenkron hale getirildi.

### 3. Hata Giderme ve Stabilizasyon
- `pyjwt` ve `email-validator` bağımlılıkları Docker katmanında çözüldü.
- Catch-all hata yönetimi ile mail servisindeki aksaklıkların API'yi etkilememesi sağlandı.
