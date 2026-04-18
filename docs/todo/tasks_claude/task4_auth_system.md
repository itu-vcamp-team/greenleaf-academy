# Task 4: Kimlik Doğrulama ve Güvenlik Sistemi

## 🎯 Hedef
Çok adımlı kayıt akışı, Greenleaf Global harici API doğrulaması, JWT tabanlı oturum yönetimi, login'de dinamik sayı CAPTCHA, aylık e-posta 2FA ve kick-out mekanizmasını uygulamak.

## ⚠️ Ön Koşullar
- Task 1, 2, 3 tamamlanmış olmalı
- `User`, `ReferenceCode`, `UserSession` modelleri DB'de hazır olmalı
- Resend API Key `.env`'de tanımlı olmalı

---

## 🧠 Sistem Akışına Genel Bakış

### Kayıt Akışı (3 Adım)
```
Adım 1: Temel Bilgiler
  └─► Ad Soyad, Kullanıcı Adı, E-posta, Telefon, Şifre

Adım 2: Greenleaf Global Doğrulama
  └─► Kullanıcı, Greenleaf Global kullanıcı adı + şifresini girer
  └─► Backend → greenleaf-global.com/office/login'e POST atar
  └─► SUCCESS → devam | FAIL → hata göster

Adım 3a: Partner ID var  → Referans Kodu Gir
  └─► Partnerin davetiye kodunu girer
  └─► Kod geçerliyse hesap "pending_approval" durumunda oluşturulur
  └─► Admin onayı sonrası aktif olur

Adım 3b: Partner ID yok → Bekletme Listesi
  └─► Supervisor adı girer
  └─► Waitlist tablosuna kaydedilir
  └─► Admin bu kişiyi görerek referans kodu üretir ve davet eder
```

### Giriş Akışı
```
Kullanıcı adı + Şifre + Ekrandaki dinamik sayılar (CAPTCHA)
  └─► Doğrulandı
        └─► Ayda 1 kez: E-posta 2FA kodu (6 haneli) → kodu gir → token dön
        └─► Diğer günlerde: Direkt token dön
              └─► Eski UserSession kaydı deaktive edilir (kick-out)
              └─► Yeni UserSession kaydı oluşturulur
              └─► Access Token + Refresh Token döner
```

---

## 📄 Adım 1: `src/services/password_service.py` – Şifre İşlemleri

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Şifreyi bcrypt ile hash'ler."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Girilen şifreyi hash ile karşılaştırır."""
    return pwd_context.verify(plain_password, hashed_password)
```

---

## 📄 Adım 2: `src/services/token_service.py` – JWT Yönetimi

```python
import uuid
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from src.config import get_settings

settings = get_settings()

ALGORITHM = "HS256"


def create_access_token(user_id: str, role: str, tenant_id: str, jti: str) -> str:
    """
    Access token oluşturur. Kısa ömürlüdür (varsayılan 60 dakika).
    
    Payload alanları:
      sub: kullanıcı UUID (string)
      role: kullanıcı rolü
      tenant_id: tenant UUID
      jti: benzersiz token ID (kick-out için)
      type: "access"
    """
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "tenant_id": tenant_id,
        "jti": jti,
        "type": "access",
        "exp": expires,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str, jti: str) -> str:
    """Refresh token oluşturur. Uzun ömürlüdür (varsayılan 30 gün)."""
    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "exp": expires,
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Token'ı doğrular ve payload'ı döner.
    Geçersizse JWTError fırlatır.
    """
    try:
        payload = jwt.decode(token, settings.APP_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Geçersiz token: {e}")
```

---

## 📄 Adım 3: `src/services/captcha_service.py` – Dinamik Sayı CAPTCHA

Login ekranında gösterilecek dinamik sayılar. Sunucu tarafında üretilip Redis'te saklanır.

```python
import random
import redis.asyncio as aioredis
from src.config import get_settings

settings = get_settings()
CAPTCHA_TTL_SECONDS = 120  # 2 dakika geçerli


async def generate_login_captcha(session_key: str) -> list[int]:
    """
    4 adet 1-9 arası rastgele sayı üretir.
    Redis'e {session_key} ile saklar.
    Kullanıcıya gösterilecek sayıları döner.
    
    session_key: login öncesi üretilen geçici UUID
    """
    numbers = [random.randint(1, 9) for _ in range(4)]
    expected_sum = sum(numbers)

    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.setex(f"captcha:{session_key}", CAPTCHA_TTL_SECONDS, str(expected_sum))
    await r.aclose()

    return numbers


async def verify_login_captcha(session_key: str, user_answer: int) -> bool:
    """
    Kullanıcının girdiği toplamı Redis'teki beklenen değerle karşılaştırır.
    Doğru ya da yanlış, her kullanımdan sonra Redis kaydını siler (tek kullanım).
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"captcha:{session_key}")
    await r.delete(f"captcha:{session_key}")
    await r.aclose()

    if stored is None:
        return False  # Süresi dolmuş veya hiç oluşturulmamış
    return int(stored) == user_answer
```

> **Önemli Not:** Frontend'de ekranda 4 sayı görünür ve kullanıcıya "Bu sayıların toplamını girin" denir. Kullanıcı toplamı input'a yazar.

---

## 📄 Adım 4: `src/services/greenleaf_global_service.py` – Harici Doğrulama

```python
import aiohttp
from src.config import get_settings
from src.logger import logger

settings = get_settings()


async def verify_greenleaf_global_credentials(username: str, password: str) -> bool:
    """
    Greenleaf Global sistemine HTTP POST atarak kullanıcının
    gerçek bir GL Global üyesi olup olmadığını doğrular.
    
    Başarılı yanıt → True
    Başarısız yanıt veya bağlantı hatası → False
    
    NOT: Greenleaf Global API'nin gerçek response yapısını test ortamında
    doğrulayıp aşağıdaki kontrol mantığını güncelle.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.GREENLEAF_GLOBAL_API_URL,
                json={"username": username, "password": password},
                timeout=aiohttp.ClientTimeout(total=10),
                ssl=True,
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    # API'nin success alanını kontrol et
                    # Gerçek yanıt formatına göre düzenle:
                    return data.get("success") is True or data.get("status") == "ok"
                else:
                    logger.warning(
                        f"Greenleaf Global doğrulama başarısız. "
                        f"HTTP {response.status}"
                    )
                    return False
    except aiohttp.ClientError as e:
        logger.error(f"Greenleaf Global API bağlantı hatası: {e}")
        return False
```

---

## 📄 Adım 5: `src/services/otp_service.py` – E-posta OTP Kodu

```python
import random
import redis.asyncio as aioredis
from src.config import get_settings

settings = get_settings()
OTP_TTL_SECONDS = 600  # 10 dakika geçerli


async def generate_otp(user_id: str) -> str:
    """
    6 haneli OTP kodu üretir ve Redis'e kaydeder.
    Kayıt aktivasyonu ve aylık 2FA için kullanılır.
    """
    code = str(random.randint(100000, 999999))
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.setex(f"otp:{user_id}", OTP_TTL_SECONDS, code)
    await r.aclose()
    return code


async def verify_otp(user_id: str, code: str) -> bool:
    """OTP kodunu doğrular. Doğrulandıktan sonra Redis'ten siler."""
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"otp:{user_id}")
    await r.delete(f"otp:{user_id}")
    await r.aclose()
    return stored is not None and stored == code
```

---

## 📄 Adım 6: `src/services/session_service.py` – Oturum ve Kick-out

```python
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, update
from src.datalayer.model.db import UserSession
from src.config import get_settings

settings = get_settings()


async def create_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    ip_address: str | None,
    device_info: str | None,
) -> tuple[str, str, str]:
    """
    Yeni oturum oluşturur.
    1. Kullanıcının TÜM eski aktif oturumlarını kapatır (kick-out)
    2. Yeni UserSession kaydı oluşturur
    3. Access + Refresh token döner
    
    Returns: (access_token, refresh_token, jti)
    """
    # 1. Eski oturumları kapat (kick-out)
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user_id, UserSession.is_active == True)
        .values(is_active=False)
    )

    # 2. Yeni JTI oluştur
    jti = str(uuid.uuid4())

    # 3. UserSession kaydı oluştur
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session = UserSession(
        user_id=user_id,
        token_jti=jti,
        is_active=True,
        ip_address=ip_address,
        device_info=device_info,
        expires_at=expires_at,
        last_used_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()

    return jti


async def is_session_valid(db: AsyncSession, jti: str) -> bool:
    """
    Her korumalı endpoint'te çağrılır.
    JTI'ya karşılık gelen session aktif mi kontrol eder.
    """
    result = await db.execute(
        select(UserSession).where(
            UserSession.token_jti == jti,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    return result.scalar_one_or_none() is not None
```

---

## 📄 Adım 7: `src/utils/auth_deps.py` – RBAC Dependency'leri

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.token_service import decode_token
from src.services.session_service import is_session_valid
from src.datalayer.database import get_db_session
from src.datalayer.model.db import User, UserRole
from sqlmodel import select

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    Her korumalı endpoint için temel dependency.
    Token'ı decode eder, oturumun hala aktif olduğunu doğrular ve User objesini döner.
    """
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz token")

    jti = payload.get("jti")
    if not await is_session_valid(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum sonlandırıldı. Lütfen tekrar giriş yapın."
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hesap aktif değil.")

    return user


def require_role(*roles: UserRole):
    """
    Belirli rollere erişim kısıtlaması için factory function.
    
    Kullanım:
        @router.get("/admin-only")
        async def admin_endpoint(user = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için yetkiniz yok. Gerekli roller: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


# Hazır kısayollar:
get_current_partner = require_role(UserRole.PARTNER, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPERADMIN)
get_current_admin = require_role(UserRole.ADMIN, UserRole.SUPERADMIN)
get_current_superadmin = require_role(UserRole.SUPERADMIN)
```

---

## 📄 Adım 8: `src/routes/auth.py` – Auth Endpoint'leri

```python
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.services import password_service, token_service, otp_service, captcha_service, greenleaf_global_service, session_service
# Pydantic şemaları (DTO) ayrıca tanımlanacak

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/captcha")
async def get_captcha():
    """
    Login sayfası yüklendiğinde çağrılır.
    Ekranda gösterilecek 4 rastgele sayıyı ve session_key'i döner.
    
    Response:
      { "session_key": "uuid", "numbers": [3, 7, 1, 5] }
    
    Frontend bu sayıları gösterir, kullanıcı toplamını (16) input'a girer.
    """
    import uuid
    session_key = str(uuid.uuid4())
    numbers = await captcha_service.generate_login_captcha(session_key)
    return {"session_key": session_key, "numbers": numbers}


@router.post("/register/step1")
async def register_step1(data: RegisterStep1Schema, db: AsyncSession = Depends(get_db_session)):
    """
    Kayıt Adım 1: Temel bilgiler.
    Kullanıcı adı ve e-posta benzersizliği kontrol edilir.
    Geçici kayıt verisi Redis'e yazılır (henüz DB'ye yazılmaz).
    """
    # 1. Email kontrolü
    # 2. Username kontrolü
    # 3. Geçici veriyi Redis'e yaz: "reg_temp:{session_id}"
    # 4. session_id döner (bir sonraki adım için gerekli)
    ...


@router.post("/register/step2")
async def register_step2(data: RegisterStep2Schema):
    """
    Kayıt Adım 2: Greenleaf Global doğrulama.
    Kullanıcının GL Global hesabını doğrular.
    """
    success = await greenleaf_global_service.verify_greenleaf_global_credentials(
        data.gl_username, data.gl_password
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Greenleaf Global hesabınız doğrulanamadı. Kullanıcı adı veya şifreyi kontrol edin."
        )
    # Redis'teki geçici veriye gl_verified=True ekle
    return {"verified": True}


@router.post("/register/step3")
async def register_step3(
    data: RegisterStep3Schema,
    db: AsyncSession = Depends(get_db_session),
    background_tasks: BackgroundTasks = None,
):
    """
    Kayıt Adım 3: Referans kodu veya waitlist.
    
    - has_partner_id=True: Referans kodunu doğrula, User oluştur (is_active=False),
                           aktivasyon maili gönder
    - has_partner_id=False: Waitlist'e ekle, admin bilgilendirmesi
    """
    ...


@router.post("/register/verify-email")
async def verify_email(data: VerifyEmailSchema, db: AsyncSession = Depends(get_db_session)):
    """
    E-posta OTP doğrulama. is_verified=True yapılır.
    Admin onayını bekler (is_active hala False olabilir).
    """
    ...


@router.post("/login")
async def login(
    data: LoginSchema,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    background_tasks: BackgroundTasks = None,
):
    """
    Giriş akışı:
    1. CAPTCHA doğrula (session_key + user_answer)
    2. Kullanıcıyı bul ve şifreyi doğrula
    3. Hesap aktif mi kontrol et
    4. Aylık 2FA gerekiyor mu kontrol et
       - Gerekiyorsa: OTP gönder → { "requires_2fa": True, "temp_token": "..." }
       - Gerekmiyorsa: Oturum oluştur → { access_token, refresh_token }
    """
    ...


@router.post("/login/verify-2fa")
async def verify_2fa(data: Verify2FASchema, db: AsyncSession = Depends(get_db_session)):
    """
    Aylık 2FA: Kullanıcının e-posta ile gelen 6 haneli kodu girer.
    Doğrulanırsa oturum oluşturulur ve token döner.
    """
    ...


@router.post("/refresh")
async def refresh_token(data: RefreshTokenSchema, db: AsyncSession = Depends(get_db_session)):
    """
    Refresh token ile yeni access token alır.
    Session hala aktif mi kontrol edilir.
    """
    ...


@router.post("/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db_session)):
    """
    Mevcut oturumu (UserSession) is_active=False yapar.
    """
    ...


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordSchema, db: AsyncSession = Depends(get_db_session)):
    """Şifre sıfırlama e-postası gönderir."""
    ...


@router.post("/reset-password")
async def reset_password(data: ResetPasswordSchema, db: AsyncSession = Depends(get_db_session)):
    """OTP kodu ile şifre sıfırlar."""
    ...
```

---

## 📄 Adım 9: `src/datalayer/model/dto/auth_schemas.py` – Pydantic Şemaları

```python
from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterStep1Schema(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone: str | None = None
    password: str
    session_id: str  # Redis'teki geçici kayıt için

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Şifre en az bir büyük harf içermelidir.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Şifre en az bir rakam içermelidir.")
        return v


class RegisterStep2Schema(BaseModel):
    session_id: str
    gl_username: str
    gl_password: str


class RegisterStep3Schema(BaseModel):
    session_id: str
    has_partner_id: bool
    reference_code: str | None = None   # has_partner_id=True ise zorunlu
    supervisor_name: str | None = None  # has_partner_id=False ise opsiyonel


class LoginSchema(BaseModel):
    username: str
    password: str
    session_key: str    # CAPTCHA session key
    captcha_answer: int  # Ekrandaki sayıların toplamı


class VerifyEmailSchema(BaseModel):
    user_id: str
    code: str


class Verify2FASchema(BaseModel):
    temp_token: str  # Login'den dönen geçici token
    code: str        # E-posta ile gelen 6 haneli kod


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    user_id: str
    code: str
    new_password: str
```

---

## ✅ Kabul Kriterleri

- [ ] `POST /auth/captcha` 4 sayı ve `session_key` döndürüyor
- [ ] Yanlış CAPTCHA girişinde login reddediliyor
- [ ] Greenleaf Global doğrulaması başarısız olunca kayıt 2. adımda duruyor
- [ ] Geçersiz referans kodu girilenle hesap oluşturulmuyor
- [ ] Kayıt sonrası e-posta aktivasyon kodu geliyor
- [ ] Aynı kullanıcı 2 farklı cihazdan giriş yapınca ilk cihaz oturumu kick-out oluyor
- [ ] 30 günden geçen oturumda refresh token reddediliyor
- [ ] Aylık 2FA: son `last_2fa_at` 30 günden eskiyse e-posta kodu isteniyor
- [ ] `GET /academy` endpoint'i token olmadan `401` dönüyor
- [ ] Partner rolündeki kullanıcı admin endpoint'ine erişince `403` dönüyor

---

## 📝 Junior Developer Notları

> **Neden CAPTCHA?** Login ekranında dinamik sayılar gösterip kullanıcıya toplamı sorduruyoruz. Bot saldırılarına basit ama etkili bir engel.
>
> **Neden Refresh Token?** Access token kısa ömürlü (60 dk). Kullanıcı her 60 dk'da şifre girmek zorunda kalmasın diye uzun ömürlü refresh token kullanılır.
>
> **`jti` (JWT ID) nedir?** Her token'a özgü benzersiz ID. Kick-out için `UserSession` tablosunda bu ID'yi saklıyoruz. Başka bir cihazdan giriş yapılınca eski `jti`'ye ait session `is_active=False` yapılıyor. Böylece eski token geçersiz oluyor.
>
> **2 adımlı geçici kayıt neden Redis'te?** Kullanıcı Adım 1'i doldurup Adım 2'yi yarım bırakabilir. DB'ye yarım kayıt yazarsak veri kirlenir. Redis'te saklayarak sadece tamamlananlar DB'ye yazılır (TTL 30 dk olabilir).
>
> **Aylık 2FA mantığı:** `User.last_2fa_at` alanı, son 2FA zamanını tutar. Giriş yapılırken `last_2fa_at` + 30 gün < şimdiki zaman ise e-posta kodu istenir.
