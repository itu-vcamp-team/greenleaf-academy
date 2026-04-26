# 🚀 Greenleaf Academy — Hetzner Production Deployment Rehberi

> **Hedef kitle:** DevOps bilgisi olmayan, sadece SSH bağlantısı yapabilen geliştiriciler.
> **Sunucu:** Hetzner CX23 · Debian Linux · IP: `178.104.249.164`
> **Stack:** Next.js frontend · FastAPI (Python) backend · PostgreSQL · Redis · Nginx · Docker Compose
> **Domain:** `tr.greenleafakademi.com` (frontend) · `api.greenleafakademi.com` (backend)

---

## 📍 Mevcut Durum (Son Güncelleme)

Sunucuda şimdiye kadar yapılanlar:

```bash
# ✅ SSH ile bağlandı
ssh root@178.104.249.164

# ✅ Sistem güncellendi
apt update && apt upgrade -y

# ✅ Docker kuruldu (convenience script)
curl -fsSL https://get.docker.com | sh

# ✅ Gerekli paketler kuruldu
apt install -y docker-compose-plugin git nano ufw

# ✅ Otomatik güvenlik güncellemeleri aktif edildi
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# ✅ Versiyon kontrolü yapıldı
docker --version
docker compose version
```

**→ Sonraki Adım: [3.3 — deploy Kullanıcısı Oluştur](#33-deploy-kullanıcısı-oluştur-güvenlik-için)**

---

## İçindekiler

1. [Genel Mimari](#1-genel-mimari)
2. [Ön Hazırlık — Yerel Bilgisayar](#2-ön-hazırlık--yerel-bilgisayar)
3. [Sunucu İlk Kurulum](#3-sunucu-i̇lk-kurulum)
4. [Docker Kurulumu](#4-docker-kurulumu)
5. [Projeyi Sunucuya Klonlama](#5-projeyi-sunucuya-klonlama)
6. [Cloudflare Origin Certificate (SSL)](#6-cloudflare-origin-certificate-ssl)
7. [Production .env Dosyası](#7-production-env-dosyası)
8. [next.config.ts Güncelleme (Standalone)](#8-nextconfigts-güncelleme-standalone)
9. [İlk Deploy — Manuel](#9-i̇lk-deploy--manuel)
10. [Veritabanı İlk Veri Yükle](#10-veritabanı-i̇lk-veri-yükle)
11. [GitHub Actions — Otomatik Deploy](#11-github-actions--otomatik-deploy)
12. [Cloudflare DNS & Güvenlik Ayarları](#12-cloudflare-dns--güvenlik-ayarları)
13. [Cloudflare Bot ve Captcha Koruması](#13-cloudflare-bot-ve-captcha-koruması)
14. [Sunucu Bakım Komutları](#14-sunucu-bakım-komutları)
15. [Sorun Giderme](#15-sorun-giderme)

---

## 💻 Yerel Geliştirme (Local Development)

Yerelde geliştirme yaparken frontend'i `npm run dev` ile, backend ve veritabanını ise Docker ile çalıştırmanız önerilir.

### 1. Backend ve Altyapıyı Başlatma
Projenin kök dizininde şu komutu çalıştırın:
```bash
docker compose up -d
```
Bu komut şunları ayağa kaldırır:
- **PostgreSQL**: `localhost:5435` portundan erişilebilir.
- **Redis**: `localhost:6379` portundan erişilebilir.
- **Backend (FastAPI)**: `localhost:8000` portundan erişilebilir (Sıcak yenileme/hot-reload aktiftir).

### 2. Frontend Başlatma
`frontend` klasörüne gidin ve geliştirme sunucusunu başlatın:
```bash
cd frontend
npm run dev
```
Frontend artık `http://localhost:3000` adresinde çalışacaktır.

### 3. pgAdmin 4 ile Veritabanına Bağlanma
Veritabanını görsel olarak yönetmek için pgAdmin 4 kullanabilirsiniz:

1. **pgAdmin'i açın** ve yeni bir Server ekleyin.
2. **Connection** sekmesinde şu bilgileri girin:
   - **Host name/address:** `localhost`
   - **Port:** `5435`
   - **Maintenance database:** `greenleaf_db`
   - **Username:** `greenleaf`
   - **Password:** `greenleaf_dev`
3. Kaydedip bağlanın.

---

## 1. Genel Mimari

```
Kullanıcı (Browser)
       │
       ▼
┌─────────────────┐
│   Cloudflare    │  ← DNS, SSL, Bot koruması, Captcha, DDoS
│  (CDN + WAF)    │
└────────┬────────┘
         │ HTTPS (Cloudflare Origin Cert)
         ▼
┌─────────────────────────────────────────────────┐
│  Hetzner CX23  (178.104.249.164)                │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  Nginx (port 80/443)                     │   │
│  │  ├── tr.greenleafakademi.com → frontend  │   │
│  │  └── api.greenleafakademi.com → backend  │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌──────┐  ┌──────┐  │
│  │Frontend │  │Backend  │  │ PG   │  │Redis │  │
│  │Next.js  │  │FastAPI  │  │ DB   │  │      │  │
│  │:3000    │  │:8000    │  │:5432 │  │:6379 │  │
│  └─────────┘  └─────────┘  └──────┘  └──────┘  │
│           (Docker internal network)             │
└─────────────────────────────────────────────────┘
```

**Önemli:** PostgreSQL ve Redis dışarıya açık **değildir**. Sadece Docker iç ağı üzerinden erişilebilir.

---

## 2. Ön Hazırlık — Yerel Bilgisayar

### 2.1 SSH Anahtarı Oluştur (Mac/Linux)

Eğer daha önce SSH anahtarı oluşturmadıysan:

```bash
ssh-keygen -t ed25519 -C "greenleaf-deploy"
```

Sana şu soruyu sorar:
```
Enter file in which to save the key: 
```
`Enter` bas (varsayılan `~/.ssh/id_ed25519` olarak kaydeder).

Bu komut iki dosya oluşturur:
- `~/.ssh/id_ed25519` → **private key** (kimseyle paylaşma!)
- `~/.ssh/id_ed25519.pub` → **public key** (sunucuya koyacağız)

Public key içeriğini kopyala:
```bash
cat ~/.ssh/id_ed25519.pub
```

### 2.2 Hetzner Cloud Console — SSH Key Ekle

1. [console.hetzner.cloud](https://console.hetzner.cloud) adresine git
2. Sol menüden **Security → SSH Keys → Add SSH Key** tıkla
3. Yukarıdaki `id_ed25519.pub` içeriğini yapıştır, isim ver: `greenleaf-deploy`
4. **Add SSH Key** tıkla

> Eğer sunucun zaten oluşturulmuşsa, SSH key'i console'dan ekleyemezsin. Sunucuya root şifresiyle bağlanıp aşağıdaki adımı uygula:
> ```bash
> # Sunucuda çalıştır:
> echo "ssh-ed25519 AAAA...senin_public_key..." >> ~/.ssh/authorized_keys
> chmod 600 ~/.ssh/authorized_keys
> ```

### 2.3 SSH ile Bağlantı Test Et

```bash
ssh root@178.104.249.164
```

İlk bağlantıda "Are you sure you want to continue connecting?" sorusu gelir, `yes` yaz.

---

## 3. Sunucu İlk Kurulum

SSH ile bağlandıktan sonra aşağıdakileri **sunucuda** çalıştır.

### 3.1 Sistemi Güncelle

```bash
apt-get update && apt-get upgrade -y
```

> Bu komut dakikalar sürebilir. Tamamlanmasını bekle.

### 3.2 Temel Araçları Kur

```bash
apt-get install -y \
  curl \
  git \
  ca-certificates \
  gnupg \
  lsb-release \
  ufw \
  htop \
  nano
```

### 3.3 Deploy Kullanıcısı Oluştur (Güvenlik için)

Root ile çalışmak yerine ayrı bir kullanıcı oluşturalım:

```bash
# deploy kullanıcısı oluştur
adduser deploy
# Şifre: güçlü bir şifre gir (not al!)

# deploy kullanıcısını sudo grubuna ekle
usermod -aG sudo deploy

# SSH key'i deploy kullanıcısına kopyala
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Artık ayrı terminalde test et:
```bash
ssh deploy@178.104.249.164
```

### 3.4 Firewall Ayarla

```bash
# Mevcut kuralları sıfırla
ufw --force reset

# SSH bağlantısını koru (bunu MUTLAKA yap, yoksa kilitlenirsin!)
ufw allow 22/tcp

# HTTP ve HTTPS izin ver (Cloudflare'den gelen trafik)
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall'u etkinleştir
ufw --force enable

# Kuralları kontrol et
ufw status
```

Beklenen çıktı:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 3.5 Swap Alanı Ekle (CX23 için önerilen)

4 GB RAM, Next.js build sırasında yetersiz kalabilir. 2 GB swap ekleyelim:

```bash
# 2GB swap dosyası oluştur
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Yeniden başlatmada da aktif olsun
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Kontrol et
free -h
```

---

## 4. Docker Kurulumu ✅ TAMAMLANDI

> Bu bölüm zaten uygulandı. Referans olarak bırakıldı.

### 4.1 Docker'ı Kur ✅

```bash
# Kullanılan yöntem (convenience script — üretim için geçerli):
curl -fsSL https://get.docker.com | sh

# docker-compose plugin ve diğer araçlar:
apt install -y docker-compose-plugin git nano ufw

# Otomatik güvenlik güncellemeleri:
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 4.2 Docker'ı Test Et ✅

```bash
docker --version        # ✅ Çalışıyor
docker compose version  # ✅ Çalışıyor
```

### 4.3 deploy Kullanıcısını Docker Grubuna Ekle

```bash
# deploy kullanıcısına sudo gerekmeden docker çalıştırma izni ver
usermod -aG docker deploy

# Değişiklik için yeniden bağlan (deploy kullanıcısıyla)
# (Bu adımı 'su - deploy' ile veya SSH'ı yeniden açarak uygulayabilirsin)
```

### 4.4 Docker'ı Sistem Başlangıcında Otomatik Başlat

```bash
systemctl enable docker
systemctl start docker
```

---

## 5. Projeyi Sunucuya Klonlama

### 5.1 GitHub Deploy Key Oluştur (Özel repo için)

> Eğer repon **public** ise bu adımı atlayabilirsin, direkt `git clone` yeterli.

Sunucuda `deploy` kullanıcısı olarak:
```bash
ssh-keygen -t ed25519 -C "hetzner-deploy-key" -f ~/.ssh/github_deploy -N ""
```

Public key'i kopyala:
```bash
cat ~/.ssh/github_deploy.pub
```

GitHub'da:
1. Reponun **Settings → Deploy keys → Add deploy key** kısmına git
2. Kopyaladığın key'i yapıştır
3. **Allow write access** seçeneğini **KAPAT** (deploy key sadece okuma yapmalı)
4. **Add key** tıkla

SSH config dosyasını düzenle:
```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking no
EOF
chmod 600 ~/.ssh/config
```

### 5.2 Proje Klasörü Oluştur ve Klonla

```bash
# Proje dizini oluştur
sudo mkdir -p /opt/greenleaf
sudo chown deploy:deploy /opt/greenleaf

# deploy kullanıcısıyla devam et
su - deploy
cd /opt/greenleaf

# Repoyu klonla (SSH URL ile - özel repo)
git clone git@github.com:KULLANICI_ADI/REPO_ADI.git .
# VEYA (public repo için HTTPS ile):
# git clone https://github.com/KULLANICI_ADI/REPO_ADI.git .

# Klasör yapısını kontrol et
ls -la
```

> `greenleaf-academy/` klasörünün içindeki dosyalar görünüyor olmalı.

---

## 6. Cloudflare Origin Certificate (SSL)

Cloudflare, kendi sunucumuza özel 15 yıl geçerli bir SSL sertifikası oluşturur.  
Bu sertifika sayesinde **Cloudflare ↔ Sunucu** arasındaki trafik şifreli olur.

### 6.1 Origin Certificate Oluştur

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **greenleafakademi.com** seç
2. Sol menü → **SSL/TLS → Origin Server**
3. **Create Certificate** tıkla
4. Ayarlar:
   - **Private key type:** RSA (2048)
   - **Hostnames:** `*.greenleafakademi.com` ve `greenleafakademi.com` (otomatik gelir)
   - **Certificate Validity:** 15 years
5. **Create** tıkla
6. Açılan sayfada **iki içerik** göreceksin:
   - **Origin Certificate** → `cloudflare-origin.pem` olarak kaydedeceğiz
   - **Private Key** → `cloudflare-origin-key.pem` olarak kaydedeceğiz

> ⚠️ **UYARI:** Bu sayfayı kapattıktan sonra Private Key'e bir daha erişemezsin! Hemen kopyala.

### 6.2 Sertifikaları Sunucuya Yükle

Sunucuda `deploy` kullanıcısıyla:

```bash
# SSL klasörü oluştur
mkdir -p /opt/greenleaf/greenleaf-academy/docker/nginx/ssl

# Origin Certificate yapıştır
nano /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin.pem
# Cloudflare'deki "Origin Certificate" içeriğini yapıştır
# Ctrl+X → Y → Enter ile kaydet

# Private Key yapıştır
nano /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin-key.pem
# Cloudflare'deki "Private Key" içeriğini yapıştır
# Ctrl+X → Y → Enter ile kaydet

# İzinleri kısıtla (güvenlik)
chmod 600 /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin-key.pem
chmod 644 /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin.pem
```

---

## 7. Production .env Dosyası

> ⚠️ Bu dosya `.gitignore`'da olduğu için **asla git'e commit edilmez**. Manuel oluşturulur.

Sunucuda:
```bash
nano /opt/greenleaf/greenleaf-academy/.env.prod
```

Aşağıdaki içeriği yapıştır ve **gerçek değerlerle doldur**:

```env
# ── PostgreSQL ────────────────────────────────────────────────────────────────
POSTGRES_USER=greenleaf
POSTGRES_PASSWORD=BURAYA_GUCLU_SIFRE_YAZ   # Örn: openssl rand -hex 32 ile üret
POSTGRES_DB=greenleaf_db

# ── Backend (FastAPI) ─────────────────────────────────────────────────────────
APP_ENV=production
JWT_SECRET_KEY=BURAYA_UZUN_RANDOM_STRING    # openssl rand -hex 64 ile üret
DATABASE_URL=postgresql+asyncpg://greenleaf:POSTGRES_SIFREN@postgres:5432/greenleaf_db
REDIS_URL=redis://redis:6379/0

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

RESEND_API_KEY=re_aLWnZodi_6PhrCwegmRbPA4VNXzKYF14H
MAIL_FROM_ADDRESS=noreply@greenleafakademi.com
MAIL_FROM_NAME=Greenleaf Akademi

GREENLEAF_GLOBAL_API_URL=https://greenleaf-global.com/office/login

UPLOAD_DIR=/var/data/uploads

FRONTEND_URL=https://tr.greenleafakademi.com
CORS_ALLOWED_ORIGIN_REGEX=https?://([a-z0-9-]+\.)*greenleafakademi\.com

# ── Frontend (Next.js) ────────────────────────────────────────────────────────
# Backend'e Docker iç ağı üzerinden erişim (server-side proxy için)
NEXT_PUBLIC_BACKEND_URL=http://backend:8000

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 7.1 Güçlü Şifre ve Secret Üretme

```bash
# PostgreSQL şifresi için:
openssl rand -hex 32

# JWT secret için:
openssl rand -hex 64
```

> Üretilen değerleri kopyalayıp `.env.prod` dosyasına yapıştır.

---

## 8. next.config.ts Güncelleme (Standalone)

Next.js'in Docker ile optimize çalışması için `output: 'standalone'` ayarını etkinleştir.

**Yerel bilgisayarda** `greenleaf-academy/frontend/next.config.ts` dosyasını aç ve `output: 'standalone'` satırını ekle:

```typescript
// greenleaf-academy/frontend/next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",          // ← BU SATIRI EKLE
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
        }/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "img.youtube.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
```

Bu değişikliği commit et ve push'la:
```bash
git add frontend/next.config.ts
git commit -m "feat: add standalone output for Docker production build"
git push origin main
```

Ardından sunucuda kodu güncelle:
```bash
cd /opt/greenleaf/greenleaf-academy
git pull origin main
```

---

## 9. İlk Deploy — Manuel

Her şeyi ilk kez ayağa kaldıralım.

### 9.1 Docker Compose ile Build ve Başlat

```bash
cd /opt/greenleaf/greenleaf-academy

# Container'ları build et ve başlat (arka planda)
docker compose -f docker-compose.prod.yml up -d --build
```

> İlk build 5-15 dakika sürebilir (image'lar indiriliyor, build ediliyor).  
> `--build` olmadan çalıştırırsan yeni Dockerfile değişiklikleri yansımaz.

### 9.2 Container Durumlarını Kontrol Et

```bash
docker compose -f docker-compose.prod.yml ps
```

Beklenen çıktı (tüm satırlar `Up` veya `running` olmalı):
```
NAME                    STATUS          PORTS
greenleaf-nginx-1       running         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
greenleaf-frontend-1    running
greenleaf-backend-1     running
greenleaf-postgres-1    running (healthy)
greenleaf-redis-1       running (healthy)
```

### 9.3 Logları İzle

```bash
# Tüm loglar (canlı):
docker compose -f docker-compose.prod.yml logs -f

# Sadece bir servis:
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 9.4 Hızlı Test

```bash
# Nginx çalışıyor mu? (sunucudan kendine HTTP isteği)
curl -I http://localhost

# Backend health check (Docker iç ağından):
docker compose -f docker-compose.prod.yml exec backend \
  curl -s http://localhost:8000/health || echo "health endpoint yok"
```

---

## 10. Veritabanı İlk Veri Yükle

Migration'lar (`alembic upgrade head`) backend servisi başlarken **otomatik** çalışır.  
Ancak ilk veriyi (seed data) manuel yüklememiz gerekiyor.

```bash
# seed_initial_data.py'yi çalıştır
docker compose -f docker-compose.prod.yml exec backend \
  python seed_initial_data.py

# İsteğe bağlı: tenant seed
docker compose -f docker-compose.prod.yml exec backend \
  python seed_tenant.py
```

> Bu komutlar sadece **bir kez** çalıştırılmalıdır. Tekrar çalıştırırsan duplicate data oluşabilir.

---

## 11. GitHub Actions — Otomatik Deploy

`main` branch'e her commit atıldığında sunucu otomatik olarak güncellenir.

### 11.1 GitHub Secrets Ekle

1. GitHub'da repo sayfasına git
2. **Settings → Secrets and variables → Actions → New repository secret**

Aşağıdaki secret'ları tek tek ekle:

| Secret Adı | Değer |
|------------|-------|
| `SSH_HOST` | `178.104.249.164` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | `~/.ssh/id_ed25519` dosyasının **tüm içeriği** |
| `SSH_PORT` | `22` |

**SSH Private Key içeriğini kopyalamak için (Mac/Linux):**
```bash
cat ~/.ssh/id_ed25519
```
`-----BEGIN OPENSSH PRIVATE KEY-----` ile başlayan ve `-----END OPENSSH PRIVATE KEY-----` ile biten tüm metni kopyala.

### 11.2 Workflow Dosyasını Kontrol Et

Repository'de `.github/workflows/deploy.yml` dosyası zaten oluşturulmuş durumda.  
`main` branch'e push yapınca GitHub Actions otomatik tetiklenir.

### 11.3 Deploy'u Manuel Tetikle (Test için)

1. GitHub reposuna git → **Actions** sekmesi
2. Sol menüde **🚀 Deploy to Hetzner (Production)** tıkla
3. **Run workflow** → **Run workflow** tıkla

### 11.4 Deploy Loglarını İzle

1. **Actions** sekmesinde çalışan/tamamlanan workflow'a tıkla
2. **Deploy via SSH** adımını genişlet
3. Terminal çıktısını canlı izle

---

## 12. Cloudflare DNS & Güvenlik Ayarları

### 12.1 Domain'i Cloudflare'e Ekle (Yapılmadıysa)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Add a Site**
2. `greenleafakademi.com` domain adını gir → **Add site**
3. **Free** plan seç → Continue
4. Mevcut DNS kayıtlarını tara ve devam et
5. Cloudflare sana **nameserver** adresleri verecek (örn: `ada.ns.cloudflare.com`)
6. Domain kayıt sağlayıcında (GoDaddy, Namecheap vs.) **nameserver'ları değiştir**
7. Propagasyon 24-48 saat sürebilir

### 12.2 DNS Kayıtları Ekle

Cloudflare Dashboard → **DNS → Records → Add record**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `tr` | `178.104.249.164` | ✅ Proxied (turuncu bulut) |
| A | `api` | `178.104.249.164` | ✅ Proxied (turuncu bulut) |
| A | `@` | `178.104.249.164` | ✅ Proxied (turuncu bulut) |

> **Proxied** seçili olmalı! Aksi halde Cloudflare koruması devre dışı kalır.

### 12.3 SSL/TLS Modunu Ayarla

**SSL/TLS → Overview** sayfasında:  
→ **Full (strict)** seç

Bu mod, Cloudflare ile sunucu arasındaki trafiği Cloudflare Origin Certificate ile doğrular.

### 12.4 HTTPS Yönlendirme

**SSL/TLS → Edge Certificates**:
- **Always Use HTTPS:** ✅ ON
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** ✅ ON
- **Automatic HTTPS Rewrites:** ✅ ON
- **HSTS:** Enable (max-age 6 months, include subdomains)

---

## 13. Cloudflare Bot ve Captcha Koruması

### 13.1 Bot Fight Mode

**Security → Bots**:
- **Bot Fight Mode:** ✅ ON (ücretsiz, otomatik bot trafiğini engeller)
- **Super Bot Fight Mode** (Pro plan gerektirir): İsteğe bağlı

### 13.2 WAF (Web Application Firewall) Kuralları

**Security → WAF → Custom rules → Create rule**:

#### Kural 1: Ülke Kısıtlaması (İsteğe bağlı)
Sadece Türkiye'den erişim için:
```
Field: Country
Operator: does not equal
Value: Turkey

Action: Block
```

#### Kural 2: Kötü Bot User-Agent'ları Engelle
```
Field: User Agent
Operator: contains
Value: scrapy

Action: Block
```

#### Kural 3: Rate Limiting — IP başına istek limiti
**Security → WAF → Rate limiting rules → Create**:
- Name: `API Rate Limit`
- URL: `api.greenleafakademi.com/*`
- Requests: `100` per `minute`
- Action: Block for `1 hour`

### 13.3 Cloudflare Turnstile (Captcha — Ücretsiz)

Turnstile, Google reCAPTCHA'nın Cloudflare alternatifidir. Kullanıcı dostu, gizlilik odaklıdır.

#### Dashboard'da Widget Oluştur:

1. Cloudflare Dashboard → **Turnstile** (sol menü)
2. **Add Site** tıkla
3. Site bilgileri:
   - Site name: `Greenleaf Academy`
   - Domain: `tr.greenleafakademi.com`  
   - Widget Mode: **Managed** (otomatik, kullanıcı görünmez)
4. **Create** tıkla
5. Sana iki key verecek:
   - **Site Key** (frontend'de kullanılır) — `0x4AAAA...`
   - **Secret Key** (backend'de kullanılır) — gizli tut!

#### Frontend — Turnstile Entegrasyonu:

```bash
# Frontend klasöründe:
npm install @marsidev/react-turnstile
```

Login formuna ekle (örnek):
```tsx
import { Turnstile } from "@marsidev/react-turnstile";

// Form içinde:
<Turnstile
  siteKey="SITE_KEY_BURAYA"   // Cloudflare'den aldığın Site Key
  onSuccess={(token) => setTurnstileToken(token)}
/>
```

#### Backend — Token Doğrulama:

Backend `.env.prod` dosyasına ekle:
```env
CLOUDFLARE_TURNSTILE_SECRET=SECRET_KEY_BURAYA
```

`backend/src/services/captcha_service.py` dosyasında (zaten mevcut):
```python
# captcha_service.py zaten Cloudflare Turnstile doğrulamasını destekliyor
# sadece CLOUDFLARE_TURNSTILE_SECRET env var'ı gerekiyor
```

### 13.4 DDoS Koruması

**Security → DDoS** — Cloudflare Free plan bile otomatik DDoS koruması sağlar.

### 13.5 Security Level

**Security → Settings → Security Level:**  
→ **Medium** (varsayılan — bırakabilirsin)  
→ **High** (daha katı — false positive artabilir)

### 13.6 Sunucuya Sadece Cloudflare'den Erişim (Önerilen)

Cloudflare'in IP aralıklarını whitelist'e alarak doğrudan sunucu IP'ye erişimi engelle:

```bash
# Sunucuda çalıştır:

# Önce tüm HTTP/HTTPS trafiği kapat
ufw delete allow 80/tcp
ufw delete allow 443/tcp

# Sadece Cloudflare IP'lerine izin ver
# IPv4:
for ip in \
  103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 \
  104.16.0.0/13 104.24.0.0/14 108.162.192.0/18 \
  131.0.72.0/22 141.101.64.0/18 162.158.0.0/15 \
  172.64.0.0/13 173.245.48.0/20 188.114.96.0/20 \
  190.93.240.0/20 197.234.240.0/22 198.41.128.0/17; do
  ufw allow from $ip to any port 80,443 proto tcp
done

ufw reload
ufw status
```

---

## 14. Sunucu Bakım Komutları

Günlük kullanımda ihtiyaç duyacağın komutlar.

### Container Yönetimi

```bash
# Tüm servislerin durumunu gör
docker compose -f docker-compose.prod.yml ps

# Canlı logları izle
docker compose -f docker-compose.prod.yml logs -f

# Sadece son 100 satır log
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Tüm servisleri yeniden başlat
docker compose -f docker-compose.prod.yml restart

# Sadece bir servisi yeniden başlat
docker compose -f docker-compose.prod.yml restart backend

# Servisleri durdur
docker compose -f docker-compose.prod.yml down

# Servisleri durdur ve volume'ları da sil (DİKKATLİ! Veri silinir)
docker compose -f docker-compose.prod.yml down -v
```

### Manuel Deploy (GitHub Actions yerine)

```bash
cd /opt/greenleaf/greenleaf-academy
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f
```

### Veritabanı İşlemleri

```bash
# PostgreSQL'e bağlan
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U greenleaf -d greenleaf_db

# Migration çalıştır
docker compose -f docker-compose.prod.yml exec backend \
  alembic upgrade head

# Veritabanı yedeği al
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U greenleaf greenleaf_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Disk Kullanımı

```bash
# Disk durumu
df -h

# Docker ne kadar yer kaplıyor
docker system df

# Kullanılmayan Docker kaynaklarını temizle (container, image, network, cache)
docker system prune -a -f
```

### Sunucu Kaynakları İzleme

```bash
# CPU ve RAM kullanımı (interaktif)
htop

# Container başına kaynak kullanımı
docker stats

# Çıkmak için: Ctrl+C
```

---

## 15. Sorun Giderme

### Container başlamıyor

```bash
# Detaylı log gör
docker compose -f docker-compose.prod.yml logs backend

# Container'a gir ve kendin bak
docker compose -f docker-compose.prod.yml exec backend bash
```

### ".env.prod: no such file" hatası

```bash
ls /opt/greenleaf/greenleaf-academy/.env.prod
# Dosya yoksa: 7. bölüme git ve oluştur
```

### SSL sertifikası hatası

```bash
ls /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/
# cloudflare-origin.pem ve cloudflare-origin-key.pem olmalı
# Yoksa: 6. bölüme git
```

### "502 Bad Gateway" hatası

Backend veya frontend container'ı çalışmıyordur:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs backend
```

### GitHub Actions deploy başarısız

1. Actions sekmesinde kırmızı X'e tıkla
2. Hata mesajını oku
3. Genellikle: SSH key yanlış, sunucuda git pull izni yok, disk dolu

Disk doluysa:
```bash
docker system prune -a -f   # Docker cache temizle
```

### Nginx konfigürasyon hatası

```bash
# Nginx config'i test et
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Nginx'i yeniden yükle (restart gerektirmez)
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 📁 Proje Dosya Yapısı (deployment ile ilgili)

```
greenleaf-academy/
├── docker-compose.prod.yml          # ← Production Docker Compose
├── .env.prod                        # ← Sunucuda manuel oluştur (git'e commit ETME)
├── backend/
│   └── Dockerfile                   # ← Backend Docker image
├── frontend/
│   ├── Dockerfile                   # ← Frontend Docker image (multi-stage)
│   └── next.config.ts               # ← output: 'standalone' eklendi
├── docker/
│   └── nginx/
│       ├── nginx.conf               # ← Nginx reverse proxy konfigürasyonu
│       └── ssl/                     # ← Cloudflare Origin sertifikaları (sunucuda oluştur)
│           ├── cloudflare-origin.pem
│           └── cloudflare-origin-key.pem
└── .github/
    └── workflows/
        └── deploy.yml               # ← GitHub Actions otomatik deploy
```

---

## ✅ Deployment Checklist

İlk deployment için adımları bu sıraya göre uygula:

- [x] **2.1** SSH anahtarı oluştur (yerel bilgisayar)
- [x] **2.2** Sunucuya SSH key eklendi / SSH bağlantısı kuruldu
- [x] **3.1** Sunucuya SSH ile bağlandı, `apt update && apt upgrade -y` çalıştırıldı
- [x] **3.2** Temel araçlar kuruldu (`git nano ufw` + `unattended-upgrades`)
- [ ] **3.3** `deploy` kullanıcısı oluştur  ← **ŞU AN BURADASIN**
- [ ] **3.4** Firewall ayarla (22, 80, 443)
- [ ] **3.5** Swap ekle (2 GB)
- [x] **4.1** Docker kuruldu (`curl -fsSL https://get.docker.com | sh`)
- [x] **4.2** `docker --version` ve `docker compose version` doğrulandı
- [ ] **4.3** `deploy` kullanıcısını docker grubuna ekle
- [ ] **4.4** Docker'ı sistem başlangıcında otomatik başlat (`systemctl enable docker`)
- [ ] **5.1** GitHub deploy key oluştur (özel repo ise)
- [ ] **5.2** Projeyi `/opt/greenleaf` klasörüne klonla
- [ ] **6.1** Cloudflare Origin Certificate oluştur
- [ ] **6.2** Sertifikaları sunucuya yükle (`docker/nginx/ssl/`)
- [ ] **7** `.env.prod` dosyasını oluştur ve doldur
- [ ] **8** `next.config.ts`'e `output: 'standalone'` ekle, commit et, sunucuda pull yap
- [ ] **9** `docker compose -f docker-compose.prod.yml up -d --build` çalıştır
- [ ] **9.2** Tüm container'ların `Up` durumda olduğunu kontrol et
- [ ] **10** Seed data yükle
- [ ] **11.1** GitHub Secrets ekle (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)
- [ ] **12.2** Cloudflare DNS A kayıtları ekle (Proxied ✅)
- [ ] **12.3** SSL/TLS modunu **Full (strict)** yap
- [ ] **12.4** HTTPS yönlendirme aktif et
- [ ] **13.1** Bot Fight Mode aç
- [ ] **13.3** Turnstile widget oluştur, frontend/backend'e entegre et
- [ ] **13.6** (İsteğe bağlı) Sadece Cloudflare IP'lerine izin ver
- [ ] 🎉 **Site canlıda!** `https://tr.greenleafakademi.com` adresini test et

---

*Son güncelleme: Nisan 2026 · Hazırlayan: Greenleaf Dev Team*
