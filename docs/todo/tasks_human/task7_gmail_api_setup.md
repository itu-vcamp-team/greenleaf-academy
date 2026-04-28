# Gmail API Kurulum Rehberi – İnsan Görevi

> Bu belge, Resend → Gmail API geçişi için Google Cloud Console tarafında yapman gereken
> adımları ve tek seferlik `GMAIL_REFRESH_TOKEN` almanı açıklar.

---

## Genel Bakış

Kodda üç yeni env değişkeni kullanılacak:

| Değişken | Nereden Geliyor |
|---|---|
| `GMAIL_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Credentials |
| `GMAIL_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Credentials |
| `GMAIL_REFRESH_TOKEN` | Aşağıdaki adım 4'teki script ile alınır |
| `MAIL_FROM_ADDRESS` | Zaten var (örn. `noreply@greenleafakademi.com`) |

---

## ADIM 1 – Google Cloud Projesi Oluştur

1. Tarayıcında **https://console.cloud.google.com** adresine git.
2. Üstteki proje seçiciye tıkla → **"New Project"** (Yeni Proje).
3. Proje adı: **`greenleaf-mailer`** → **Create** butonuna bas.
4. Oluşturulan projeye geçiş yaptığından emin ol (üstteki dropdown).

---

## ADIM 2 – Gmail API'yi Etkinleştir

1. Sol menüden **"APIs & Services"** → **"Library"** ye tıkla.
2. Arama kutusuna **`Gmail API`** yaz.
3. Çıkan sonuca tıkla → **"Enable"** (Etkinleştir) butonuna bas.
4. API etkinleştikten sonra geri dön.

---

## ADIM 3 – OAuth Consent Screen Ayarla

1. Sol menüden **"APIs & Services"** → **"OAuth consent screen"** e tıkla.
2. User Type: **External** seç → **Create**.
3. Aşağıdaki alanları doldur:

   | Alan | Değer |
   |---|---|
   | App name | Greenleaf Akademi Mailer |
   | User support email | kendi Gmail adresin |
   | Developer contact email | kendi Gmail adresin |

4. **"Save and Continue"** ile devam et (Scopes ve Test Users adımlarını geç, her birinde **"Save and Continue"**).
5. Son sayfada **"Back to Dashboard"** butonuna tıkla.
6. Dashboard'da **"PUBLISH APP"** butonuna bas → **Confirm**.

   > ⚠️ Test modunda 7 günde bir refresh token geçersiz olur.
   > Production'da çalışması için uygulamayı yayınlamak (publish) gerekir.

---

## ADIM 4 – OAuth 2.0 Client ID Oluştur

1. Sol menüden **"APIs & Services"** → **"Credentials"** e tıkla.
2. Üstteki **"+ Create Credentials"** → **"OAuth client ID"** seç.
3. Application type: **"Desktop app"** seç.

   > Not: Sunucu tarafı uygulamalarda "Desktop app" tipi en uygunudur çünkü
   > yönlendirme URI'sı zorunlu değildir.

4. Name: **`greenleaf-mailer-client`** → **Create**.
5. Karşına çıkan pencereden:
   - **Client ID** değerini kopyala → `.env` dosyasına `GMAIL_CLIENT_ID=...` olarak ekle.
   - **Client Secret** değerini kopyala → `.env` dosyasına `GMAIL_CLIENT_SECRET=...` olarak ekle.
6. **"OK"** ile kapat.

---

## ADIM 5 – Refresh Token Al (Tek Seferlik)

İki seçenek var, ikisi de aynı sonucu verir. Hangisi rahatsa onu kullan.

---

### ✅ SEÇENEk A – Tarayıcıdan (Python script olmadan, Kolay)

1. **https://developers.google.com/oauthplayground** adresine git.
2. Sağ üstteki **⚙️ dişli ikonuna** tıkla:
   - ☑ **"Use your own OAuth credentials"** kutusunu işaretle
   - **OAuth Client ID** → Cloud Console'den aldığın değeri yapıştır
   - **OAuth Client secret** → Cloud Console'den aldığın değeri yapıştır
3. Sol panelde aşağı inerek **"Gmail API v1"** yi bul →
   `https://www.googleapis.com/auth/gmail.send` scope'una tıkla → kroşe işareti koy.
4. **"Authorize APIs"** butonuna bas.
5. Açılan sayfada **noreply@greenleafakademi.com** hesabıyla giriş yap, izin ver.
6. Geri dönünce **"Exchange authorization code for tokens"** butonuna bas.
7. Altta beliren JSON içinden `"refresh_token"` değerini kopyala → `.env`'e yapıştır.

---

### SEÇENEk B – Python Script (Terminal tercihliler için)

Proje klasöründe hazır script var; şunu çalıştır:

```bash
pip install google-auth-oauthlib   # bir kez yeterli
cd greenleaf-academy/backend
python get_gmail_refresh_token.py
```

> Script Client ID ve Secret'ı sorar (ya da ortam değişkenlerinden okur),
> tarayıcı açar, izin verdikten sonra terminale `GMAIL_REFRESH_TOKEN=...` değerini basar.

### 5c – Token'ı .env'e ekle

```env
GMAIL_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
GMAIL_REFRESH_TOKEN=1//04xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@greenleafakademi.com
```

### 5d – Render.com Secret Env Variables

Render.com dashboard'unda **Environment** sekmesine git ve üç yeni değişkeni ekle:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

Eski `RESEND_API_KEY` değişkenini silebilirsin (artık kullanılmıyor).

---

## ADIM 6 – Test Et

Backend deploy edildikten sonra kayıt akışını test et:
kayıt sırasında OTP e-postasının `noreply@greenleafakademi.com` adresinden geldiğini doğrula.

---

## Sık Karşılaşılan Sorunlar

| Hata | Çözüm |
|---|---|
| `invalid_grant` | Refresh token geçersiz. Adım 5'i tekrar yap. |
| `insufficientPermissions` | Gmail API scope doğru mu? `gmail.send` scope'u seç. |
| `Daily Limit Exceeded` | Gmail API günlük 1 milyar quota'ya sahip; normalde aşılmaz. |
| Token 7 günde sürüyor | OAuth Consent Screen → App'i "Published" yap (Adım 3, madde 6). |
