import asyncio
import base64
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.config import get_settings
from src.logger import logger

settings = get_settings()

# Gmail API yalnızca e-posta gönderme iznine ihtiyaç duyar
_GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _get_gmail_service():
    """
    OAuth2 refresh token kullanarak kimliği doğrulanmış bir Gmail API servisi döndürür.
    Her çağrıda gerekirse token otomatik olarak yenilenir.
    """
    creds = Credentials(
        token=None,
        refresh_token=settings.GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=_GMAIL_SCOPES,
    )
    # Token süresi dolmuşsa yenile
    creds.refresh(Request())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


class MailingService:
    """
    Gmail API (OAuth2) kullanarak HTML e-posta gönderen servis.
    Resend SDK'nın yerine geçer; tüm public metotlar aynı imzayı korur.
    """

    MAIL_FROM_NAME = "Greenleaf Akademi"
    FROM_ADDRESS = f"{MAIL_FROM_NAME} <{settings.MAIL_FROM_ADDRESS}>"

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_raw_message(
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list[dict] | None = None,
    ) -> dict:
        """
        E-posta içeriğini Gmail API'nin beklediği base64url-encoded 'raw' dict'e dönüştürür.

        attachments formatı (Resend-uyumlu):
            [{"filename": "...", "content": "<base64_string>", "content_type": "..."}]
        """
        recipients = [to] if isinstance(to, str) else to

        if attachments:
            # Ek varsa mixed/alternative iç içe yapı kur
            outer = MIMEMultipart("mixed")
            alt_part = MIMEMultipart("alternative")
            alt_part.attach(MIMEText(html, "html", "utf-8"))
            outer.attach(alt_part)

            for att in attachments:
                raw_bytes = base64.b64decode(att["content"])
                content_type: str = att.get("content_type", "application/octet-stream")
                main_type, sub_type = content_type.split("/", 1)

                part = MIMEBase(main_type, sub_type)
                part.set_payload(raw_bytes)
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=att["filename"],
                )
                outer.attach(part)

            msg = outer
        else:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(html, "html", "utf-8"))

        msg["From"] = MailingService.FROM_ADDRESS
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
        return {"raw": raw}

    @staticmethod
    def _send_sync(
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list[dict] | None = None,
    ) -> bool:
        """
        Senkron Gmail API çağrısı. asyncio executor aracılığıyla çalıştırılır,
        doğrudan çağrılmamalıdır.
        """
        try:
            service = _get_gmail_service()
            body = MailingService._build_raw_message(to, subject, html, attachments)
            service.users().messages().send(userId="me", body=body).execute()
            logger.info(f"Email sent successfully to {to} | Subject: {subject}")
            return True
        except HttpError as exc:
            logger.error(f"Gmail API HttpError sending to {to} | {exc.status_code}: {exc.error_details}")
            return False
        except Exception as exc:
            logger.error(f"Failed to send email to {to} | Error: {exc}")
            return False

    @staticmethod
    async def _send_email(
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list[dict] | None = None,
    ) -> bool:
        """Async e-posta gönderme katmanı. Tüm public metotlar bunu kullanır."""
        if not settings.GMAIL_REFRESH_TOKEN:
            logger.warning(
                f"GMAIL_REFRESH_TOKEN set edilmemiş. "
                f"E-posta atlandı → {to} | Konu: {subject}"
            )
            if settings.APP_ENV == "development":
                logger.debug(f"Email Content (skipped): {html}")
            return True

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: MailingService._send_sync(to, subject, html, attachments),
        )

    # ------------------------------------------------------------------
    # Public email methods (imzalar korundu)
    # ------------------------------------------------------------------

    @staticmethod
    async def send_activation_email(to_email: str, code: str, full_name: str) -> bool:
        """Kayıt 3. adımından sonra e-posta doğrulama için OTP gönderir."""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4AA435;">Greenleaf Akademi – E-posta Doğrulama</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Greenleaf Akademi'ye hoş geldiniz! Hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın:</p>
          <div style="background: #f0f9f4; border: 2px solid #4AA435; border-radius: 8px;
                      padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                         color: #4AA435;">{code}</span>
          </div>
          <p style="color: #666;">Bu kod <strong>10 dakika</strong> geçerlidir.</p>
        </div>
        """
        return await MailingService._send_email(to_email, "E-posta Doğrulama Kodunuz", html)

    @staticmethod
    async def send_welcome_email(to_email: str, full_name: str, partner_id: str) -> bool:
        """Hesap onaylandıktan sonra hoş geldin mesajı gönderir."""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4AA435;">Greenleaf Akademi'ye Hoş Geldiniz! 🌿</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Hesabınız onaylandı! Artık tüm eğitimlere erişebilirsiniz.</p>
          <div style="background: #f0f9f4; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Partner ID'niz:</strong> {partner_id}</p>
          </div>
        </div>
        """
        return await MailingService._send_email(to_email, "Hesabınız Onaylandı", html)

    @staticmethod
    async def send_monthly_2fa_email(to_email: str, code: str, full_name: str) -> bool:
        """Aylık güvenlik doğrulaması için OTP gönderir."""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4AA435;">Güvenlik Doğrulama Kodu</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <div style="background: #f0f9f4; border-radius: 8px; padding: 20px; text-align: center;">
            <span style="font-size: 36px; font-weight: bold; color: #4AA435;">{code}</span>
          </div>
        </div>
        """
        return await MailingService._send_email(to_email, "Güvenlik Doğrulaması", html)

    @staticmethod
    async def send_password_reset_email(to_email: str, code: str, full_name: str) -> bool:
        """Şifre sıfırlama veya değiştirme için OTP gönderir."""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4AA435;">Greenleaf Akademi – Güvenlik Doğrulaması</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Hesabınız için bir şifre sıfırlama veya şifre değiştirme talebinde bulunuldu. Lütfen aşağıdaki 6 haneli kodu kullanın:</p>
          <div style="background: #f0f9f4; border: 2px solid #4AA435; border-radius: 8px;
                      padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                         color: #4AA435;">{code}</span>
          </div>
          <p style="color: #666;">Bu işlem size ait değilse lütfen bu e-postayı dikkate almayın.</p>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """
        return await MailingService._send_email(to_email, "Güvenlik Doğrulama Kodunuz", html)

    @staticmethod
    async def send_calendar_invite_email(to_email: str, event_title: str, ics_content: str) -> bool:
        """Takvim daveti (.ics eki) içeren e-posta gönderir."""
        ics_b64 = base64.b64encode(ics_content.encode("utf-8")).decode("utf-8")
        attachments = [
            {
                "filename": f"{event_title}.ics",
                "content": ics_b64,
                "content_type": "text/calendar",
            }
        ]

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
          <h2 style="color: #4AA435; border-bottom: 2px solid #4AA435; padding-bottom: 10px;">Takvim Daveti 📅</h2>
          <p>Merhaba,</p>
          <p><strong>{event_title}</strong> etkinliği için takvim davetiyeniz ektedir.</p>
          <p>Dosyayı açarak etkinliği saniyeler içinde takviminize kaydedebilirsiniz.</p>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Yeşil bir gelecek için öğrenmeye ve büyümeye devam ediyoruz. Görüşmek üzere!</p>
          </div>
          <p style="font-size: 12px; color: #999;">Greenleaf Akademi Ekibi</p>
        </div>
        """
        return await MailingService._send_email(
            to_email,
            f"📅 Takvim Daveti: {event_title}",
            html,
            attachments=attachments,
        )

    @staticmethod
    async def send_event_announcement_email(
        recipient_emails: list[str],
        event_title: str,
        event_description: str | None,
        start_time: datetime,
        meeting_link: str | None,
        location: str | None,
    ) -> bool:
        """Tüm partnerlere etkinlik duyuru e-postası toplu gönderir."""
        date_str = start_time.strftime("%d.%m.%Y %H:%M")

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #4AA435; border-radius: 12px; overflow: hidden;">
          <div style="background: #4AA435; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Yeni Etkinlik Duyurusu! 🌿</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #4AA435; margin-top: 0;">{event_title}</h2>
            <p style="line-height: 1.6;">{event_description or "Bu heyecan verici etkinlikte sizleri de aramızda görmekten mutluluk duyacağız."}</p>

            <div style="background: #f0f9f4; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 5px 0;"><strong>📅 Tarih:</strong> {date_str}</p>
              {f'<p style="margin: 5px 0;"><strong>📍 Konum:</strong> {location}</p>' if location else ''}
              {f'<p style="margin: 5px 0;"><strong>🔗 Toplantı:</strong> <a href="{meeting_link}" style="color: #4AA435;">Buradan Katılın</a></p>' if meeting_link else ''}
            </div>

            <p style="font-size: 14px; color: #666;">Daha fazla detay için akademi platformuna giriş yapabilirsiniz.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{settings.FRONTEND_URL}/dashboard/calendar"
                 style="background: #4AA435; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                 Etkinliği Görüntüle
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """

        BATCH_SIZE = 50
        success = True
        for i in range(0, len(recipient_emails), BATCH_SIZE):
            batch = recipient_emails[i : i + BATCH_SIZE]
            res = await MailingService._send_email(batch, f"📢 Yeni Etkinlik: {event_title}", html)
            if not res:
                success = False
        return success

    @staticmethod
    async def send_waitlist_notification_to_admin(
        admin_emails: list[str],
        applicant_name: str,
        applicant_email: str,
        supervisor_name: str | None,
    ) -> bool:
        """Yöneticilere yeni üyelik başvurusu bildirir."""
        html = f"<div>Yeni Başvuru: {applicant_name} ({applicant_email})</div>"
        return await MailingService._send_email(admin_emails, "Yeni Üyelik Başvurusu", html)

    @staticmethod
    async def send_account_status_email(
        to_email: str,
        full_name: str,
        is_approved: bool,
        rejection_reason: str | None = None,
    ) -> bool:
        """Kullanıcıya hesap durum güncellemesi bildirir."""
        html = f"<div>Hesap durumunuz güncellendi. Onay: {is_approved}</div>"
        return await MailingService._send_email(to_email, "Hesap Durumu", html)

    @staticmethod
    async def send_account_created_by_admin_email(
        to_email: str,
        full_name: str,
        username: str,
        temp_password: str,
        role: str,
        frontend_url: str,
    ) -> bool:
        """
        Superadmin tarafından manuel oluşturulan hesaplar için
        kullanıcıya gönderilen hoş geldiniz e-postası.
        """
        role_label = "Yönetici (Admin)" if role == "ADMIN" else "Partner"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                    color: #333; border: 1px solid #4AA435; border-radius: 12px; overflow: hidden;">
          <div style="background: #4AA435; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🌿 Greenleaf Akademi</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Hesabınız Oluşturuldu</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px;">Merhaba <strong>{full_name}</strong>,</p>
            <p style="line-height: 1.6; color: #555;">
              Greenleaf Akademi platformuna <strong>{role_label}</strong> rolüyle
              kaydınız bir yönetici tarafından oluşturuldu.
              Aşağıdaki bilgilerle giriş yapabilirsiniz:
            </p>
            <div style="background: #f0f9f4; border: 1px solid #c6e8bc; border-radius: 8px;
                        padding: 20px; margin: 24px 0;">
              <p style="margin: 6px 0; font-size: 14px;">
                <strong>Kullanıcı Adı:</strong>
                <code style="background: #e0f4d8; padding: 2px 6px; border-radius: 4px;">{username}</code>
              </p>
              <p style="margin: 6px 0; font-size: 14px;">
                <strong>Geçici Şifre:</strong>
                <code style="background: #e0f4d8; padding: 2px 6px; border-radius: 4px;">{temp_password}</code>
              </p>
            </div>
            <p style="font-size: 13px; color: #e05c00;">
              ⚠️ Güvenliğiniz için giriş yaptıktan sonra şifrenizi değiştirmenizi önemle tavsiye ederiz.
            </p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="{frontend_url}/login"
                 style="background: #4AA435; color: white; padding: 14px 32px;
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        font-size: 14px; display: inline-block;">
                Giriş Yap
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center;
                      font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """
        return await MailingService._send_email(
            to_email,
            "Greenleaf Akademi – Hesabınız Oluşturuldu",
            html,
        )
