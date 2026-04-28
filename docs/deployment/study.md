# 📚 Greenleaf Academy — Production Deployment: Sıfırdan Uzmana Ders Rehberi

> **👨‍🏫 Öğretmen Notu:** Bu döküman, teknik bilgisi olmayan bir geliştirici öğrenciyi, gerçek bir production sunucusu kurabilecek seviyeye taşımak için yazılmıştır. Her kavramı "neden?" sorusunu sorarak öğreneceğiz. Acele etme, her adımı anla.

---

## 🎯 Bu Derste Ne Öğreneceğiz?

Bir web uygulamasını gerçek kullanıcılara açmak için gereken **tüm altyapıyı** sıfırdan kuracağız:

| Konu | Öğrenilecek |
|------|-------------|
| SSH | Sunucuya güvenli bağlanmak |
| Linux | Sunucu yönetimi temelleri |
| Docker | Uygulamaları izole çalıştırmak |
| Nginx | Trafik yönlendirme (reverse proxy) |
| Cloudflare | SSL, DDoS koruma, DNS |
| GitHub Actions | Otomatik deployment (CI/CD) |
| PostgreSQL + Redis | Veritabanı ve önbellek yönetimi |

---

## 📖 BÖLÜM 0 — Kavramları Anlamak (Temel Bilgi)

### 🔑 Sunucu Nedir?

Şu anda yazdığın kodlar **kendi bilgisayarında** çalışıyor. Bunlar "localhost" ya da "development ortamı" olarak adlandırılır. Peki binlerce kullanıcı uygulamanı kullanmak istediğinde ne olur?

**Cevap:** Kodunu, 7/24 açık olan, internet'e bağlı bir **sunucuya** taşıman gerekir.

Bizim sunucumuz:
```
Hetzner CX23
├── 2 vCPU
├── 4 GB RAM
├── Debian Linux işletim sistemi
└── IP: 178.104.249.164
```

> 💡 **Analoji:** Sunucu, senin uygulamanın "evi" gibidir. Kendi bilgisayarın "geliştirme stüdyon", sunucu ise "gerçek ev"dir. Kullanıcılar sadece gerçek eve gelir.

---

### 🏗️ Uygulamamızın Mimarisi — "Büyük Resim"

Kullanıcı bir web sitesine girdiğinde arka planda neler olduğunu görelim:

```
Kullanıcı (Browser)
       │
       ▼
┌─────────────────┐
│   Cloudflare    │  ← "Güvenlik Görevlisi"
│  (CDN + WAF)    │    Kötü trafiği filtreler, SSL sağlar
└────────┬────────┘
         │ Şifreli HTTPS
         ▼
┌─────────────────────────────────────────────────┐
│  Hetzner Sunucusu (178.104.249.164)             │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  Nginx — "Kapı Görevlisi"               │   │
│  │  tr.greenleafakademi.com → Frontend     │   │
│  │  api.greenleafakademi.com → Backend     │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌──────┐  ┌──────┐  │
│  │Frontend │  │Backend  │  │  DB  │  │Redis │  │
│  │Next.js  │  │FastAPI  │  │ PG   │  │Cache │  │
│  │:3000    │  │:8000    │  │:5432 │  │:6379 │  │
│  └─────────┘  └─────────┘  └──────┘  └──────┘  │
│           (Docker iç ağı — dışarıya kapalı)    │
└─────────────────────────────────────────────────┘
```

**Şimdi şunu sor kendinize:** "Nginx neden var? Frontend ve Backend'e direkt bağlansak olmaz mı?"

**Cevap:** Nginx olmadan her servise ayrı port numarasıyla bağlanmak zorunda kalırsın:
- `http://178.104.249.164:3000` → Frontend
- `http://178.104.249.164:8000` → Backend

Bu hem çirkin hem de güvensiz! Nginx ile:
- `https://tr.greenleafakademi.com` → Otomatik Frontend'e yönlendirir
- `https://api.greenleafakademi.com` → Otomatik Backend'e yönlendirir

---

### 🐳 Docker Nedir? Neden Kullanıyoruz?

> 💡 **Analoji:** Docker, her uygulamayı kendi "kapsülüne" (container) koyar. Sanki her uygulama ayrı bir küçük bilgisayarda çalışıyor gibi. Bu sayede:
> - "Bende çalışıyor, sende neden çalışmıyor?" problemi ortadan kalkar
> - Uygulamalar birbirini etkilemez
> - Başlatmak/durdurmak çok kolaydır

Docker'da öğrenmemiz gereken terimler:

| Terim | Anlam | Gerçek Hayat Analogisi |
|-------|-------|------------------------|
| **Image** | Uygulama şablonu (tarif) | Yemek tarifi |
| **Container** | Çalışan uygulama (tarifi pişirince) | Hazır yemek |
| **Volume** | Kalıcı veri depolama | Buzdolabı |
| **Network** | Container'lar arası iletişim | Dahili telefon hattı |
| **Docker Compose** | Birden fazla container'ı yönetme | Orkestra şefi |

---

## 📖 BÖLÜM 1 — SSH ile Sunucuya Bağlanmak

### SSH Nedir?

**SSH (Secure Shell)** — Sunucuya güvenli, şifreli bir terminal bağlantısı kurmanı sağlar. Sunucunun başında oturuyormuş gibi komut çalıştırabilirsin.

### 1.1 SSH Anahtarı Oluşturmak

Sunucuya bağlanmak için iki yöntem var:
1. **Şifre ile bağlantı** → Güvensiz, otomatize edilemez
2. **SSH anahtarı ile bağlantı** ✅ → Güvenli, otomatize edilebilir

SSH anahtarı nasıl çalışır?

```
Sen (özel anahtar)  ↔  Sunucu (genel anahtar)
"Özel kilit"              "Kapı kilidi"
```

Özel anahtar sende, genel anahtar sunucuda olur. Eşleşirse kapı açılır.

**Anahtar çifti oluştur:**
```bash
ssh-keygen -t ed25519 -C "greenleaf-deploy"
```

Komutun parçaları:
- `ssh-keygen` → SSH anahtar oluşturucu program
- `-t ed25519` → Şifreleme algoritması (modern, güvenli)
- `-C "greenleaf-deploy"` → Açıklama/yorum (hangisi olduğunu hatırlamak için)

Bu komut iki dosya oluşturur:
```
~/.ssh/
├── id_ed25519      ← ÖZELanahtar (ASLA paylaşma! Bu senin kimliğin)
└── id_ed25519.pub  ← GENEL anahtar (sunucuya koyacağız)
```

> ⚠️ **KRİTİK DERS:** Özel anahtarı (`id_ed25519`) hiçbir zaman, hiç kimseyle, hiçbir şekilde paylaşma. Bu senin dijital kimlik kartın gibi.

**Genel anahtarı görüntüle:**
```bash
cat ~/.ssh/id_ed25519.pub
```

Çıktı şöyle görünür:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOxxx...çok uzun bir string...xxx greenleaf-deploy
```

Bu içeriği **Hetzner Cloud Console → Security → SSH Keys** kısmına ekle.

---

### 1.2 Sunucuya İlk Bağlantı

```bash
ssh root@178.104.249.164
```

- `root` → Sunucudaki en yetkili kullanıcı (admin)
- `178.104.249.164` → Sunucunun IP adresi

İlk bağlantıda şu soruyu sorar:
```
The authenticity of host '178.104.249.164' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Bu normal. `yes` yaz ve Enter'a bas.

> 💡 **Soru:** "Root neden tehlikeli?" diye sorabilirsin.
> Root her şeyi yapabilir: dosya silmek, sistemi kapatmak, her şeyi bozmak. Bu yüzden günlük işler için ayrı bir kullanıcı oluşturacağız.

---

## 📖 BÖLÜM 2 — Linux Sunucu Kurulumu

### 2.1 Sistemi Güncellemek

Taze kurulmuş bir Debian sunucusu, güncellenmeyi bekleyen paketlerle gelir. Güvenlik açıkları olabilir!

```bash
apt-get update && apt-get upgrade -y
```

Parçaları analiz edelim:
- `apt-get update` → Paket listelerini güncelle (hangi paketler mevcut?)
- `apt-get upgrade -y` → Güncel olmayan paketleri güncelle (`-y` = onaylama sorma, direkt yap)
- `&&` → Soldaki başarılı olursa sağdakini çalıştır

> ⏱️ Bu işlem birkaç dakika sürebilir. Sabırlı ol.

### 2.2 Temel Araçları Kurmak

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

Her aracın görevi:

| Araç | Ne İşe Yarar? |
|------|---------------|
| `curl` | URL'den veri indirme (web istekleri) |
| `git` | Versiyon kontrol sistemi |
| `ca-certificates` | SSL sertifikalarını doğrulamak için |
| `gnupg` | Şifreleme ve imzalama |
| `lsb-release` | Linux dağıtımı bilgisi |
| `ufw` | Firewall yönetimi (Uncomplicated Firewall) |
| `htop` | İnteraktif sistem monitörü |
| `nano` | Terminal metin editörü |

> 💡 **Ders:** `\` karakteri komutu bir sonraki satırda devam ettirmek içindir. Uzun komutları okunabilir yapar.

---

### 2.3 Deploy Kullanıcısı Oluşturmak

**Neden root ile çalışmamalıyız?**

Root ile her komut çalıştırmak şuna benzer: sabah kahveni hazırlamak için nükleer savaş başlatma yetkisine sahip birisini kullanmak. Gereksiz risk!

```bash
# deploy kullanıcısı oluştur
adduser deploy
```

Bu komut şunları sorar:
- Şifre (güçlü bir şifre gir ve bir yere yaz!)
- Ad, telefon vs. → Enter'a bas, atlayabilirsin

```bash
# deploy kullanıcısını sudo grubuna ekle
# (gerektiğinde root yetkisiyle komut çalıştırabilsin)
usermod -aG sudo deploy
```

`-aG sudo` = "append to Group sudo" → sudo grubuna ekle

```bash
# SSH key'i deploy kullanıcısına kopyala
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

İzin sistemini öğrenelim (`chmod`):

```
700 = rwx------ → Sadece sahip okuyabilir/yazabilir/çalıştırabilir
600 = rw------- → Sadece sahip okuyabilir/yazabilir
644 = rw-r--r-- → Sahip yazar, herkes okur
```

> 🔐 **Güvenlik Prensibi:** Minimum yetki prensibi — Her kullanıcı/program sadece yapması gereken işi yapabilecek kadar yetkiye sahip olmalı.

**Test et:**
```bash
ssh deploy@178.104.249.164
# Yeni terminal aç ve deploy kullanıcısıyla bağlan
```

---

### 2.4 Firewall — UFW ile Ağ Güvenliği

Firewall, sunucuna gelen/giden trafiği filtreleyen bir "kapı görevlisi"dir.

```
İnternet → [UFW Firewall] → Sunucu
               ↑
           Sadece izin verilen portlardan geçer
```

**Portlar nedir?**

Bilgisayar aynı anda birçok bağlantı kabul edebilir. Her bağlantı türü farklı bir "kapıdan" (port) geçer:

| Port | Kullanım |
|------|----------|
| 22 | SSH bağlantısı |
| 80 | HTTP (şifresiz web) |
| 443 | HTTPS (şifreli web) |
| 5432 | PostgreSQL (DB — dışarıya kapalı!) |
| 6379 | Redis (cache — dışarıya kapalı!) |

```bash
# Önce her şeyi sıfırla
ufw --force reset

# SSH mutlaka açık olsun (bunu kapatırsan sunucuya giremezsin!)
ufw allow 22/tcp

# Web trafiği
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall'u aktif et
ufw --force enable

# Durumu kontrol et
ufw status
```

> ⚠️ **KRİTİK UYARI:** Firewall'u etkinleştirmeden ÖNCE `ufw allow 22/tcp` komutunu çalıştır. Aksi halde sunucuya bir daha giremezsin ve Hetzner konsol üzerinden elle müdahale etmek zorundasın.

---

### 2.5 Swap Alanı — Sanal RAM

**RAM neden yetmez?**

Sunucumuzda 4 GB RAM var. Next.js gibi frontend uygulamalar build sırasında çok fazla bellek kullanır. Bellek biterse uygulama çöker!

**Swap nedir?**

Disk üzerindeki bir alan, RAM dolduğunda geçici bellek olarak kullanılır. Yavaştır ama çökmekten iyidir.

```bash
# 2 GB swap alanı oluştur
fallocate -l 2G /swapfile    # 2 GB boş dosya oluştur
chmod 600 /swapfile           # Güvenli izinler
mkswap /swapfile              # Swap formatına çevir
swapon /swapfile              # Aktif et

# Sunucu yeniden başlayınca da aktif olsun
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Kontrol et
free -h
```

Beklenen çıktı:
```
              total        used        free
Mem:          3.8Gi        ...         ...
Swap:         2.0Gi        0           2.0Gi
```

---

## 📖 BÖLÜM 3 — Docker Kurulumu

### 3.1 Docker Nasıl Kurulur?

En kolay yöntem — "convenience script":

```bash
curl -fsSL https://get.docker.com | sh
```

Bu ne yapıyor?
- `curl -fsSL` → URL'yi indir (`-f` = başarısız olursa dur, `-s` = sessiz mod, `-S` = hata göster, `-L` = yönlendirmeleri takip et)
- `https://get.docker.com` → Docker'ın resmi kurulum scripti
- `| sh` → İndirilen scripti direkt çalıştır

```bash
# Docker Compose plugin (modern yöntem)
apt install -y docker-compose-plugin

# Güvenlik güncellemeleri otomatik yüklensin
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 3.2 Docker'ı Test Et

```bash
docker --version
# Örn: Docker version 27.3.1

docker compose version
# Örn: Docker Compose version v2.29.7
```

### 3.3 deploy Kullanıcısına Docker İzni Ver

```bash
usermod -aG docker deploy
```

Bu olmadan deploy kullanıcısı `sudo docker` demek zorunda kalır. Eklediğimizde direkt `docker` diyebilir.

> ⚠️ Bu değişiklik için çıkış yapıp tekrar giriş yapman gerekir:
> ```bash
> su - deploy    # deploy kullanıcısına geç
> docker ps      # test et
> ```

### 3.4 Docker'ı Otomatik Başlat

```bash
systemctl enable docker    # Sistem açılışında başlasın
systemctl start docker     # Şimdi başlat
```

`systemctl` = Linux'ta servis yönetim aracı

---

## 📖 BÖLÜM 4 — Projeyi Sunucuya Taşımak

### 4.1 GitHub Deploy Key (Özel Repo İçin)

Sunucu GitHub'dan kodu çekmek için giriş yapması gerekiyor. Ama sunucuya şifre yazamayız! Çözüm: **Deploy Key**.

```
Sunucu (deploy key ile)  →  GitHub Repo  →  Kod çek
```

**Sunucuda deploy kullanıcısıyla:**
```bash
ssh-keygen -t ed25519 -C "hetzner-deploy-key" -f ~/.ssh/github_deploy -N ""
```

- `-f ~/.ssh/github_deploy` → Özel dosya adı (varsayılanı değiştir)
- `-N ""` → Boş passphrase (otomatik işlemler için gerekli)

**Genel anahtarı görüntüle:**
```bash
cat ~/.ssh/github_deploy.pub
```

**GitHub'da:**
1. Repo → Settings → Deploy keys → Add deploy key
2. Başlık: `Hetzner Production Server`
3. Key: yukarıdaki çıktıyı yapıştır
4. "Allow write access" → KAPALI kal (okuma yeterli!)

**SSH config dosyası oluştur:**
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

Bu dosya SSH'a "github.com'a bağlanırken bu anahtarı kullan" diyoruz.

### 4.2 Projeyi Klonla

```bash
# Proje dizini oluştur (root olarak)
sudo mkdir -p /opt/greenleaf
sudo chown deploy:deploy /opt/greenleaf

# deploy kullanıcısına geç
su - deploy
cd /opt/greenleaf

# Repoyu klonla
git clone git@github.com:KULLANICI/REPO.git .
```

> 💡 Komutun sonundaki `.` (nokta) = "bu dizine klonla, alt klasör oluşturma"

---

## 📖 BÖLÜM 5 — SSL Sertifikası (Cloudflare Origin Certificate)

### SSL Nedir? Neden Gerekli?

```
SSL OLMADAN:
Kullanıcı ──── şifresiz HTTP ────▶ Sunucu
                  ↑
          Hacker ortada dinleyebilir! (Man-in-the-middle)

SSL İLE:
Kullanıcı ──── şifreli HTTPS ───▶ Sunucu
                  ↑
          Şifreli, hacker göremez!
```

### Cloudflare'in Rolü

Biz **Cloudflare Origin Certificate** kullanıyoruz. Bu özel bir sertifika çeşidi:

```
Kullanıcı ←──── Cloudflare'in sertifikası ────→ Cloudflare
Cloudflare ←── Origin Certificate (bizimki) ──→ Sunucu
```

**Avantajı:** 15 yıl geçerli ve ücretsiz!

### 5.1 Cloudflare'de Sertifika Oluştur

1. [dash.cloudflare.com](https://dash.cloudflare.com) → `greenleafakademi.com` seç
2. Sol menü → **SSL/TLS → Origin Server**
3. **Create Certificate** tıkla
4. Seçenekler:
   - Private key type: **RSA (2048)**
   - Hostnames: `*.greenleafakademi.com` ve `greenleafakademi.com`
   - Validity: **15 years**
5. **Create** tıkla

Sana iki şey verecek:
- **Origin Certificate** (`cloudflare-origin.pem`) → Genel sertifika
- **Private Key** (`cloudflare-origin-key.pem`) → Gizli anahtar

> ⚠️ Bu sayfayı kapattıktan sonra Private Key'e bir daha **erişemezsin**! Hemen not al!

### 5.2 Sertifikaları Sunucuya Yükle

```bash
# SSL klasörü oluştur
mkdir -p /opt/greenleaf/greenleaf-academy/docker/nginx/ssl

# Sertifikayı kaydet
nano /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin.pem
# Cloudflare'den kopyaladığın "Origin Certificate" içeriğini yapıştır
# Kaydet: Ctrl+X → Y → Enter

# Private key'i kaydet
nano /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin-key.pem
# "Private Key" içeriğini yapıştır
# Kaydet: Ctrl+X → Y → Enter

# İzinleri ayarla
chmod 600 /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin-key.pem
chmod 644 /opt/greenleaf/greenleaf-academy/docker/nginx/ssl/cloudflare-origin.pem
```

> `nano` editörünü kullanmayı öğren:
> - Yazı yaz → normal gibi
> - Çıkış: `Ctrl+X`
> - Kaydet: `Y`
> - Dosya adını onayla: `Enter`

---

## 📖 BÖLÜM 6 — Environment Variables (.env.prod)

### Environment Variable Nedir?

Kod içine yazılmaması gereken hassas bilgileri (şifreler, API anahtarları) tutmak için kullanılır.

**Neden kod içine yazmamalıyız?**

```python
# YANLIŞ! — Asla yapma!
DB_PASSWORD = "super_secret_123"  # Bu kod GitHub'a gider, herkes görür!

# DOĞRU!
DB_PASSWORD = os.getenv("DB_PASSWORD")  # Değer dışarıdan gelir
```

### .env.prod Dosyası Oluştur

```bash
nano /opt/greenleaf/greenleaf-academy/.env.prod
```

İçeriği:

```env
# ── PostgreSQL Veritabanı ───────────────────────
POSTGRES_USER=greenleaf
POSTGRES_PASSWORD=GUCLU_SIFRE_YAZ     # aşağıda nasıl üreteceğini göreceksin
POSTGRES_DB=greenleaf_db

# ── Backend (FastAPI) ───────────────────────────
APP_ENV=production
JWT_SECRET_KEY=UZUN_RANDOM_STRING      # JSON Web Token için gizli anahtar
DATABASE_URL=postgresql+asyncpg://greenleaf:SIFREN@postgres:5432/greenleaf_db
REDIS_URL=redis://redis:6379/0

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

GMAIL_CLIENT_ID=GOOGLE_CLOUD_CONSOLEDEN_AL
GMAIL_CLIENT_SECRET=GOOGLE_CLOUD_CONSOLEDEN_AL
GMAIL_REFRESH_TOKEN=OAUTH_PLAYGROUND_DAN_AL
MAIL_FROM_ADDRESS=noreply@greenleafakademi.com
MAIL_FROM_NAME=Greenleaf Akademi

GREENLEAF_GLOBAL_API_URL=https://greenleaf-global.com/office/login

UPLOAD_DIR=/var/data/uploads

FRONTEND_URL=https://tr.greenleafakademi.com
CORS_ALLOWED_ORIGIN_REGEX=https?://([a-z0-9-]+\.)*greenleafakademi\.com

# ── Frontend (Next.js) ──────────────────────────
NEXT_PUBLIC_BACKEND_URL=http://backend:8000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Güvenli Şifre Üretmek

```bash
# 32 byte (güçlü) şifre üret — PostgreSQL için
openssl rand -hex 32
# Örnek çıktı: a3f8b2c1d4e9f0a5b6c7d8e9f0a1b2c3...

# 64 byte secret üret — JWT için
openssl rand -hex 64
```

> 💡 **Önemli:** `DATABASE_URL` içindeki `SIFREN` kısmını, ürettiğin `POSTGRES_PASSWORD` ile aynı yap!

---

## 📖 BÖLÜM 7 — Next.js Standalone Modu

### Neden "Standalone" Modu?

Normal Next.js build'i `node_modules` klasörünü de içerir (yüzlerce MB!). Docker image'ı gereksiz büyür.

`output: 'standalone'` ayarı ile Next.js sadece gerçekten ihtiyaç duyduğu dosyaları üretir. Docker image küçülür, dağıtım hızlanır.

**`greenleaf-academy/frontend/next.config.ts` dosyasındaki değişiklik:**

```typescript
const nextConfig: NextConfig = {
  output: "standalone",   // ← BU SATIRI EKLE
  // ... diğer ayarlar
};
```

Değişikliği commit et:
```bash
git add frontend/next.config.ts
git commit -m "feat: add standalone output for Docker production build"
git push origin main
```

Sunucuda güncelle:
```bash
cd /opt/greenleaf/greenleaf-academy
git pull origin main
```

---

## 📖 BÖLÜM 8 — İlk Deploy (Uygulamayı Başlatmak)

### Docker Compose Nedir? Derinlemesine Anlayalım

`docker-compose.prod.yml` dosyası, tüm servislerimizi tanımlar. Sanki bir "orkestra partisyonu" gibi:

```yaml
# Basitleştirilmiş örnek
services:
  frontend:
    build: ./frontend          # Bu klasördeki Dockerfile'ı kullan
    expose:
      - "3000"                 # Sadece iç ağa aç

  backend:
    build: ./backend
    expose:
      - "8000"

  postgres:
    image: postgres:16         # Hazır image kullan
    volumes:
      - pg_data:/var/lib/postgresql/data  # Veri kalıcı olsun

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"                # Dışa aç: sunucu_port:container_port
      - "443:443"
```

### 8.1 Tüm Servisleri Başlat

```bash
cd /opt/greenleaf/greenleaf-academy

docker compose -f docker-compose.prod.yml up -d --build
```

Parametreler:
- `-f docker-compose.prod.yml` → Hangi compose dosyasını kullan
- `up` → Servisleri başlat
- `-d` → Detached mode (arka planda çalış, terminal'i bloklamaz)
- `--build` → Image'ları yeniden build et (kod değişikliklerini yansıt)

> ⏱️ İlk çalıştırmada 5-15 dakika sürebilir. Docker her şeyi indirip build eder.

### 8.2 Servislerin Durumunu Kontrol Et

```bash
docker compose -f docker-compose.prod.yml ps
```

Beklenen çıktı:
```
NAME                    STATUS          PORTS
greenleaf-nginx-1       running         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
greenleaf-frontend-1    running
greenleaf-backend-1     running
greenleaf-postgres-1    running (healthy)
greenleaf-redis-1       running (healthy)
```

Eğer bir servis `Exit` durumundaysa sorun var demektir.

### 8.3 Logları Okumak

```bash
# Tüm servisler (Ctrl+C ile çıkılır):
docker compose -f docker-compose.prod.yml logs -f

# Sadece backend:
docker compose -f docker-compose.prod.yml logs -f backend

# Son 50 satır:
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

Log okuma sanatı:
```
greenleaf-backend-1  | INFO:     Application startup complete.    ← İyi!
greenleaf-backend-1  | ERROR:    Connection refused               ← Sorun!
greenleaf-backend-1  | WARNING:  deprecated function used         ← Dikkat!
```

### 8.4 Hızlı Test

```bash
# HTTP çalışıyor mu?
curl -I http://localhost

# Backend health endpoint:
docker compose -f docker-compose.prod.yml exec backend \
  curl -s http://localhost:8000/health
```

---

## 📖 BÖLÜM 9 — Veritabanı İlk Verisi

### Migration Nedir?

Veritabanı şemasını (tablolar, sütunlar) kod ile yönetmek için kullanılır. Alembic (Python için) bunu yapar.

```
Kod değişikliği → Migration dosyası → Veritabanı güncelleme
```

Migration'lar backend başlarken otomatik çalışır. Ama başlangıç verilerini (kullanıcılar, ayarlar vs.) manuel yükleriz:

```bash
# Temel başlangıç verileri
docker compose -f docker-compose.prod.yml exec backend \
  python seed_initial_data.py

# Tenant (kiracı) verileri
docker compose -f docker-compose.prod.yml exec backend \
  python seed_tenant.py
```

> ⚠️ Bu komutları sadece **bir kez** çalıştır! Tekrar çalıştırırsan çift veri oluşabilir.

---

## 📖 BÖLÜM 10 — GitHub Actions ile Otomatik Deploy (CI/CD)

### CI/CD Nedir?

**CI** = Continuous Integration (Sürekli Entegrasyon)
**CD** = Continuous Deployment (Sürekli Dağıtım)

```
Sen kod yazar → GitHub'a push yaparsın
                          ↓
              GitHub Actions tetiklenir
                          ↓
              Test çalışır (CI)
                          ↓
              Sunucuya deploy edilir (CD)
                          ↓
              Kullanıcılar yeni versiyonu görür
```

Artık elle `git pull`, `docker compose up` yapmak zorunda değilsin!

### 10.1 GitHub Secrets — Güvenli Değişkenler

GitHub Actions'ın sunucuna bağlanabilmesi için şu bilgilere ihtiyacı var:
- Sunucu IP'si
- Kullanıcı adı
- SSH private key

Bunları **GitHub Secrets** olarak saklıyoruz (şifreli, güvenli):

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. **New repository secret**

| Secret Adı | Değer |
|------------|-------|
| `SSH_HOST` | `178.104.249.164` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | `cat ~/.ssh/id_ed25519` çıktısının tamamı |
| `SSH_PORT` | `22` |

**SSH Private Key'i kopyalamak için:**
```bash
cat ~/.ssh/id_ed25519
```

`-----BEGIN OPENSSH PRIVATE KEY-----` ile başlayan tüm içeriği kopyala.

### 10.2 Workflow Nasıl Çalışır?

`.github/workflows/deploy.yml` dosyası tanımlı. İçeriği şöyle çalışır:

```
Main branch'e push →
  1. GitHub Actions server'ı tetiklenir
  2. SSH ile sunucuya bağlanır
  3. git pull çalıştırır
  4. docker compose up --build çalıştırır
  5. Eski image'ları temizler
```

### 10.3 Manuel Tetikle (Test İçin)

1. GitHub → **Actions** sekmesi
2. **🚀 Deploy to Hetzner (Production)**
3. **Run workflow** → **Run workflow**

---

## 📖 BÖLÜM 11 — Cloudflare DNS ve Güvenlik

### DNS Nedir?

Telefon rehberi gibi düşün:
```
tr.greenleafakademi.com  →  178.104.249.164
```

İnsan "tr.greenleafakademi.com" yazar → DNS "178.104.249.164" adresine yönlendirir.

### 11.1 DNS Kayıtları Ekle

Cloudflare Dashboard → **DNS → Records**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `tr` | `178.104.249.164` | ✅ Proxied |
| A | `api` | `178.104.249.164` | ✅ Proxied |
| A | `@` | `178.104.249.164` | ✅ Proxied |

**"Proxied" ne demek?**

```
Proxied (turuncu bulut) = Trafik Cloudflare üzerinden geçer
  → DDoS koruması
  → Bot filtresi
  → Cache
  → Gerçek sunucu IP'si gizli kalır

DNS only (gri bulut) = Trafik direkt sunucuya gider
  → Koruma yok
  → IP açıkta
```

### 11.2 SSL Modu — Full (Strict)

**SSL/TLS → Overview → Full (strict)** seç.

Modlar arası fark:
```
Flexible:      Kullanıcı↔Cloudflare: HTTPS, Cloudflare↔Sunucu: HTTP (şifresiz!)
Full:          Her iki taraf HTTPS ama sertifika doğrulanmaz
Full (Strict): Her iki taraf HTTPS + Sertifika doğrulanır ✅ (En Güvenli)
```

### 11.3 HTTPS Yönlendirme

**SSL/TLS → Edge Certificates:**

- **Always Use HTTPS:** ✅ ON — HTTP gelirse HTTPS'e yönlendir
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** ✅ ON
- **HSTS:** Enable — Browser'a "Bu site sadece HTTPS" talimatı ver

---

## 📖 BÖLÜM 12 — Bot ve DDoS Koruması

### Bot Nedir?

İnternette "botlar" var. Bazıları iyi (Google arama botu), bazıları kötü:
- Spam botları
- Veri kazıyıcı (scraper)
- Şifre deneyen botlar (brute force)
- DDoS saldırı botları (sunucuyu çökertmek)

### 12.1 Bot Fight Mode

**Security → Bots → Bot Fight Mode:** ✅ ON

Bu ücretsiz ve temel bot koruması sağlar.

### 12.2 WAF — Web Application Firewall

Özel kurallar yazabiliriz:

**Kural 1: Scrapy botlarını engelle**
```
Field: User Agent
Operator: contains
Value: scrapy
Action: Block
```

**Kural 2: Rate Limiting (Hız Sınırı)**
```
URL: api.greenleafakademi.com/*
Limit: 100 istek / dakika
Action: 1 saat blokla
```

> 💡 **Neden Rate Limiting?** Brute force saldırıları dakikada binlerce şifre dener. Biz 100 ile sınırlarsak, saldırı etkisiz kalır.

### 12.3 Cloudflare Turnstile (Captcha)

Google reCAPTCHA gibi ama daha iyi:
- Kullanıcıyı yormaz (görünmez çalışır)
- Gizlilik odaklı
- Ücretsiz

**Kurulum:**
1. Cloudflare Dashboard → **Turnstile → Add Site**
2. İki key alısın: **Site Key** (frontend'de) ve **Secret Key** (backend'de)

Frontend'e ekle:
```tsx
import { Turnstile } from "@marsidev/react-turnstile";

<Turnstile
  siteKey="SITE_KEY_BURAYA"
  onSuccess={(token) => setTurnstileToken(token)}
/>
```

### 12.4 Sadece Cloudflare IP'lerine İzin Ver

Bu gelişmiş bir güvenlik adımı. Doğrudan sunucu IP'sine erişimi kapatıyoruz:

```bash
# Önce genel HTTP/HTTPS erişimini kapat
ufw delete allow 80/tcp
ufw delete allow 443/tcp

# Sadece Cloudflare IP'lerine izin ver
for ip in \
  103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 \
  104.16.0.0/13 104.24.0.0/14 108.162.192.0/18 \
  131.0.72.0/22 141.101.64.0/18 162.158.0.0/15 \
  172.64.0.0/13 173.245.48.0/20 188.114.96.0/20 \
  190.93.240.0/20 197.234.240.0/22 198.41.128.0/17; do
  ufw allow from $ip to any port 80,443 proto tcp
done

ufw reload
```

Artık `178.104.249.164:443`'e direkt bağlanmak mümkün değil. Sadece Cloudflare üzerinden ulaşılabilir.

---

## 📖 BÖLÜM 13 — Günlük Bakım ve Yönetim Komutları

### Container Yönetimi

```bash
# Servislerin durumunu gör
docker compose -f docker-compose.prod.yml ps

# Tüm loglar (canlı)
docker compose -f docker-compose.prod.yml logs -f

# Son N satır log
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Bir servisi yeniden başlat
docker compose -f docker-compose.prod.yml restart backend

# Tüm servisleri durdur
docker compose -f docker-compose.prod.yml down

# ⚠️ DİKKAT: Veri de silinir!
docker compose -f docker-compose.prod.yml down -v
```

### Manuel Deploy

```bash
cd /opt/greenleaf/greenleaf-academy
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f    # Eski image'ları temizle
```

### Veritabanı İşlemleri

```bash
# PostgreSQL'e bağlan
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U greenleaf -d greenleaf_db

# Veritabanı yedeği al
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U greenleaf greenleaf_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

> 💡 `$(date +%Y%m%d_%H%M%S)` → Tarihi dosya adına ekler: `backup_20260421_143022.sql`

### Disk ve Kaynak Takibi

```bash
# Disk durumu
df -h

# Docker ne kadar yer kaplıyor
docker system df

# Docker cache ve kullanılmayanları temizle
docker system prune -a -f

# CPU ve RAM izle (interaktif)
htop

# Container başına kaynak
docker stats
```

---

## 📖 BÖLÜM 14 — Sorun Giderme (Troubleshooting)

### Container başlamıyor

**İlk yapılacak iş: Logları oku!**

```bash
docker compose -f docker-compose.prod.yml logs backend
```

Log okurken ara:
- `ERROR` → Hata
- `Connection refused` → Bağlantı sorunu (DB hazır olmadan önce mi başladı?)
- `No such file` → Dosya bulunamadı

```bash
# Container'ın içine gir ve araştır
docker compose -f docker-compose.prod.yml exec backend bash
# İçerdeyken:
ls -la                # Dosyalar var mı?
env | grep DATABASE   # Env var'lar set mi?
```

### Yaygın Hatalar ve Çözümleri

| Hata | Neden | Çözüm |
|------|-------|-------|
| `.env.prod: no such file` | Dosya oluşturulmamış | `nano .env.prod` ile oluştur |
| `SSL: certificate not found` | Sertifika yüklenmemiş | Bölüm 5'e git |
| `502 Bad Gateway` | Backend çalışmıyor | `logs -f backend` ile bak |
| `Connection refused (postgres)` | DB başlamadan önce app | Container sıralamasını kontrol et |
| `disk full` | Docker cache doldu | `docker system prune -a -f` |

### Nginx Sorunları

```bash
# Nginx config'i test et (sözdizimi hatası var mı?)
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Nginx'i yeniden yükle (restart gerekmez)
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### GitHub Actions Başarısız

1. GitHub → Actions → Başarısız olan workflow → Kırmızı X
2. Hata mesajını oku
3. Yaygın sebepler:
   - SSH key yanlış girilmiş
   - Sunucuda disk dolu
   - Git pull için izin yok

---

## 📝 Hızlı Başvuru — Komut Kartı

```bash
# ═══ DURUM KONTROL ═══════════════════════════════════
docker compose -f docker-compose.prod.yml ps          # Servisler
docker compose -f docker-compose.prod.yml logs -f     # Canlı log
docker stats                                           # Kaynak kullanımı
df -h                                                  # Disk durumu

# ═══ DEPLOY ══════════════════════════════════════════
cd /opt/greenleaf/greenleaf-academy
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# ═══ YENİDEN BAŞLATMA ════════════════════════════════
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx

# ═══ TEMİZLİK ════════════════════════════════════════
docker system prune -a -f                             # Cache temizle
docker image prune -f                                  # Eski image'ları sil

# ═══ VERİTABANI ══════════════════════════════════════
# Yedek al:
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U greenleaf greenleaf_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Bağlan:
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U greenleaf -d greenleaf_db
```

---

## ✅ Deployment Kontrol Listesi

> Bu listeyi kullanarak eksik adım bırakmadığından emin ol:

- [ ] **SSH Anahtarı** oluşturuldu ve Hetzner'e eklendi
- [ ] **Sunucuya SSH** ile bağlantı test edildi (`root`)
- [ ] **`apt update && apt upgrade -y`** çalıştırıldı
- [ ] **Temel araçlar** kuruldu
- [ ] **`deploy` kullanıcısı** oluşturuldu ve test edildi
- [ ] **Firewall** ayarlandı (22, 80, 443)
- [ ] **Swap** eklendi (2 GB)
- [ ] **Docker** kuruldu ve test edildi
- [ ] **`deploy` kullanıcısı** docker grubuna eklendi
- [ ] **GitHub Deploy Key** oluşturuldu (özel repo ise)
- [ ] **Proje** `/opt/greenleaf` klasörüne klonlandı
- [ ] **Cloudflare Origin Certificate** oluşturuldu
- [ ] **Sertifikalar** sunucuya yüklendi
- [ ] **`.env.prod`** oluşturuldu ve dolduruldu
- [ ] **`next.config.ts`** `output: 'standalone'` eklendi
- [ ] **`docker compose up --build`** çalıştırıldı
- [ ] **Tüm containerlar** `running` durumda
- [ ] **Seed data** yüklendi
- [ ] **GitHub Secrets** eklendi
- [ ] **Cloudflare DNS** kayıtları eklendi (Proxied ✅)
- [ ] **SSL modu** Full (strict) yapıldı
- [ ] **Always Use HTTPS** aktif
- [ ] **Bot Fight Mode** açık
- [ ] **Turnstile** entegre edildi
- [ ] 🎉 **Site canlıda!**

---

## 🧪 Öğrendiklerini Test Et

Aşağıdaki soruları cevaplayabiliyorsan, bu bölümü öğrenmişsin demektir:

1. SSH ile şifre yerine neden anahtar kullanıyoruz?
2. `chmod 600` ve `chmod 700` arasındaki fark nedir?
3. Nginx olmadan ne tür sorunlarla karşılaşırız?
4. Docker Volume olmadan veritabanı verileri neden kaybolur?
5. "Full (Strict)" SSL modu "Flexible"dan neden daha güvenli?
6. Rate Limiting neden önemlidir?
7. `.env.prod` neden `.gitignore`'da?
8. swap alanı neden gerekli?
9. `docker system prune -a -f` ne yapar, riski var mı?
10. GitHub Actions deploy'u nasıl tetikler?

---

## 📚 İleri Seviye Konular (Bonus)

İleriyi düşünenler için:

- **Monitoring:** Grafana + Prometheus ile görsel izleme
- **Log yönetimi:** Loki + Grafana ile merkezi log toplama
- **Otomatik yedekleme:** Cron job ile günlük DB backup → S3/Backblaze
- **Horizontal scaling:** Load balancer + birden fazla sunucu
- **Kubernetes:** Docker Compose'un güçlü ağabeyi
- **Zero-downtime deploy:** Blue-green deployment stratejisi

---

*📖 Bu ders notu, `instruction.md` dökümanından ilham alınarak öğretim amaçlı yazılmıştır.*  
*Son güncelleme: Nisan 2026 · Greenleaf Academy DevOps Eğitim Serisi*
