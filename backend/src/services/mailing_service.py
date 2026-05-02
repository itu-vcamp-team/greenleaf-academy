import asyncio
import base64
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aioboto3
from botocore.exceptions import ClientError
from arq import create_pool
from arq.connections import RedisSettings

from src.config import get_settings
from src.logger import logger

settings = get_settings()

_arq_pool = None

async def get_arq_pool():
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _arq_pool


class MailingService:
    """
    AWS SES kullanarak HTML e-posta gönderen servis.
    Tüm public metotlar aynı imzayı korur.
    """

    MAIL_FROM_NAME = "Greenleaf Akademi"
    FROM_ADDRESS = f"{MAIL_FROM_NAME} <{settings.MAIL_FROM_ADDRESS}>"

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_mime_message(
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list[dict] | None = None,
    ) -> MIMEMultipart:
        """
        E-posta içeriğini AWS SES'in beklediği MIMEMultipart'a dönüştürür.
        """
        recipients = [to] if isinstance(to, str) else to

        if attachments:
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

        return msg

    @staticmethod
    async def _send_email(
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list[dict] | None = None,
    ) -> bool:
        """Async AWS SES e-posta gönderme katmanı."""
        if not settings.AWS_ACCESS_KEY_ID:
            logger.warning(
                f"AWS_ACCESS_KEY_ID set edilmemiş. "
                f"E-posta atlandı → {to} | Konu: {subject}"
            )
            if settings.APP_ENV == "development":
                logger.debug(f"Email Content (skipped): {html}")
            return True

        msg = MailingService._build_mime_message(to, subject, html, attachments)
        recipients = [to] if isinstance(to, str) else to

        try:
            session = aioboto3.Session(
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_SES_REGION,
            )
            async with session.client("ses") as client:
                await client.send_raw_email(
                    Source=MailingService.FROM_ADDRESS,
                    Destinations=recipients,
                    RawMessage={"Data": msg.as_string()},
                )
            logger.info(f"Email sent successfully to {to} | Subject: {subject}")
            return True
        except ClientError as exc:
            logger.error(f"AWS SES ClientError sending to {to} | {exc}")
            return False
        except Exception as exc:
            logger.error(f"Failed to send email to {to} | Error: {exc}")
            return False

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
        pool = await get_arq_pool()
        success = True
        for i in range(0, len(recipient_emails), BATCH_SIZE):
            batch = recipient_emails[i : i + BATCH_SIZE]
            try:
                await pool.enqueue_job("send_bulk_email_task", batch, f"📢 Yeni Etkinlik: {event_title}", html, None)
            except Exception as e:
                logger.error(f"Failed to enqueue bulk email task: {e}")
                success = False
        return success

    @staticmethod
    async def send_event_update_email(
        recipient_emails: list[str],
        event_title: str,
        event_description: str | None,
        old_start_time: datetime,
        new_start_time: datetime,
        meeting_link: str | None,
        location: str | None,
    ) -> bool:
        """
        RSVP yapmış ve/veya tüm partnerlere etkinlik güncellemesi bildirimini toplu gönderir.
        """
        old_date_str = old_start_time.strftime("%d.%m.%Y %H:%M")
        new_date_str = new_start_time.strftime("%d.%m.%Y %H:%M")

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                    color: #333; border: 1px solid #f0a030; border-radius: 12px; overflow: hidden;">
          <div style="background: #f0a030; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🌿 Greenleaf Akademi</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Etkinlik Güncellendi</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="color: #d08000; margin-top: 0;">📅 Etkinlik Tarihi Değişti</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Takviminize eklediğiniz <strong style="color: #333;">{event_title}</strong> etkinliğinin
              bilgileri <strong>güncellendi</strong>.
            </p>
            <div style="background: #fff8ec; border: 1px solid #f6d08a; border-radius: 8px;
                        padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 14px; color: #888; text-decoration: line-through;">
                <strong>Eski Tarih:</strong> {old_date_str}
              </p>
              <p style="margin: 8px 0 4px; font-size: 15px; color: #333; font-weight: bold;">
                <strong>Yeni Tarih:</strong> {new_date_str}
              </p>
              {f'<p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>📍 Konum:</strong> {location}</p>' if location else ''}
              {f'<p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>🔗 Toplantı:</strong> <a href="{meeting_link}" style="color: #4AA435;">Bağlantıya Git</a></p>' if meeting_link else ''}
            </div>
            <p style="font-size: 13px; color: #888;">
              Lütfen takviminizi buna göre güncelleyiniz.
              Daha fazla bilgi için platformu ziyaret edebilirsiniz.
            </p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="{settings.FRONTEND_URL}/calendar"
                 style="background: #4AA435; color: white; padding: 14px 32px;
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        font-size: 14px; display: inline-block;">
                Takvimi Görüntüle
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center;
                      font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """

        BATCH_SIZE = 50
        pool = await get_arq_pool()
        success = True
        for i in range(0, len(recipient_emails), BATCH_SIZE):
            batch = recipient_emails[i : i + BATCH_SIZE]
            try:
                await pool.enqueue_job("send_bulk_email_task", batch, f"📅 Etkinlik Güncellendi: {event_title}", html, None)
            except Exception as e:
                logger.error(f"Failed to enqueue bulk email task: {e}")
                success = False
        return success

    @staticmethod
    async def send_event_cancellation_email(
        recipient_emails: list[str],
        event_title: str,
        start_time: datetime,
        ics_content: str | None = None,
    ) -> bool:
        """
        RSVP yapmış tüm kullanıcılara etkinlik iptal bildirim e-postası toplu gönderir.
        ics_content sağlanırsa .ics eki olarak eklenir.
        """
        date_str = start_time.strftime("%d.%m.%Y %H:%M")

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                    color: #333; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background: #4AA435; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🌿 Greenleaf Akademi</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Etkinlik Bildirimi</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="color: #c0392b; margin-top: 0;">❌ Etkinlik İptal Edildi</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Üzgünüz, daha önce takvime eklediğiniz
              <strong style="color: #333;">{event_title}</strong> etkinliği
              <strong style="color: #c0392b;">iptal edilmiştir</strong>.
            </p>
            <div style="background: #fdf3f2; border: 1px solid #f5c6c2; border-radius: 8px;
                        padding: 16px; margin: 24px 0;">
              <p style="margin: 4px 0; font-size: 14px; color: #666;">
                <strong>📅 Planlanan Tarih:</strong> {date_str}
              </p>
              <p style="margin: 4px 0; font-size: 14px; color: #c0392b;">
                <strong>Durum:</strong> İptal Edildi
              </p>
            </div>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Bu durumun yarattığı aksaklık için özür dileriz. Yeni etkinlik duyurularından
              haberdar olmak için platformu takip etmeye devam edebilirsiniz.
            </p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="{settings.FRONTEND_URL}/calendar"
                 style="background: #4AA435; color: white; padding: 14px 32px;
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        font-size: 14px; display: inline-block;">
                Diğer Etkinlikleri Gör
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center;
                      font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """

        attachments = None
        if ics_content:
            ics_b64 = base64.b64encode(ics_content.encode("utf-8")).decode("utf-8")
            attachments = [
                {
                    "filename": f"{event_title}_iptal.ics",
                    "content": ics_b64,
                    "content_type": "text/calendar",
                }
            ]

        BATCH_SIZE = 50
        pool = await get_arq_pool()
        success = True
        for i in range(0, len(recipient_emails), BATCH_SIZE):
            batch = recipient_emails[i : i + BATCH_SIZE]
            try:
                await pool.enqueue_job("send_bulk_email_task", batch, f"❌ Etkinlik İptal Edildi: {event_title}", html, attachments)
            except Exception as e:
                logger.error(f"Failed to enqueue bulk email task: {e}")
                success = False
        return success

    @staticmethod
    async def send_email_change_otp_email(to_email: str, code: str, full_name: str) -> bool:
        """Sends an OTP to the NEW e-mail address to confirm an e-mail change request."""
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4AA435;">Greenleaf Akademi – E-posta Adresi Değiştirme</h2>
          <p>Merhaba <strong>{full_name}</strong>,</p>
          <p>Greenleaf Akademi hesabınızda bu e-posta adresini kullanmak için bir talepte bulunuldu.
             Değişikliği onaylamak için aşağıdaki 6 haneli kodu girin:</p>
          <div style="background: #f0f9f4; border: 2px solid #4AA435; border-radius: 8px;
                      padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                         color: #4AA435;">{code}</span>
          </div>
          <p style="color: #666;">Bu kod <strong>15 dakika</strong> geçerlidir.</p>
          <p style="color: #999; font-size: 12px;">
            Bu işlemi siz başlatmadıysanız lütfen bu e-postayı dikkate almayın.
          </p>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
        """
        return await MailingService._send_email(to_email, "E-posta Değiştirme Doğrulama Kodunuz", html)

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
        """Kullanıcıya hesap onay veya red bildirimi gönderir."""
        if is_approved:
            subject = "Greenleaf Akademi – Başvurunuz Onaylandı 🎉"
            html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;
                    border: 1px solid #4AA435; border-radius: 12px; overflow: hidden;">
          <div style="background: #4AA435; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🌿 Greenleaf Akademi</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Başvuru Sonucu</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px;">Merhaba <strong>{full_name}</strong>,</p>
            <p style="font-size: 15px; color: #4AA435; font-weight: bold;">
              ✅ Partnerlik başvurunuz onaylandı!
            </p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Artık Greenleaf Akademi platformuna tam erişiminiz var.
              Tüm eğitimler, canlı etkinlikler ve partner araçlarından yararlanabilirsiniz.
            </p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="{settings.FRONTEND_URL}/dashboard"
                 style="background: #4AA435; color: white; padding: 14px 32px;
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        font-size: 14px; display: inline-block;">
                Platforma Giriş Yap
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center;
                      font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
            """
        else:
            subject = "Greenleaf Akademi – Başvurunuz Hakkında Bilgi"
            reason_block = (
                f'<div style="background:#fff8ec;border:1px solid #f6d08a;border-radius:8px;'
                f'padding:16px;margin:20px 0;">'
                f'<p style="margin:0;font-size:14px;color:#666;"><strong>Açıklama:</strong> {rejection_reason}</p>'
                f'</div>'
            ) if rejection_reason else ""

            html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;
                    border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background: #4AA435; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🌿 Greenleaf Akademi</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Başvuru Sonucu</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px;">Merhaba <strong>{full_name}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Greenleaf Akademi'ye yaptığınız partnerlik başvurusunu inceledik.
              Maalesef bu aşamada başvurunuzu
              <strong style="color: #c0392b;">onaylayamıyoruz</strong>.
            </p>
            {reason_block}
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Bu karar hakkında daha fazla bilgi almak için lütfen bizimle iletişime geçin.
            </p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="{settings.FRONTEND_URL}"
                 style="background: #4AA435; color: white; padding: 14px 32px;
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        font-size: 14px; display: inline-block;">
                Greenleaf Akademi'ye Git
              </a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 15px; text-align: center;
                      font-size: 12px; color: #999;">
            © 2026 Greenleaf Akademi. Tüm hakları saklıdır.
          </div>
        </div>
            """

        return await MailingService._send_email(to_email, subject, html)

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
